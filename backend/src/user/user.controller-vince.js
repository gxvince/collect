import { Controller, Dependencies, Get, Post, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthService } from '../auth/auth.service';
import { UserService } from './user.service';

@Controller({ path: 'api/user', scope: Scope.REQUEST })
@Dependencies(REQUEST, AuthService, UserService)
export class UserController {
  constructor(request, authService, userService) {
    this.request = request;
    this.authService = authService;
    this.userService = userService;
  }

  getTokenFromHeader() {
    const auth = this.request.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return null;
    }
    return auth.slice(7).trim();
  }

  async getAuthUser() {
    const token = this.getTokenFromHeader();
    if (!token) {
      return { error: { code: 401, message: '未登录' } };
    }

    try {
      const payload = await this.authService.verifyAccessToken(token);
      const user = await this.authService.findUserById(payload.user_id);
      if (!user || user.is_deleted) {
        return { error: { code: 401, message: '未登录' } };
      }
      return { user };
    } catch (error) {
      return { error: { code: 401, message: '未登录' } };
    }
  }

  @Get('list')
  async list() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }
    if (user.role !== 'admin') {
      return { code: 403, data: null, message: '无权限' };
    }

    const query = this.request.query || {};
    const idRaw = query.id ? Number(query.id) : 0;
    const username = query.username ? String(query.username).trim() : '';
    if (query.id && (!Number.isFinite(idRaw) || idRaw <= 0)) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const users = await this.userService.listUsers({
      id: idRaw > 0 ? idRaw : undefined,
      username: username || undefined,
    });
    const usersWithSites = await this.userService.attachSiteRelations(users);
    return { code: 0, data: usersWithSites, message: '获取成功' };
  }

  @Get('deleted')
  async listDeleted() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }
    if (user.role !== 'admin') {
      return { code: 403, data: null, message: '无权限' };
    }

    const users = await this.userService.listDeletedUsers();
    const usersWithSites = await this.userService.attachSiteRelations(users);
    return { code: 0, data: usersWithSites, message: '获取成功' };
  }

  @Get(':id')
  async detail() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const targetId = Number(this.request.params.id);
    if (!Number.isFinite(targetId)) {
      return { code: 422, data: null, message: '参数错误' };
    }

    if (user.role !== 'admin' && user.id !== targetId) {
      return { code: 403, data: null, message: '无权限' };
    }

    const targetUser = await this.userService.findById(targetId);
    if (!targetUser || targetUser.is_deleted) {
      return { code: 404, data: null, message: '资源不存在' };
    }

    const [userWithSites] = await this.userService.attachSiteRelations([
      targetUser,
    ]);
    return { code: 0, data: userWithSites, message: '获取成功' };
  }

  @Post('add')
  async add() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }
    if (user.role !== 'admin') {
      return { code: 403, data: null, message: '无权限' };
    }

    const {
      username,
      password,
      role,
      site_ids: siteIds,
    } = this.request.body || {};
    if (!username || !password) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const exists = await this.userService.findByUsername(username);
    if (exists) {
      return { code: 409, data: null, message: '用户名已存在' };
    }

    const userId = await this.userService.createUser({
      username,
      password,
      role: role === 'admin' ? 'admin' : 'user',
      siteIds: Array.isArray(siteIds) ? siteIds : [],
    });

    return { code: 0, data: { id: userId }, message: '创建成功' };
  }

  @Post('update')
  async update() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const {
      id,
      username,
      role,
      password,
      site_ids: siteIds,
    } = this.request.body || {};
    const targetId = Number(id || user.id);
    if (!Number.isFinite(targetId)) {
      return { code: 422, data: null, message: '参数错误' };
    }

    if (user.role !== 'admin' && user.id !== targetId) {
      return { code: 403, data: null, message: '无权限' };
    }

    const targetUser = await this.userService.findById(targetId);
    if (!targetUser || targetUser.is_deleted) {
      return { code: 404, data: null, message: '资源不存在' };
    }

    if (user.role !== 'admin') {
      const result = await this.userService.updateUserSelf(targetId, {
        username,
      });
      if (!result) {
        return { code: 422, data: null, message: '参数错误' };
      }
      return { code: 0, data: null, message: '更新成功' };
    }

    if (username) {
      const exists = await this.userService.findByUsername(username);
      if (exists && exists.id !== targetId) {
        return { code: 409, data: null, message: '用户名已存在' };
      }
    }

    await this.userService.updateUserAdmin(targetId, {
      username,
      role: role === 'admin' ? 'admin' : role === 'user' ? 'user' : undefined,
      password,
      siteIds: Array.isArray(siteIds) ? siteIds : undefined,
    });

    return { code: 0, data: null, message: '更新成功' };
  }

  @Post('delete')
  async remove() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }
    if (user.role !== 'admin') {
      return { code: 403, data: null, message: '无权限' };
    }

    const { id } = this.request.body || {};
    const targetId = Number(id);
    if (!Number.isFinite(targetId)) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const targetUser = await this.userService.findById(targetId);
    if (!targetUser || targetUser.is_deleted) {
      return { code: 404, data: null, message: '资源不存在' };
    }

    await this.userService.softDeleteUser(targetId);
    return { code: 0, data: null, message: '删除成功' };
  }

  @Post('revoke_sites')
  async revokeSites() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }
    if (user.role !== 'admin') {
      return { code: 403, data: null, message: '无权限' };
    }

    const { id, site_ids: siteIds } = this.request.body || {};
    const targetId = Number(id);
    if (
      !Number.isFinite(targetId) ||
      !Array.isArray(siteIds) ||
      siteIds.length === 0
    ) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const targetUser = await this.userService.findById(targetId);
    if (!targetUser || targetUser.is_deleted) {
      return { code: 404, data: null, message: '资源不存在' };
    }

    const affected = await this.userService.revokeUserSites(targetId, siteIds);
    return {
      code: 0,
      data: {
        id: targetId,
        revoked_site_ids: siteIds,
        affected,
      },
      message: '取消授权成功',
    };
  }

  @Post('restore')
  async restore() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }
    if (user.role !== 'admin') {
      return { code: 403, data: null, message: '无权限' };
    }

    const { id } = this.request.body || {};
    const targetId = Number(id);
    if (!Number.isFinite(targetId)) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const targetUser = await this.userService.findById(targetId);
    if (!targetUser || !targetUser.is_deleted) {
      return { code: 404, data: null, message: '资源不存在' };
    }

    await this.userService.restoreUser(targetId);
    return { code: 0, data: null, message: '恢复成功' };
  }
}
