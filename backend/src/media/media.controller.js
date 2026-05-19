import { Controller, Dependencies, Get, Post, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import fs from 'fs';
import path from 'path';
import { AuthService } from '../auth/auth.service';
import { MediaService } from './media.service';

const DEFAULT_MEDIA_PAGE_SIZE = 10;
const ALLOWED_MEDIA_PAGE_SIZES = [10, 50, 100, 1000];

@Controller({ path: 'api/media', scope: Scope.REQUEST })
@Dependencies(REQUEST, AuthService, MediaService)
export class MediaController {
  constructor(request, authService, mediaService) {
    this.request = request;
    this.authService = authService;
    this.mediaService = mediaService;
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

  normalizeId(value) {
    if (value === undefined || value === null || value === '') {
      return 0;
    }
    const id = Number(value);
    return Number.isFinite(id) && id > 0 ? id : 0;
  }

  normalizePage(value) {
    const page = Number(value);
    return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  }

  normalizePageSize(value) {
    const pageSize = Number(value);
    if (!ALLOWED_MEDIA_PAGE_SIZES.includes(pageSize)) {
      return DEFAULT_MEDIA_PAGE_SIZE;
    }
    return pageSize;
  }

  parsePageNameFilter(query) {
    const pageName = this.normalizeText(query.page_name);
    if (pageName) {
      return pageName;
    }

    const legacyPage = this.normalizeText(query.page);
    if (legacyPage && !/^\d+$/.test(legacyPage)) {
      return legacyPage;
    }

    return '';
  }

  isExternalUrl(value) {
    return /^https?:\/\//i.test(String(value || '').trim());
  }

  buildMediaUrl(rawUrl) {
    const value = this.normalizeText(rawUrl);
    if (!value) {
      return '';
    }
    if (this.isExternalUrl(value)) {
      return value;
    }
    const publicBaseUrl = this.normalizeText(
      process.env.PUBLIC_BASE_URL,
    ).replace(/\/+$/, '');
    const normalized = value.replace(/^\/+/, '');
    return publicBaseUrl ? `${publicBaseUrl}/${normalized}` : normalized;
  }

  getUploadDirInfo() {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const baseDir = path.isAbsolute(uploadDir)
      ? uploadDir
      : path.resolve(__dirname, '..', '..', uploadDir);
    const relativeRoot = path.isAbsolute(uploadDir)
      ? path.basename(uploadDir)
      : uploadDir;
    return { baseDir, relativeRoot };
  }

  sanitizePathSegment(value, fallback) {
    const normalized = this.normalizeText(value).replace(
      /[^a-zA-Z0-9_-]+/g,
      '_',
    );
    return normalized || fallback;
  }

  buildDateString() {
    const now = new Date();
    const y = String(now.getFullYear());
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  validateFile(file) {
    if (!file) {
      return { ok: false, message: '未上传文件' };
    }
    const allowedExt = ['.png', '.jpg', '.jpeg', '.webp'];
    const allowedMime = ['image/png', 'image/jpeg', 'image/webp'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!allowedExt.includes(ext) || !allowedMime.includes(file.mimetype)) {
      return { ok: false, message: '文件格式不支持' };
    }
    return { ok: true, ext };
  }

  saveUploadedFile(file, demo, pageName) {
    const validation = this.validateFile(file);
    if (!validation.ok) {
      return { error: validation.message };
    }

    const { baseDir, relativeRoot } = this.getUploadDirInfo();
    const dateStr = this.buildDateString();
    const safeDemo = this.sanitizePathSegment(demo, 'demo');
    const safePage = this.sanitizePathSegment(pageName, 'page');
    const rand = Math.random().toString(36).slice(2, 8);
    const filename = `${Date.now()}_${rand}${validation.ext}`;
    const relativePath = path
      .join(relativeRoot, 'demo_media', safeDemo, safePage, dateStr, filename)
      .replace(/\\/g, '/');
    const destPath = path.join(
      baseDir,
      'demo_media',
      safeDemo,
      safePage,
      dateStr,
      filename,
    );

    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.writeFileSync(destPath, file.buffer);
    return { url: relativePath };
  }

  normalizeSaveItems(body) {
    if (Array.isArray(body)) {
      return body;
    }
    if (body && Array.isArray(body.data)) {
      return body.data;
    }
    if (body && typeof body === 'object') {
      return [body];
    }
    return [];
  }

  async buildSavePayload(rawItem, fileUrl) {
    const id = this.normalizeId(rawItem && rawItem.id);
    const hasDemo =
      rawItem && Object.prototype.hasOwnProperty.call(rawItem, 'demo');
    const hasPage =
      rawItem && Object.prototype.hasOwnProperty.call(rawItem, 'page');
    const hasUrl =
      fileUrl !== undefined ||
      (rawItem && Object.prototype.hasOwnProperty.call(rawItem, 'url'));

    if (!id) {
      const demo = this.normalizeText(rawItem && rawItem.demo);
      const pageName = this.normalizeText(rawItem && rawItem.page);
      const url =
        fileUrl !== undefined
          ? fileUrl
          : this.normalizeText(rawItem && rawItem.url);
      if (!demo || !pageName || !url) {
        return { error: '参数错误' };
      }
      return {
        value: {
          demo,
          page: pageName,
          url,
        },
      };
    }

    const existing = await this.mediaService.findById(id);
    if (!existing) {
      return { error: '资源不存在', code: 404 };
    }

    const payload = { id };
    if (hasDemo) {
      const demo = this.normalizeText(rawItem.demo);
      if (!demo) {
        return { error: '参数错误' };
      }
      payload.demo = demo;
    }
    if (hasPage) {
      const pageName = this.normalizeText(rawItem.page);
      if (!pageName) {
        return { error: '参数错误' };
      }
      payload.page = pageName;
    }
    if (hasUrl) {
      const url =
        fileUrl !== undefined ? fileUrl : this.normalizeText(rawItem.url);
      if (!url) {
        return { error: '参数错误' };
      }
      payload.url = url;
    }

    if (
      payload.demo === undefined &&
      payload.page === undefined &&
      payload.url === undefined
    ) {
      return { error: '参数错误' };
    }

    return {
      value: {
        ...payload,
        demo: payload.demo !== undefined ? payload.demo : existing.demo,
        page: payload.page !== undefined ? payload.page : existing.page,
      },
    };
  }

  formatMediaItem(item) {
    if (!item) {
      return null;
    }
    return {
      ...item,
      url: this.buildMediaUrl(item.url),
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

    const file = this.request.file;
    if (file) {
      const body = this.request.body || {};
      const id = this.normalizeId(body.id);
      let demo = this.normalizeText(body.demo);
      let pageName = this.normalizeText(body.page);

      if (id && (!demo || !pageName)) {
        const existing = await this.mediaService.findById(id);
        if (!existing) {
          return { code: 404, data: null, message: '资源不存在' };
        }
        demo = demo || existing.demo;
        pageName = pageName || existing.page;
      }

      if (!demo || !pageName) {
        return { code: 422, data: null, message: '参数错误' };
      }

      const uploadResult = this.saveUploadedFile(file, demo, pageName);
      if (uploadResult.error) {
        return { code: 422, data: null, message: uploadResult.error };
      }

      const payloadResult = await this.buildSavePayload(body, uploadResult.url);
      if (payloadResult.error) {
        return {
          code: payloadResult.code || 422,
          data: null,
          message: payloadResult.error,
        };
      }

      const payload = payloadResult.value;
      const item = payload.id
        ? await this.mediaService.updateMedia(payload.id, payload)
        : await this.mediaService.createMedia(payload);

      return {
        code: 0,
        data: this.formatMediaItem(item),
        message: '保存成功',
      };
    }

    const items = this.normalizeSaveItems(this.request.body);
    if (!items.length) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const resultList = [];
    for (const rawItem of items) {
      const payloadResult = await this.buildSavePayload(rawItem);
      if (payloadResult.error) {
        return {
          code: payloadResult.code || 422,
          data: null,
          message: payloadResult.error,
        };
      }
      const payload = payloadResult.value;
      const item = payload.id
        ? await this.mediaService.updateMedia(payload.id, payload)
        : await this.mediaService.createMedia(payload);
      resultList.push(this.formatMediaItem(item));
    }

    return {
      code: 0,
      data: resultList,
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
    const rawId = this.normalizeText(query.id);
    const id = this.normalizeId(rawId);

    if (rawId && !id) {
      return { code: 422, data: null, message: '参数错误' };
    }

    if (id) {
      const item = await this.mediaService.findById(id);
      if (!item) {
        return { code: 404, data: null, message: '资源不存在' };
      }
      return {
        code: 0,
        data: this.formatMediaItem(item),
        message: '获取成功',
      };
    }

    const demo = this.normalizeText(query.demo);
    const pageName = this.parsePageNameFilter(query);
    const page = this.normalizePage(query.page);
    const pageSize = this.normalizePageSize(query.page_size);

    const { list, total } = await this.mediaService.listMedia({
      demo,
      pageName,
      page,
      pageSize,
    });

    return {
      code: 0,
      data: {
        list: list.map((item) => this.formatMediaItem(item)),
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
    const id = this.normalizeId(body.id);
    if (!id) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const item = await this.mediaService.findById(id);
    if (!item) {
      return { code: 404, data: null, message: '资源不存在' };
    }

    // 本地文件则物理删除
    if (!this.isExternalUrl(item.url)) {
      const { baseDir } = this.getUploadDirInfo();
      const filePath = path.resolve(baseDir, item.url);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.log('[media.delete] 文件删除失败', { id, filePath, error: err.message });
      }
    }

    const deleted = await this.mediaService.deleteMedia(id);
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
