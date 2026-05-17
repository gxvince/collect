import {
  Controller,
  Dependencies,
  HttpCode,
  Post,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { randomUUID } from 'crypto';
import { AuthService } from '../auth/auth.service';
import { SiteService } from './site.service';

@Controller({ path: 'api/site', scope: Scope.REQUEST })
@Dependencies(REQUEST, SiteService, AuthService)
export class SiteController {
  constructor(request, siteService, authService) {
    this.request = request;
    this.siteService = siteService;
    this.authService = authService;
  }

  @Post('create')
  async createSite() {
    const { user, error } = await this.getAdminUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteName = (body.site_name || '').trim();
    const demoSite = (body.demo_site || '').trim();
    const siteUrl = this.siteService.normalizeUrl(body.site_url || '');
    const statusResult = this.parseSiteStatus(body.site_status);

    if (!siteName) {
      return { code: 422, data: null, message: '参数错误' };
    }
    if (statusResult.provided && statusResult.value === null) {
      return { code: 422, data: null, message: 'site_status 仅支持 0/1' };
    }

    const siteId = `site_${randomUUID().replace(/-/g, '')}`;
    const pluginToken = `pt_${randomUUID().replace(/-/g, '')}`;
    const siteStatus = statusResult.value;

    await this.siteService.createSite({
      siteId,
      siteName,
      siteStatus,
      siteUrl,
      authType: 'api_key',
      authToken: pluginToken,
      demoSite,
    });

    let registerResult = null;
    if (siteUrl) {
      const publicBaseUrl = (process.env.PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
      registerResult = await this.siteService.registerWithPlugin({
        wpBaseUrl: siteUrl,
        pluginToken,
        systemUrl: publicBaseUrl,
        demoSite,
      });
      console.log('[site.create] registerWithPlugin result', {
        siteId,
        siteUrl,
        ok: registerResult.ok,
        message: registerResult.message || '',
      });
    }

    return {
      code: 0,
      data: {
        site_id: siteId,
        site_name: siteName,
        demo_site: demoSite || null,
        site_status: siteStatus,
        plugin_token: pluginToken,
        site_url: siteUrl || null,
        register: registerResult
          ? {
              ok: registerResult.ok,
              message: registerResult.message || '',
            }
          : null,
      },
      message: registerResult && !registerResult.ok
        ? `站点已创建，但插件注册失败：${registerResult.message}`
        : '创建成功',
    };
  }

  @Post('bind_url')
  @HttpCode(200)
  async bindUrl() {
    const body = this.request.body || {};
    const pluginToken = (body.plugin_token || '').trim();
    const siteUrlRaw = body.site_url || '';
    const siteUrl = this.siteService.normalizeUrl(siteUrlRaw);

    if (!pluginToken || !siteUrl) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const target = await this.siteService.findByToken(pluginToken);
    if (!target) {
      return { code: 404, data: null, message: '资源不存在' };
    }

    const urlExists = await this.siteService.findByUrl(siteUrl);
    if (urlExists && urlExists.site_id !== target.site_id) {
      return { code: 409, data: null, message: '站点URL已被绑定' };
    }

    await this.siteService.bindSiteUrl({
      siteId: target.site_id,
      siteUrl,
    });

    return {
      code: 0,
      data: { site_id: target.site_id, site_url: siteUrl },
      message: '绑定成功',
    };
  }

  @Post('bind')
  @HttpCode(200)
  async bind() {
    const { user, error } = await this.getAdminUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = (body.site_id || '').trim();
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const target = await this.siteService.findById(siteId);
    if (!target || target.is_deleted) {
      return { code: 404, data: null, message: '资源不存在' };
    }
    if (!target.wp_base_url) {
      return { code: 422, data: null, message: '站点未配置 URL，请先更新站点 URL' };
    }
    if (!target.wp_auth_token) {
      return { code: 422, data: null, message: '站点未配置插件对接 Token' };
    }

    const publicBaseUrl = (process.env.PUBLIC_BASE_URL || '').trim().replace(/\/+$/, '');
    const registerResult = await this.siteService.registerWithPlugin({
      wpBaseUrl: target.wp_base_url,
      pluginToken: target.wp_auth_token,
      systemUrl: publicBaseUrl,
      demoSite: target.demo_site || '',
    });

    console.log('[site.bind] registerWithPlugin result', {
      siteId,
      wpBaseUrl: target.wp_base_url,
      ok: registerResult.ok,
      message: registerResult.message || '',
    });

    if (!registerResult.ok) {
      return {
        code: 502,
        data: { site_id: siteId },
        message: `注册失败：${registerResult.message}`,
      };
    }

    return {
      code: 0,
      data: { site_id: siteId, site_url: target.wp_base_url },
      message: '绑定成功',
    };
  }

  @Post('update')
  async updateSite() {
    const { user, error } = await this.getAdminUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = (body.site_id || '').trim();
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const target = await this.siteService.findById(siteId);
    if (!target || target.is_deleted) {
      return { code: 404, data: null, message: '资源不存在' };
    }

    const fields = {};
    if (body.site_name !== undefined) {
      const siteName = (body.site_name || '').trim();
      if (!siteName) {
        return { code: 422, data: null, message: 'site_name 不能为空' };
      }
      fields.siteName = siteName;
    }
    if (body.site_url !== undefined) {
      fields.siteUrl = this.siteService.normalizeUrl(body.site_url || '');
    }
    if (body.demo_site !== undefined) {
      fields.demoSite = (body.demo_site || '').trim();
    }
    if (body.site_status !== undefined) {
      const statusResult = this.parseSiteStatus(body.site_status);
      if (statusResult.provided && statusResult.value === null) {
        return { code: 422, data: null, message: 'site_status 仅支持 0/1' };
      }
      fields.siteStatus = statusResult.value;
    }

    if (!Object.keys(fields).length) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const updated = await this.siteService.updateSite(siteId, fields);

    return {
      code: 0,
      data: updated,
      message: '更新成功',
    };
  }

  @Post('delete')
  async deleteSite() {
    const { user, error } = await this.getAdminUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = (body.site_id || '').trim();
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const target = await this.siteService.findById(siteId);
    if (!target || target.is_deleted) {
      return { code: 404, data: null, message: '资源不存在' };
    }

    await this.siteService.softDeleteSite(siteId);

    return {
      code: 0,
      data: { site_id: siteId },
      message: '删除成功',
    };
  }

  async getAdminUser() {
    const token = this.getTokenFromHeader();
    if (!token) {
      return { error: { code: 401, message: '未登录' } };
    }
    let user;
    try {
      const payload = await this.authService.verifyAccessToken(token);
      user = await this.authService.findUserById(payload.user_id);
    } catch (error) {
      return { error: { code: 401, message: '未登录' } };
    }
    if (!user || user.is_deleted) {
      return { error: { code: 401, message: '未登录' } };
    }
    if (user.role !== 'admin') {
      return { error: { code: 403, message: '无权限' } };
    }
    return { user };
  }

  parseSiteStatus(input) {
    if (input === undefined || input === null || input === '') {
      return { provided: false, value: 0 };
    }
    const normalized = String(input).trim().toLowerCase();
    if (normalized === '0' || normalized === 'building') {
      return { provided: true, value: 0 };
    }
    if (normalized === '1' || normalized === 'online') {
      return { provided: true, value: 1 };
    }
    return { provided: true, value: null };
  }

  getTokenFromHeader() {
    const auth = this.request.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return null;
    }
    return auth.slice(7).trim();
  }
}
