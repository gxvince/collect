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

  toProxyResponse(error) {
    return { code: error.code, data: null, message: error.message };
  }

  async getProxyContext(siteId, pageId = 0, includePageScope = false) {
    const auth = await this.getAuthUser();
    if (auth.error) {
      return { error: this.toProxyResponse(auth.error) };
    }
    if (!siteId) {
      return { error: { code: 422, data: null, message: '参数错误' } };
    }
    if (!(await this.checkSitePermission(auth.user, siteId))) {
      return { error: { code: 403, data: null, message: '无权限' } };
    }
    if (
      pageId &&
      !(await this.checkPagePermission(auth.user, siteId, pageId))
    ) {
      return { error: this.buildPagePermissionDenied(siteId, pageId) };
    }
    const target = await this.getSiteForProxy(siteId);
    if (target.error) {
      return { error: this.toProxyResponse(target.error) };
    }
    const pageScope = includePageScope
      ? await this.authService.getUserPagePermissionScope(auth.user, siteId)
      : null;
    return { user: auth.user, site: target.site, pageScope };
  }

  buildPagePermissionDenied(siteId, pageId) {
    return {
      code: 403,
      data: { site_id: siteId, page_id: pageId },
      message: '无权限访问该页面',
    };
  }

  extractItemPageId(item) {
    if (!item || typeof item !== 'object') {
      return 0;
    }
    const value = item.id ?? item.ID ?? item.page_id ?? item.post_id;
    const pageId = Number(value);
    return Number.isFinite(pageId) && pageId > 0 ? pageId : 0;
  }

  filterListByPageScope(list, pageScope) {
    if (!Array.isArray(list)) {
      return [];
    }
    if (!pageScope || !pageScope.restricted) {
      return list;
    }
    const allowedSet = new Set(pageScope.allowedPageIds || []);
    return list.filter((item) => allowedSet.has(this.extractItemPageId(item)));
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
    if (result && result.message === '非JSON响应') {
      const status =
        result && Number.isFinite(result.status) && result.status > 0
          ? `HTTP ${result.status}`
          : 'HTTP 未知';
      const raw = this.summarizeWpRaw(result.raw);
      return {
        code: 502,
        data: {
          status: result.status || 0,
          raw: raw || '',
        },
        message: raw
          ? `目标站点返回非JSON响应（${status}）：${raw}`
          : `目标站点返回非JSON响应（${status}）`,
      };
    }
    const message =
      result && result.message ? String(result.message) : 'WP 代理错误';
    return { code: 502, data: null, message };
  }

  summarizeWpRaw(raw) {
    if (typeof raw !== 'string' || !raw.trim()) {
      return '';
    }
    return raw
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 280);
  }

  async requestProxy(site, path, options = {}, errorPath = path) {
    const result = options.form
      ? await this.wpClientService.requestForm(
          site,
          path,
          options.form,
          options.headers,
        )
      : await this.wpClientService.requestJson(site, path, options);
    return result.ok
      ? { result }
      : { error: this.wrapWpError(result, errorPath) };
  }

  @Get('get_pages')
  async getPages() {
    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    const { site, pageScope, error } = await this.getProxyContext(
      siteId,
      0,
      true,
    );
    if (error) {
      return error;
    }

    const { result, error: requestError } = await this.requestProxy(
      site,
      '/publish_pages',
      {
        method: 'GET',
      },
    );
    if (requestError) {
      return requestError;
    }
    const originalList = result.data.data || [];
    const filteredList = this.filterListByPageScope(originalList, pageScope);

    return {
      code: 0,
      data: filteredList,
      message: result.message || '获取成功',
    };
  }

  @Get('elementor_data/:id')
  async getElementorData() {
    const params = this.request.params || {};
    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    const postId = params.id ? Number(params.id) : 0;
    if (!siteId || !Number.isFinite(postId) || postId <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }
    const { site, error } = await this.getProxyContext(siteId, postId);
    if (error) {
      return error;
    }

    const { result, error: requestError } = await this.requestProxy(
      site,
      `/elementor_data?id=${encodeURIComponent(postId)}`,
      { method: 'GET' },
    );
    if (requestError) {
      return requestError;
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '获取成功',
    };
  }

  @Get('elementor_data_json/:id')
  async getElementorDataJson() {
    const params = this.request.params || {};
    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    const postId = params.id ? Number(params.id) : 0;
    if (!siteId || !Number.isFinite(postId) || postId <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }
    const { site, error } = await this.getProxyContext(siteId, postId);
    if (error) {
      return error;
    }

    const { result, error: requestError } = await this.requestProxy(
      site,
      `/elementor_data_json?id=${encodeURIComponent(postId)}`,
      { method: 'GET' },
    );
    if (requestError) {
      return requestError;
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

  normalizeElementorDataForCompare(value) {
    if (Array.isArray(value)) {
      return value.map((item) => this.normalizeElementorDataForCompare(item));
    }
    if (value && typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .reduce((acc, key) => {
          const normalized = this.normalizeElementorDataForCompare(value[key]);
          if (normalized !== undefined) {
            acc[key] = normalized;
          }
          return acc;
        }, {});
    }
    return value;
  }

  buildElementorCompareString(value) {
    try {
      return JSON.stringify(this.normalizeElementorDataForCompare(value));
    } catch (error) {
      return '';
    }
  }

  async getCurrentElementorDataForCompare(site, postId) {
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
      return { error: result };
    }
    const elementorData = this.parseElementorData(
      result.data && result.data.data,
    );
    if (!elementorData) {
      return {
        error: {
          ok: false,
          message: 'Elementor 数据解析失败',
          status: 500,
        },
      };
    }
    return { data: elementorData };
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

    const metaValue = this.buildMetaValue(body.data);
    if (metaValue.error) {
      return { code: 422, data: null, message: metaValue.error };
    }

    const requestBody = {
      post_id: postId,
      meta_value: metaValue.value,
    };
    const currentElementor = await this.getCurrentElementorDataForCompare(
      site,
      postId,
    );
    if (!currentElementor.error) {
      const incomingDataString = this.buildElementorCompareString(
        metaValue.value,
      );
      const currentDataString = this.buildElementorCompareString(
        currentElementor.data,
      );
      if (
        incomingDataString &&
        currentDataString &&
        incomingDataString === currentDataString
      ) {
        console.log('[proxy.update_elementor_data] skip unchanged request', {
          siteId,
          postId,
          bytes: Buffer.byteLength(incomingDataString, 'utf8'),
        });
        return {
          code: 0,
          data: null,
          message: '未做任何修改操作',
        };
      }
    } else {
      console.log('[proxy.update_elementor_data] compare preload failed', {
        siteId,
        postId,
        message: currentElementor.error.message || '',
        status: currentElementor.error.status || 0,
      });
    }
    const requestBodyBytes = Buffer.byteLength(
      JSON.stringify(requestBody),
      'utf8',
    );
    console.log('[proxy.update_elementor_data] first request', {
      siteId,
      postId,
      metaType: Array.isArray(metaValue.value)
        ? 'array'
        : typeof metaValue.value,
      bytes: requestBodyBytes,
    });

    const result = await this.wpClientService.requestJson(
      site,
      '/update_elementor_data',
      {
        method: 'POST',
        body: requestBody,
      },
    );
    const finalResult = result;
    console.log('[proxy.update_elementor_data] response', {
      siteId,
      postId,
      ok: finalResult.ok,
      message: finalResult.message || '',
      status: finalResult.status || 0,
    });
    if (!finalResult.ok) {
      console.log('[proxy.update_elementor_data] raw failure body', {
        siteId,
        postId,
        status: finalResult.status || 0,
        raw: String(finalResult.raw || '').slice(0, 500),
      });
    }
    if (!finalResult.ok) {
      return this.wrapWpError(finalResult);
    }

    const message =
      finalResult.message === '数据未变更' ||
      finalResult.message === '未做任何修改操作'
        ? '未做任何修改操作'
        : finalResult.message || '更新成功';

    return {
      code: 0,
      data: finalResult.data.data || null,
      message,
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
    const hasPagePermission = await this.checkPagePermission(user, siteId, id);
    if (!hasPagePermission) {
      return this.buildPagePermissionDenied(siteId, id);
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
    const pageScope = await this.authService.getUserPagePermissionScope(
      user,
      siteId,
    );
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
    const payload = result.data.data || {
      list: [],
      page,
      page_size: pageSize,
      total: 0,
    };
    const originalList = Array.isArray(payload.list) ? payload.list : [];
    const filteredList = this.filterListByPageScope(originalList, pageScope);

    return {
      code: 0,
      data: {
        ...payload,
        list: filteredList,
        total: filteredList.length,
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
    const hasPagePermission = await this.checkPagePermission(user, siteId, id);
    if (!hasPagePermission) {
      return this.buildPagePermissionDenied(siteId, id);
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
    const hasPagePermission = await this.checkPagePermission(user, siteId, id);
    if (!hasPagePermission) {
      return this.buildPagePermissionDenied(siteId, id);
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
    const pageScope = await this.authService.getUserPagePermissionScope(
      user,
      siteId,
    );
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
    const pageScope = await this.authService.getUserPagePermissionScope(
      user,
      siteId,
    );
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
    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    const id = query.id ? Number(query.id) : 0;
    if (!siteId || !Number.isFinite(id) || id <= 0) {
      return { code: 422, data: null, message: '参数错误' };
    }
    const { site, error } = await this.getProxyContext(siteId, id);
    if (error) {
      return error;
    }

    const { result, error: requestError } = await this.requestProxy(
      site,
      `/news?id=${encodeURIComponent(id)}`,
      { method: 'GET' },
    );
    if (requestError) {
      return requestError;
    }

    return {
      code: 0,
      data: result.data.data || null,
      message: result.message || '获取成功',
    };
  }

  @Get('news_list')
  async getNewsList() {
    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id).trim() : '';
    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }
    const { site, pageScope, error } = await this.getProxyContext(
      siteId,
      0,
      true,
    );
    if (error) {
      return error;
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
    const { result, error: requestError } = await this.requestProxy(
      site,
      path,
      {
        method: 'GET',
      },
      '/news_list',
    );
    if (requestError) {
      return requestError;
    }
    const payload = result.data.data || {
      list: [],
      page,
      page_size: pageSize,
      total: 0,
    };
    const originalList = Array.isArray(payload.list) ? payload.list : [];
    const filteredList = this.filterListByPageScope(originalList, pageScope);

    return {
      code: 0,
      data: {
        ...payload,
        list: filteredList,
        total: filteredList.length,
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
    const hasPagePermission = await this.checkPagePermission(user, siteId, id);
    if (!hasPagePermission) {
      return this.buildPagePermissionDenied(siteId, id);
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
    const hasPagePermission = await this.checkPagePermission(user, siteId, id);
    if (!hasPagePermission) {
      return this.buildPagePermissionDenied(siteId, id);
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
    const hasPagePermission = await this.checkPagePermission(user, siteId, id);
    if (!hasPagePermission) {
      return this.buildPagePermissionDenied(siteId, id);
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
    const hasPagePermission = await this.checkPagePermission(user, siteId, id);
    if (!hasPagePermission) {
      return this.buildPagePermissionDenied(siteId, id);
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
