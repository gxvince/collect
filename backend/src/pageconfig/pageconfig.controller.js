import { Controller, Dependencies, Get, Post, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthService } from '../auth/auth.service';
import { SiteService } from '../site/site.service';
import { PageConfigService } from './pageconfig.service';

@Controller({ path: 'api/page_config', scope: Scope.REQUEST })
@Dependencies(REQUEST, AuthService, SiteService, PageConfigService)
export class PageConfigController {
  constructor(request, authService, siteService, pageConfigService) {
    this.request = request;
    this.authService = authService;
    this.siteService = siteService;
    this.pageConfigService = pageConfigService;
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
      if (user.role !== 'admin') {
        const locked = await this.authService.hasUserDisabledSites(user.id);
        if (locked) {
          return { error: { code: 401, message: '账号已失效，请联系管理员' } };
        }
      }
      return { user };
    } catch (error) {
      return { error: { code: 401, message: '未登录' } };
    }
  }

  normalizeText(value) {
    if (value === undefined || value === null) {
      return '';
    }
    return String(value).trim();
  }

  isPlainObject(value) {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  isNumericPageId(pageId) {
    return /^\d+$/.test(this.normalizeText(pageId));
  }

  parseJsonValue(value, fallback) {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    if (typeof value === 'object') {
      return value;
    }
    try {
      return JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  buildMediaUrl(rawUrl) {
    const value = this.normalizeText(rawUrl);
    if (!value) {
      return '';
    }
    if (/^https?:\/\//i.test(value)) {
      return value;
    }
    const publicBaseUrl = this.normalizeText(
      process.env.PUBLIC_BASE_URL,
    ).replace(/\/+$/, '');
    const normalized = value.replace(/^\/+/, '');
    return publicBaseUrl ? `${publicBaseUrl}/${normalized}` : normalized;
  }

  normalizeMaterials(items) {
    if (!Array.isArray(items)) {
      return [];
    }
    return items.map((item) => {
      if (!item || typeof item !== 'object') {
        return item;
      }
      if (!item.url) {
        return item;
      }
      return {
        ...item,
        url: this.buildMediaUrl(item.url),
      };
    });
  }

  async checkSitePermission(user, siteId) {
    if (user.role === 'admin') {
      return true;
    }
    const siteIds = await this.authService.getUserSiteIds(user);
    return siteIds.includes(siteId);
  }

  async checkPagePermission(user, siteId, pageId) {
    if (!this.isNumericPageId(pageId)) {
      return true;
    }
    return this.authService.canUserAccessPage(user, siteId, Number(pageId));
  }

  async getValidatedSite(user, siteId) {
    if (!siteId) {
      return { error: { code: 422, message: '参数错误' } };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { error: { code: 403, message: '无权限' } };
    }

    const site = await this.siteService.findById(siteId);
    if (!site || site.is_deleted) {
      return { error: { code: 404, message: '资源不存在' } };
    }

    return { site };
  }

  validateDataMap(data) {
    if (!this.isPlainObject(data)) {
      return { ok: false, message: '参数错误' };
    }
    const pageIds = Object.keys(data);
    if (!pageIds.length) {
      return { ok: false, message: '参数错误' };
    }
    for (const pageId of pageIds) {
      if (!Array.isArray(data[pageId])) {
        return { ok: false, message: '参数错误' };
      }
    }
    return { ok: true, pageIds };
  }

  @Post('save_materials')
  async saveMaterials() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = this.normalizeText(body.site_id);
    const data = body.data;
    const dataValidation = this.validateDataMap(data);
    if (!siteId || !dataValidation.ok) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const { error: siteError } = await this.getValidatedSite(user, siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    for (const pageId of dataValidation.pageIds) {
      const hasPagePermission = await this.checkPagePermission(
        user,
        siteId,
        pageId,
      );
      if (!hasPagePermission) {
        return {
          code: 403,
          data: { site_id: siteId, page_id: pageId },
          message: '无权限访问该页面',
        };
      }
      await this.pageConfigService.upsertMaterials({
        siteId,
        pageId,
        materials: data[pageId],
      });
    }

    return {
      code: 0,
      data: { site_id: siteId, page_ids: dataValidation.pageIds },
      message: '保存成功',
    };
  }

  @Post('save_sizes')
  async saveSizes() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = this.normalizeText(body.site_id);
    const data = body.data;
    const dataValidation = this.validateDataMap(data);
    if (!siteId || !dataValidation.ok) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const { error: siteError } = await this.getValidatedSite(user, siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    for (const pageId of dataValidation.pageIds) {
      const hasPagePermission = await this.checkPagePermission(
        user,
        siteId,
        pageId,
      );
      if (!hasPagePermission) {
        return {
          code: 403,
          data: { site_id: siteId, page_id: pageId },
          message: '无权限访问该页面',
        };
      }
      await this.pageConfigService.upsertSizes({
        siteId,
        pageId,
        sizes: data[pageId],
      });
    }

    return {
      code: 0,
      data: { site_id: siteId, page_ids: dataValidation.pageIds },
      message: '保存成功',
    };
  }

  @Get('get')
  async get() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const siteId = this.normalizeText(query.site_id);
    const pageId = this.normalizeText(query.page_id);
    if (!siteId || !pageId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const { error: siteError } = await this.getValidatedSite(user, siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const hasPagePermission = await this.checkPagePermission(
      user,
      siteId,
      pageId,
    );
    if (!hasPagePermission) {
      return {
        code: 403,
        data: { site_id: siteId, page_id: pageId },
        message: '无权限访问该页面',
      };
    }

    const item = await this.pageConfigService.findBySitePage(siteId, pageId);
    const materials = this.normalizeMaterials(
      this.parseJsonValue(item && item.materials_json, []),
    );
    const sizes = this.parseJsonValue(item && item.sizes_json, []);

    return {
      code: 0,
      data: {
        site_id: siteId,
        page_id: pageId,
        materials: Array.isArray(materials) ? materials : [],
        sizes: Array.isArray(sizes) ? sizes : [],
      },
      message: '获取成功',
    };
  }
}
