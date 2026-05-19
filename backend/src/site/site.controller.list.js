import { Controller, Dependencies, Get, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthService } from '../auth/auth.service';
import { SiteService } from './site.service';

@Controller({ path: 'api/site', scope: Scope.REQUEST })
@Dependencies(REQUEST, SiteService, AuthService)
export class SiteListController {
  constructor(request, siteService, authService) {
    this.request = request;
    this.siteService = siteService;
    this.authService = authService;
  }

  getTokenFromHeader() {
    const auth = this.request.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return null;
    }
    return auth.slice(7).trim();
  }

  parseSiteStatus(raw) {
    if (raw === undefined || raw === null || raw === '') {
      return { provided: false, value: null };
    }
    const normalized = String(raw).trim().toLowerCase();
    if (normalized === '0' || normalized === 'online') {
      return { provided: true, value: 0 };
    }
    if (normalized === '1' || normalized === 'disabled') {
      return { provided: true, value: 1 };
    }
    return { provided: true, value: null };
  }

  parseIncludeDeleted(raw) {
    if (raw === undefined || raw === null || raw === '') {
      return false;
    }
    const normalized = String(raw).trim().toLowerCase();
    return normalized === '1' || normalized === 'true' || normalized === 'yes';
  }

  @Get('list')
  async list() {
    const token = this.getTokenFromHeader();
    if (!token) {
      return { code: 401, data: null, message: '未登录' };
    }

    let user;
    try {
      const payload = await this.authService.verifyAccessToken(token);
      user = await this.authService.findUserById(payload.user_id);
    } catch (error) {
      return { code: 401, data: null, message: '未登录' };
    }
    if (!user || user.is_deleted) {
      return { code: 401, data: null, message: '未登录' };
    }

    if (user.role !== 'admin') {
      const locked = await this.authService.hasUserDisabledSites(user.id);
      if (locked) {
        return { code: 401, data: null, message: '账号已失效，请联系管理员' };
      }
    }

    const query = this.request.query || {};
    const keyword = (query.keyword || '').trim();
    const demoSite = (query.demo_site || '').trim();
    const statusResult = this.parseSiteStatus(query.site_status);
    if (statusResult.provided && statusResult.value === null) {
      return { code: 422, data: null, message: 'site_status 仅支持 0/1' };
    }

    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.page_size) || 10));

    if (user.role === 'admin') {
      const includeDeleted = this.parseIncludeDeleted(query.include_deleted);
      const result = await this.siteService.listSites({
        keyword,
        demoSite,
        siteStatus: statusResult.value,
        includeDeleted,
        page,
        pageSize,
      });
      const listWithUsers = await this.siteService.attachUserRelations(result.list);
      return {
        code: 0,
        data: { list: listWithUsers, page: result.page, page_size: result.pageSize, total: result.total },
        message: '获取成功',
      };
    }

    const siteIds = await this.authService.getUserSiteIds(user);
    const list = await this.siteService.listSitesByIds(siteIds, {
      keyword,
      demoSite,
      siteStatus: statusResult.value,
    });
    return { code: 0, data: { list, page: 1, page_size: list.length, total: list.length }, message: '获取成功' };
  }
}
