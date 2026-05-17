import { Controller, Dependencies, Get, Post, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthService } from '../auth/auth.service';
import { FileService } from './file.service';
import fs from 'fs';
import path from 'path';

@Controller({ path: 'api/file', scope: Scope.REQUEST })
@Dependencies(REQUEST, AuthService, FileService)
export class FileController {
  constructor(request, authService, fileService) {
    this.request = request;
    this.authService = authService;
    this.fileService = fileService;
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

  getUploadDir() {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const baseDir = path.isAbsolute(uploadDir)
      ? uploadDir
      : path.resolve(__dirname, '..', '..', uploadDir);
    return { uploadDir, baseDir };
  }

  buildDateString() {
    const now = new Date();
    const y = String(now.getFullYear());
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }

  buildFileUrl(filePath) {
    const normalizedPath = String(filePath || '').replace(/^\/+/, '');
    const publicBaseUrl = (process.env.PUBLIC_BASE_URL || '')
      .trim()
      .replace(/\/+$/, '');
    if (!normalizedPath) {
      return '';
    }
    if (!publicBaseUrl) {
      return normalizedPath;
    }
    return `${publicBaseUrl}/${normalizedPath}`;
  }

  @Post('upload')
  async upload() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const { site_id: siteId, elementor_id: elementorId } =
      this.request.body || {};
    if (!siteId || !elementorId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const file = this.request.file;
    if (!file) {
      return { code: 422, data: null, message: '未上传文件' };
    }

    const allowedExt = ['.png', '.jpg', '.jpeg', '.webp'];
    const allowedMime = ['image/png', 'image/jpeg', 'image/webp'];
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!allowedExt.includes(ext) || !allowedMime.includes(file.mimetype)) {
      return { code: 422, data: null, message: '文件格式不支持' };
    }

    const maxSizeMb = Number(process.env.UPLOAD_MAX_SIZE_MB || 10);
    if (file.size > maxSizeMb * 1024 * 1024) {
      return { code: 422, data: null, message: '文件过大' };
    }

    const { uploadDir, baseDir } = this.getUploadDir();
    const dateStr = this.buildDateString();
    const rand = Math.random().toString(36).slice(2, 8);
    const filename = `${Date.now()}_${rand}${ext}`;
    const relativeDir = path.join(uploadDir, siteId, dateStr);
    const relativePath = path.join(relativeDir, filename).replace(/\\/g, '/');
    const destDir = path.join(baseDir, siteId, dateStr);
    const destPath = path.join(destDir, filename);

    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(destPath, file.buffer);

    const fileId = await this.fileService.createFile({
      siteId,
      elementorId,
      fileUrl: relativePath,
      createdBy: user.id,
    });

    return {
      code: 0,
      data: { id: fileId, file_url: this.buildFileUrl(relativePath) },
      message: '上传成功',
    };
  }

  @Get('get')
  async getList() {
    const { user, error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const query = this.request.query || {};
    const siteId = query.site_id ? String(query.site_id) : '';
    const elementorId = query.elementor_id ? String(query.elementor_id) : '';
    let page = Number(query.page || 1);
    let pageSize = Number(query.page_size || 20);

    if (!siteId) {
      return { code: 422, data: null, message: '参数错误' };
    }

    if (!Number.isFinite(page) || page <= 0) {
      page = 1;
    }
    if (!Number.isFinite(pageSize) || pageSize <= 0) {
      pageSize = 20;
    }
    pageSize = Math.min(pageSize, 100);

    const hasPermission = await this.checkSitePermission(user, siteId);
    if (!hasPermission) {
      return { code: 403, data: null, message: '无权限' };
    }

    const { total, list } = await this.fileService.listFiles({
      siteId,
      elementorId,
      page,
      pageSize,
    });
    const resultList = list.map((item) => ({
      ...item,
      file_url: this.buildFileUrl(item.file_url),
    }));

    return {
      code: 0,
      data: { list: resultList, page, page_size: pageSize, total },
      message: '获取成功',
    };
  }
}
