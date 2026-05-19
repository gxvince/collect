import { Controller, Dependencies, Get, Post, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

@Controller({ path: 'api/auth', scope: Scope.REQUEST })
@Dependencies(REQUEST, AuthService)
export class AuthController {
  constructor(request, authService) {
    this.request = request;
    this.authService = authService;
  }

  getTokenFromHeader() {
    const auth = this.request.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return null;
    }
    return auth.slice(7).trim();
  }

  @Post('login')
  async login() {
    const { username, password } = this.request.body || {};
    if (!username || !password) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const user = await this.authService.validateUser(username, password);
    if (!user) {
      return { code: 401, data: null, message: '账号或密码错误' };
    }

    if (user.role !== 'admin') {
      const locked = await this.authService.hasUserDisabledSites(user.id);
      if (locked) {
        return { code: 401, data: null, message: '账号已失效，请联系管理员' };
      }
    }

    const accessToken = this.authService.signAccessToken(user);
    const refreshToken = this.authService.signRefreshToken(user);
    const sites = await this.authService.getUserSites(user);
    const pagePermissions =
      await this.authService.getUserSitePagePermissions(user);
    const sitePages = await this.authService.getUserSitePagesWithNames(user);
    await this.authService.storeRefreshToken(user.id, refreshToken);

    return {
      code: 0,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: { id: user.id, username: user.username, role: user.role },
        site_ids: sites.map((site) => site.site_id),
        sites,
        site_page_ids: pagePermissions.site_page_ids,
        site_page_rules: pagePermissions.site_page_rules,
        site_pages: sitePages,
      },
      message: '登录成功',
    };
  }

  @Post('refresh')
  async refresh() {
    const { refresh_token: refreshToken } = this.request.body || {};
    if (!refreshToken) {
      return { code: 422, data: null, message: '参数错误' };
    }

    try {
      const payload = await this.authService.verifyRefreshToken(refreshToken);
      if (!payload || payload.token_type !== 'refresh') {
        return { code: 401, data: null, message: 'refresh token 无效' };
      }

      const active = await this.authService.isRefreshTokenActive(refreshToken);
      if (!active) {
        return { code: 401, data: null, message: 'refresh token 无效' };
      }

      const tokenUser = await this.authService.findUserById(payload.user_id);
      if (!tokenUser || tokenUser.is_deleted) {
        return { code: 401, data: null, message: '账号已失效，请联系管理员' };
      }
      if (tokenUser.role !== 'admin') {
        const locked = await this.authService.hasUserDisabledSites(tokenUser.id);
        if (locked) {
          return { code: 401, data: null, message: '账号已失效，请联系管理员' };
        }
      }

      const accessToken = this.authService.signAccessToken({
        id: payload.user_id,
        role: payload.role,
      });

      return {
        code: 0,
        data: { access_token: accessToken },
        message: '刷新成功',
      };
    } catch (error) {
      return { code: 401, data: null, message: 'refresh token 无效' };
    }
  }

  @Get('me')
  async me() {
    const token = this.getTokenFromHeader();
    if (!token) {
      return { code: 401, data: null, message: '未登录' };
    }

    try {
      const payload = await this.authService.verifyAccessToken(token);
      const user = await this.authService.findUserById(payload.user_id);
      if (!user || user.is_deleted) {
        return { code: 401, data: null, message: '未登录' };
      }

      if (user.role !== 'admin') {
        const locked = await this.authService.hasUserDisabledSites(user.id);
        if (locked) {
          return { code: 401, data: null, message: '账号已失效，请联系管理员' };
        }
      }

      const sites = await this.authService.getUserSites(user);
      const pagePermissions =
        await this.authService.getUserSitePagePermissions(user);
      const sitePages = await this.authService.getUserSitePagesWithNames(user);
      return {
        code: 0,
        data: {
          user: { id: user.id, username: user.username, role: user.role },
          site_ids: sites.map((site) => site.site_id),
          sites,
          site_page_ids: pagePermissions.site_page_ids,
          site_page_rules: pagePermissions.site_page_rules,
          site_pages: sitePages,
        },
        message: '获取成功',
      };
    } catch (error) {
      return { code: 401, data: null, message: '未登录' };
    }
  }

  @Post('change_password')
  async changePassword() {
    const token = this.getTokenFromHeader();
    if (!token) {
      return { code: 401, data: null, message: '未登录' };
    }

    const { old_password: oldPassword, new_password: newPassword } =
      this.request.body || {};
    if (!oldPassword || !newPassword) {
      return { code: 422, data: null, message: '参数错误' };
    }

    try {
      const payload = await this.authService.verifyAccessToken(token);
      const user = await this.authService.findUserById(payload.user_id);
      if (!user || user.is_deleted) {
        return { code: 401, data: null, message: '未登录' };
      }

      if (user.role !== 'admin') {
        const locked = await this.authService.hasUserDisabledSites(user.id);
        if (locked) {
          return { code: 401, data: null, message: '账号已失效，请联系管理员' };
        }
      }

      const fullUser = await this.authService.findUserByUsername(user.username);
      if (!fullUser) {
        return { code: 401, data: null, message: '未登录' };
      }

      const ok = await bcrypt.compare(oldPassword, fullUser.password_hash);
      if (!ok) {
        return { code: 401, data: null, message: '原密码错误' };
      }

      await this.authService.updatePassword(user.id, newPassword);

      return { code: 0, data: null, message: '修改成功' };
    } catch (error) {
      return { code: 401, data: null, message: '未登录' };
    }
  }
}
