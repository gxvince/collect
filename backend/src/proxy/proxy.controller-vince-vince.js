import { Controller, Dependencies, Get, Post, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthService } from '../auth/auth.service';
import { SiteService } from '../site/site.service';
import { WpClientService } from './wp-client.service';

@Controller({ path: 'api/proxy', scope: Scope.REQUEST })
@Dependencies(REQUEST, AuthService, SiteService, WpClientService)
export class ProxyController {
  constructor(request, authService, siteService, wpClientService) {
    this.request = request;
    this.authService = authService;
    this.siteService = siteService;
    this.wpClientService = wpClientService;
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

  async checkSitePermission(user, siteId) {
    if (user.role === 'admin') {
      return true;
    }
    const siteIds = await this.authService.getUserSiteIds(user);
    return siteIds.includes(siteId);
  }

  async checkPagePermission(user, siteId, pageId) {
    return this.authService.canUserAccessPage(user, siteId, pageId);
  }

  buildPagePermissionDenied(siteId, pageId) {
    return {
      code: 403,
      data: { site_id: siteId, page_id: pageId },
      message: '无权限访问该页面',
    };
  }

  async getSiteForProxy(siteId) {
    if (!siteId) {
      return { error: { code: 422, message: '参数错误' } };
    }
    const target = await this.siteService.findById(siteId);
    if (!target || target.is_deleted) {
      return { error: { code: 404, message: '资源不存在' } };
    }
    if (!target.wp_base_url) {
      return { error: { code: 422, message: '站点未绑定 URL' } };
    }
    if (!target.wp_auth_token) {
      return { error: { code: 422, message: '站点未配置插件对接 Token' } };
    }
    return { site: target };
  }

  wrapWpError(result, path = '') {
    const wpCode =
      result && result.data && result.data.code ? String(result.data.code) : '';
    if (wpCode === 'rest_no_route') {
      const route = path || '对应接口';
      return {
        code: 502,
        data: null,
        message: `目标站点缺少插件接口 ${route}，请同步升级 WordPress 端 custom-api-plugin.php`,
      };
    }
    const message =
      result && result.message ? String(result.message) : 'WP 代理错误';
    return { code: 502, data: null, message };
  }

  @Get('get_pages')
  async getPages() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const result = await this.wpClientService.requestJson(
      site,
      '/publish_pages',
      {
        method: 'GET',
      },
    );
    if (!result.ok) {
      return this.wrapWpError(result);
    }

    return {
      code: 0,
      data: result.data.data || [],
      message: result.message || '获取成功',
    };
  }

  @Get('elementor_data/:id')
  async getElementorData() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const params = this.request.params || {};
    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    const postId = params.id ? Number(params.id) : 0;
    if (!siteId || !Number.isFinite(postId) || postId <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const result = await this.wpClientService.requestJson(
      site,
      `/elementor_data?id=${encodeURIComponent(postId)}`,
      { method: 'GET' },
    );
    if (!result.ok) {
      return this.wrapWpError(result);
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '获取成功',
    };
  }

  @Get('elementor_data_json/:id')
  async getElementorDataJson() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const params = this.request.params || {};
    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    const postId = params.id ? Number(params.id) : 0;
    if (!siteId || !Number.isFinite(postId) || postId <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const result = await this.wpClientService.requestJson(
      site,
      `/elementor_data_json?id=${encodeURIComponent(postId)}`,
      { method: 'GET' },
    );
    if (!result.ok) {
      return this.wrapWpError(result);
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '获取成功',
    };
  }

  buildMetaValue(raw) {
    if (raw === undefined || raw === null) {
      return { error: '参数错误' };
    }

    let value = raw;
    if (typeof value === 'object' && value) {
      if (value.meta_value !== undefined) {
        value = value.meta_value;
      } else if (value.data && value.data.meta_value !== undefined) {
        value = value.data.meta_value;
      }
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object') {
          if (parsed.meta_value !== undefined) {
            value = parsed.meta_value;
          } else if (parsed.data && parsed.data.meta_value !== undefined) {
            value = parsed.data.meta_value;
          }
        }
      } catch (error) {
        return { error: 'data 必须是合法 JSON' };
      }
    }

    if (typeof value === 'string') {
      try {
        return { value: JSON.parse(value) };
      } catch (error) {
        return { error: 'data 必须是合法 JSON' };
      }
    }

    try {
      JSON.stringify(value);
      return { value };
    } catch (error) {
      return { error: 'data 必须是合法 JSON' };
    }
  }

  parseElementorData(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && typeof payload === 'object') {
      if (Array.isArray(payload.data)) {
        return payload.data;
      }
      if (typeof payload.meta_value === 'string') {
        try {
          const parsed = JSON.parse(payload.meta_value);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        } catch (error) {
          return null;
        }
      }
    }
    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        return null;
      }
    }
    return null;
  }

  flattenElementorNodes(nodes, list = [], path = []) {
    if (!Array.isArray(nodes)) {
      return list;
    }
    nodes.forEach((node, index) => {
      const currentPath = path.concat(index);
      list.push({
        id: node && node.id ? String(node.id) : '',
        el_type: node && node.elType ? String(node.elType) : '',
        widget_type: node && node.widgetType ? String(node.widgetType) : '',
        depth: currentPath.length,
        path: currentPath.join('.'),
      });
      if (node && Array.isArray(node.elements) && node.elements.length) {
        this.flattenElementorNodes(node.elements, list, currentPath);
      }
    });
    return list;
  }

  @Post('update_elementor_data')
  async updateElementorData() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    const postId = body.id ? Number(body.id) : 0;
    if (!siteId || !Number.isFinite(postId) || postId <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const metaValue = this.buildMetaValue(body.data);
    if (metaValue.error) {
      return { code: 422, data: null, message: metaValue.error };
    }

    const result = await this.wpClientService.requestJson(
      site,
      '/update_elementor_data',
      {
        method: 'POST',
        body: {
          post_id: postId,
          meta_value: metaValue.value,
        },
      },
    );
    if (!result.ok) {
      return this.wrapWpError(result);
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '更新成功',
    };
  }

  @Get('elementor_data_eltype/:id')
  async getElementorDataEltype() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const params = this.request.params || {};
    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    const postId = params.id ? Number(params.id) : 0;
    if (!siteId || !Number.isFinite(postId) || postId <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    let result = await this.wpClientService.requestJson(
      site,
      `/elementor_data_json?id=${encodeURIComponent(postId)}`,
      { method: 'GET' },
    );
    if (!result.ok) {
      result = await this.wpClientService.requestJson(
        site,
        `/elementor_data?id=${encodeURIComponent(postId)}`,
        { method: 'GET' },
      );
    }
    if (!result.ok) {
      return this.wrapWpError(result, '/site_icon');
    }

    const elementorData = this.parseElementorData(
      result.data && result.data.data,
    );
    if (!elementorData) {
      return { code: 500, data: null, message: 'Elementor 数据解析失败' };
    }

    const list = this.flattenElementorNodes(elementorData);
    return { code: 0, data: list, message: '获取成功' };
  }

  @Post('upload_image')
  async uploadImage() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const file = this.request.file;
    if (!file) {
      return { code: 422, data: null, message: '未上传文件' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const blob = new Blob([file.buffer], {
      type: file.mimetype || 'application/octet-stream',
    });
    const form = new FormData();
    form.append('file', blob, file.originalname || 'file');

    const result = await this.wpClientService.requestForm(
      site,
      '/upload_file',
      form,
    );
    if (!result.ok) {
      return this.wrapWpError(result, '/site_icon');
    }

    return {
      code: 0,
      data: result.data.data || [],
      message: result.message || '上传成功',
    };
  }

  @Get('media_list')
  async getMediaList() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.page_size ? Number(query.page_size) : 20;
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const params = new URLSearchParams();
    if (Number.isFinite(page) && page > 0) {
      params.set('page', String(page));
    }
    if (Number.isFinite(pageSize) && pageSize > 0) {
      params.set('page_size', String(pageSize));
    }
    const qs = params.toString();
    const path = `/media_list${qs ? `?${qs}` : ''}`;
    const result = await this.wpClientService.requestJson(site, path, {
      method: 'GET',
    });
    if (!result.ok) {
      return this.wrapWpError(result);
    }

    return {
      code: 0,
      data: result.data.data || {
        list: [],
        page,
        page_size: pageSize,
        total: 0,
      },
      message: result.message || '获取成功',
    };
  }

  @Post('media_delete')
  async deleteMedia() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    const attachmentId = body.attachment_id ? Number(body.attachment_id) : 0;
    if (!siteId || !Number.isFinite(attachmentId) || attachmentId <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const result = await this.wpClientService.requestJson(
      site,
      '/delete_file',
      {
        method: 'POST',
        body: { attachment_id: attachmentId },
      },
    );
    if (!result.ok) {
      return this.wrapWpError(result, '/site_title');
    }

    return {
      code: 0,
      data: null,
      message: result.message || '删除成功',
    };
  }

  @Post('site_icon')
  async setSiteIcon() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const file = this.request.file;
    const attachmentId = body.attachment_id ? Number(body.attachment_id) : 0;
    if (!file && (!Number.isFinite(attachmentId) || attachmentId <= 0)) {
      return {
        code: 422,
        data: null,
        message: '请上传文件或提供 attachment_id',
      };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    let result = null;
    if (file) {
      const blob = new Blob([file.buffer], {
        type: file.mimetype || 'application/octet-stream',
      });
      const form = new FormData();
      form.append('file', blob, file.originalname || 'file');
      result = await this.wpClientService.requestForm(site, '/site_icon', form);
    } else {
      result = await this.wpClientService.requestJson(site, '/site_icon', {
        method: 'POST',
        body: { attachment_id: attachmentId },
      });
    }

    if (!result.ok) {
      return this.wrapWpError(result, '/site_icon');
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '设置成功',
    };
  }

  @Get('site_icon')
  async getSiteIcon() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const result = await this.wpClientService.requestJson(site, '/site_icon', {
      method: 'GET',
    });
    if (!result.ok) {
      return this.wrapWpError(result, '/site_icon');
    }

    return {
      code: 0,
      data: result.data.data || { attachment_id: 0, icon_url: '' },
      message: result.message || '获取成功',
    };
  }

  @Post('site_title')
  async setSiteTitle() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    const title = body.title ? String(body.title).trim() : '';
    if (!siteId || !title) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const result = await this.wpClientService.requestJson(site, '/site_title', {
      method: 'POST',
      body: { title },
    });
    if (!result.ok) {
      return this.wrapWpError(result, '/site_title');
    }

    return {
      code: 0,
      data: null,
      message: result.message || '更新成功',
    };
  }

  @Get('site_title')
  async getSiteTitle() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const result = await this.wpClientService.requestJson(site, '/site_title', {
      method: 'GET',
    });
    if (!result.ok) {
      return this.wrapWpError(result, '/site_title');
    }

    return {
      code: 0,
      data: result.data.data || { title: '' },
      message: result.message || '获取成功',
    };
  }

  @Post('smtp_config')
  async updateSmtpConfig() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const payload = { ...body };
    delete payload.site_id;
    const result = await this.wpClientService.requestJson(
      site,
      '/smtp_config',
      {
        method: 'POST',
        body: payload,
      },
    );
    if (!result.ok) {
      return this.wrapWpError(result);
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '更新成功',
    };
  }

  @Post('smtp_test')
  async testSmtp() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    const to = body.to ? String(body.to).trim() : '';
    if (!siteId || !to) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const result = await this.wpClientService.requestJson(site, '/smtp_test', {
      method: 'POST',
      body: { to },
    });
    if (!result.ok) {
      return this.wrapWpError(result);
    }

    return {
      code: 0,
      data: null,
      message: result.message || '发送成功',
    };
  }

  @Get('post_types')
  async getPostTypes() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const result = await this.wpClientService.requestJson(site, '/post_types', {
      method: 'GET',
    });
    if (!result.ok) {
      return this.wrapWpError(result);
    }

    return {
      code: 0,
      data: result.data.data || [],
      message: result.message || '获取成功',
    };
  }

  @Get('product')
  async getProduct() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    const id = query.id ? Number(query.id) : 0;
    if (!siteId || !Number.isFinite(id) || id <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }
    const hasPagePermission = await this.checkPagePermission(
      user,
      siteId,
      postId,
    );
    if (!hasPagePermission) {
      return this.buildPagePermissionDenied(siteId, postId);
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const result = await this.wpClientService.requestJson(
      site,
      `/product?id=${encodeURIComponent(id)}`,
      { method: 'GET' },
    );
    if (!result.ok) {
      return this.wrapWpError(result, '/product');
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '获取成功',
    };
  }

  @Get('product_list')
  async getProductList() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }
    const hasPagePermission = await this.checkPagePermission(
      user,
      siteId,
      postId,
    );
    if (!hasPagePermission) {
      return this.buildPagePermissionDenied(siteId, postId);
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.page_size ? Number(query.page_size) : 20;
    const keyword = query.keyword ? String(query.keyword).trim() : '';
    const status = query.status ? String(query.status).trim() : '';
    const params = new URLSearchParams();
    if (Number.isFinite(page) && page > 0) {
      params.set('page', String(page));
    }
    if (Number.isFinite(pageSize) && pageSize > 0) {
      params.set('page_size', String(pageSize));
    }
    if (keyword) {
      params.set('keyword', keyword);
    }
    if (status) {
      params.set('status', status);
    }
    const path = `/product_list${params.toString() ? `?${params.toString()}` : ''}`;
    const result = await this.wpClientService.requestJson(site, path, {
      method: 'GET',
    });
    if (!result.ok) {
      return this.wrapWpError(result, '/product_list');
    }

    return {
      code: 0,
      data: result.data.data || {
        list: [],
        page,
        page_size: pageSize,
        total: 0,
      },
      message: result.message || '获取成功',
    };
  }

  @Post('product')
  async updateProduct() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    const id = body.id ? Number(body.id) : 0;
    if (!siteId || !Number.isFinite(id) || id <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }
    const hasPagePermission = await this.checkPagePermission(
      user,
      siteId,
      postId,
    );
    if (!hasPagePermission) {
      return this.buildPagePermissionDenied(siteId, postId);
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const payload = { ...body };
    delete payload.site_id;
    const result = await this.wpClientService.requestJson(site, '/product', {
      method: 'POST',
      body: payload,
    });
    if (!result.ok) {
      return this.wrapWpError(result, '/product');
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '更新成功',
    };
  }

  @Post('product_delete')
  async deleteProduct() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    const id = body.id ? Number(body.id) : 0;
    if (!siteId || !Number.isFinite(id) || id <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }
    const hasPagePermission = await this.checkPagePermission(
      user,
      siteId,
      postId,
    );
    if (!hasPagePermission) {
      return this.buildPagePermissionDenied(siteId, postId);
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const payload = { id, force: body.force === true || body.force === 'true' };
    const result = await this.wpClientService.requestJson(
      site,
      '/product_delete',
      {
        method: 'POST',
        body: payload,
      },
    );
    if (!result.ok) {
      return this.wrapWpError(result, '/product_delete');
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '删除成功',
    };
  }

  @Get('product_categories')
  async getProductCategories() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const result = await this.wpClientService.requestJson(
      site,
      '/product_categories',
      {
        method: 'GET',
      },
    );
    if (!result.ok) {
      return this.wrapWpError(result, '/product_categories');
    }

    return {
      code: 0,
      data: result.data.data || [],
      message: result.message || '获取成功',
    };
  }

  @Post('product_category')
  async updateProductCategory() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    const id = body.id ? Number(body.id) : 0;
    if (!siteId || !Number.isFinite(id) || id <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const payload = { ...body };
    delete payload.site_id;
    const result = await this.wpClientService.requestJson(
      site,
      '/product_category',
      {
        method: 'POST',
        body: payload,
      },
    );
    if (!result.ok) {
      return this.wrapWpError(result, '/product_category');
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '更新成功',
    };
  }

  @Get('news')
  async getNews() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    const id = query.id ? Number(query.id) : 0;
    if (!siteId || !Number.isFinite(id) || id <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const result = await this.wpClientService.requestJson(
      site,
      `/news?id=${encodeURIComponent(id)}`,
      { method: 'GET' },
    );
    if (!result.ok) {
      return this.wrapWpError(result, '/news');
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '获取成功',
    };
  }

  @Get('news_list')
  async getNewsList() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const page = query.page ? Number(query.page) : 1;
    const pageSize = query.page_size ? Number(query.page_size) : 20;
    const keyword = query.keyword ? String(query.keyword).trim() : '';
    const status = query.status ? String(query.status).trim() : '';
    const params = new URLSearchParams();
    if (Number.isFinite(page) && page > 0) {
      params.set('page', String(page));
    }
    if (Number.isFinite(pageSize) && pageSize > 0) {
      params.set('page_size', String(pageSize));
    }
    if (keyword) {
      params.set('keyword', keyword);
    }
    if (status) {
      params.set('status', status);
    }
    const path = `/news_list${params.toString() ? `?${params.toString()}` : ''}`;
    const result = await this.wpClientService.requestJson(site, path, {
      method: 'GET',
    });
    if (!result.ok) {
      return this.wrapWpError(result, '/news_list');
    }

    return {
      code: 0,
      data: result.data.data || {
        list: [],
        page,
        page_size: pageSize,
        total: 0,
      },
      message: result.message || '获取成功',
    };
  }

  @Post('news')
  async updateNews() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    const id = body.id ? Number(body.id) : 0;
    if (!siteId || !Number.isFinite(id) || id <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const payload = { ...body };
    delete payload.site_id;
    const result = await this.wpClientService.requestJson(site, '/news', {
      method: 'POST',
      body: payload,
    });
    if (!result.ok) {
      return this.wrapWpError(result, '/news');
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '更新成功',
    };
  }

  @Post('news_delete')
  async deleteNews() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    const id = body.id ? Number(body.id) : 0;
    if (!siteId || !Number.isFinite(id) || id <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const payload = { id, force: body.force === true || body.force === 'true' };
    const result = await this.wpClientService.requestJson(
      site,
      '/news_delete',
      {
        method: 'POST',
        body: payload,
      },
    );
    if (!result.ok) {
      return this.wrapWpError(result, '/news_delete');
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '删除成功',
    };
  }

  @Get('news_categories')
  async getNewsCategories() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const result = await this.wpClientService.requestJson(
      site,
      '/news_categories',
      {
        method: 'GET',
      },
    );
    if (!result.ok) {
      return this.wrapWpError(result, '/news_categories');
    }

    return {
      code: 0,
      data: result.data.data || [],
      message: result.message || '获取成功',
    };
  }

  @Post('news_category')
  async updateNewsCategory() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    const id = body.id ? Number(body.id) : 0;
    if (!siteId || !Number.isFinite(id) || id <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const payload = { ...body };
    delete payload.site_id;
    const result = await this.wpClientService.requestJson(
      site,
      '/news_category',
      {
        method: 'POST',
        body: payload,
      },
    );
    if (!result.ok) {
      return this.wrapWpError(result, '/news_category');
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '更新成功',
    };
  }

  @Get('product_short_description')
  async getProductShortDescription() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    const id = query.id ? Number(query.id) : 0;
    if (!siteId || !Number.isFinite(id) || id <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const result = await this.wpClientService.requestJson(
      site,
      `/product_short_description?id=${encodeURIComponent(id)}`,
      { method: 'GET' },
    );
    if (!result.ok) {
      return this.wrapWpError(result, '/product_short_description');
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '获取成功',
    };
  }

  @Post('product_short_description')
  async updateProductShortDescription() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    const id = body.id ? Number(body.id) : 0;
    if (!siteId || !Number.isFinite(id) || id <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const payload = { ...body };
    delete payload.site_id;
    const result = await this.wpClientService.requestJson(
      site,
      '/product_short_description',
      {
        method: 'POST',
        body: payload,
      },
    );
    if (!result.ok) {
      return this.wrapWpError(result, '/product_short_description');
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '更新成功',
    };
  }

  @Post('content_create')
  async createContent() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const body = this.request.body || {};
    const siteId = body.site_id ? String(body.site_id).trim() : '';
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { site, error: siteError } = await this.getSiteForProxy(siteId);
    if (siteError) {
      return { code: siteError.code, data: null, message: siteError.message };
    }

    const payload = { ...body };
    delete payload.site_id;
    const result = await this.wpClientService.requestJson(
      site,
      '/content_create',
      {
        method: 'POST',
        body: payload,
      },
    );
    if (!result.ok) {
      return this.wrapWpError(result);
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '创建成功',
    };
  }
}
