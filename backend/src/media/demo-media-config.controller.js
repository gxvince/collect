import { Controller, Dependencies, Get, Post, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthService } from '../auth/auth.service';
import { DemoMediaConfigService } from './demo-media-config.service';

const DEFAULT_PAGE_SIZE = 20;
const ALLOWED_PAGE_SIZES = [10, 20, 50, 100];

@Controller({ path: 'api/media/demo-config', scope: Scope.REQUEST })
@Dependencies(REQUEST, AuthService, DemoMediaConfigService)
export class DemoMediaConfigController {
  constructor(request, authService, configService) {
    this.request = request;
    this.authService = authService;
    this.configService = configService;
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

  normalizePage(value) {
    const page = Number(value);
    return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  }

  normalizePageSize(value) {
    const pageSize = Number(value);
    if (!ALLOWED_PAGE_SIZES.includes(pageSize)) {
      return DEFAULT_PAGE_SIZE;
    }
    return pageSize;
  }

  parseJsonField(value, fallback) {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    if (typeof value === 'object') {
      return value;
    }
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  formatItem(item) {
    if (!item) {
      return null;
    }
    return {
      id: item.id,
      demo: item.demo,
      imgs: this.parseJsonField(item.imgs, []),
      sizes: this.parseJsonField(item.sizes, []),
      blacklist: this.parseJsonField(item.blacklist, []),
      created_at: item.created_at,
      updated_at: item.updated_at,
    };
  }

  @Post('save')
  async save() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }
    if (user.role !== 'admin') {
      return { code: 403, data: null, message: '无权限' };
    }

    const body = this.request.body || {};
    const demo = this.normalizeText(body.demo);
    if (!demo) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const existing = await this.configService.findByDemo(demo);
    const imgs = Array.isArray(body.imgs)
      ? body.imgs
      : this.parseJsonField(body.imgs, existing ? [] : []);
    const sizes = Array.isArray(body.sizes)
      ? body.sizes
      : this.parseJsonField(body.sizes, existing ? [] : []);
    const blacklist = Array.isArray(body.blacklist)
      ? body.blacklist
      : this.parseJsonField(body.blacklist, existing ? [] : []);

    if (
      !Array.isArray(imgs) ||
      !Array.isArray(sizes) ||
      !Array.isArray(blacklist)
    ) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const item = await this.configService.save({
      demo,
      imgs,
      sizes,
      blacklist,
    });
    return {
      code: 0,
      data: this.formatItem(item),
      message: '保存成功',
    };
  }

  @Get('get')
  async get() {
    const { error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const demo = this.normalizeText(query.demo);
    if (!demo) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const item = await this.configService.findByDemo(demo);
    if (!item) {
      return { code: 404, data: null, message: '资源不存在' };
    }

    return {
      code: 0,
      data: this.formatItem(item),
      message: '获取成功',
    };
  }

  @Get('list')
  async list() {
    const { error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const demo = this.normalizeText(query.demo);
    const page = this.normalizePage(query.page);
    const pageSize = this.normalizePageSize(query.page_size);

    const { list, total } = await this.configService.list({
      demo,
      page,
      pageSize,
    });

    return {
      code: 0,
      data: {
        list: list.map((item) => this.formatItem(item)),
        total,
        page,
        page_size: pageSize,
      },
      message: '获取成功',
    };
  }

  @Post('delete')
  async delete() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }
    if (user.role !== 'admin') {
      return { code: 403, data: null, message: '无权限' };
    }

    const body = this.request.body || {};
    const demo = this.normalizeText(body.demo);
    if (!demo) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const item = await this.configService.findByDemo(demo);
    if (!item) {
      return { code: 404, data: null, message: '资源不存在' };
    }

    const deleted = await this.configService.deleteByDemo(demo);
    if (!deleted) {
      return { code: 500, data: null, message: '删除失败' };
    }

    return {
      code: 0,
      data: null,
      message: '删除成功',
    };
  }
}
