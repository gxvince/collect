import { Controller, Dependencies, Post, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthService } from './auth.service';

@Controller({ path: 'api', scope: Scope.REQUEST })
@Dependencies(REQUEST, AuthService)
export class AuthCompatController {
  constructor(request, authService) {
    this.request = request;
    this.authService = authService;
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
    await this.authService.storeRefreshToken(user.id, refreshToken);

    return {
      code: 0,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: { id: user.id, username: user.username, role: user.role },
        site_ids: sites.map((site) => site.site_id),
        sites,
      },
      message: '登录成功',
    };
  }
}
