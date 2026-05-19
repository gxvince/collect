import { Controller, Dependencies, Post, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthService } from '../auth/auth.service';
import { TranslateService } from './translate.service';

@Controller({ scope: Scope.REQUEST })
@Dependencies(REQUEST, AuthService, TranslateService)
export class TranslateController {
  constructor(request, authService, translateService) {
    this.request = request;
    this.authService = authService;
    this.translateService = translateService;
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

  parsePayload() {
    const body = this.request.body || {};
    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const mode =
      typeof body.mode === 'string' && body.mode.trim()
        ? body.mode.trim().toLowerCase()
        : '';
    const sourceLanguage =
      typeof body.source_language === 'string' && body.source_language.trim()
        ? body.source_language.trim()
        : 'auto';
    const targetLanguage =
      typeof body.target_language === 'string'
        ? body.target_language.trim()
        : '';
    const formatType =
      typeof body.format_type === 'string' && body.format_type.trim()
        ? body.format_type.trim()
        : 'text';
    const scene =
      typeof body.scene === 'string' && body.scene.trim()
        ? body.scene.trim()
        : '';
    const context =
      typeof body.context === 'string' && body.context.trim()
        ? body.context.trim()
        : '';

    return {
      text,
      mode,
      sourceLanguage,
      targetLanguage,
      formatType,
      scene,
      context,
    };
  }

  validatePayload(payload) {
    if (!payload.text || !payload.targetLanguage) {
      return { ok: false, message: '参数错误' };
    }
    if (payload.text.length > 5000) {
      return { ok: false, message: '文本过长' };
    }
    return { ok: true };
  }

  async handleTranslate() {
    const { error } = await this.getAuthUser();
    if (error) {
      return { code: error.code, data: null, message: error.message };
    }

    const config = this.translateService.checkConfig();
    if (!config.ok) {
      return { code: 501, data: null, message: config.message };
    }

    const payload = this.parsePayload();
    const validation = this.validatePayload(payload);
    if (!validation.ok) {
      return { code: 422, data: null, message: validation.message };
    }

    try {
      const useProfessional = payload.mode === 'professional';
      const result = useProfessional
        ? await this.translateService.translateProfessional(payload)
        : await this.translateService.translateText(payload);
      if (result && result.error) {
        const errorCode = Number(result.error.code);
        const message = result.error.message || '翻译失败';
        if (errorCode === 10004) {
          return { code: 422, data: null, message };
        }
        return { code: 500, data: null, message };
      }
      return { code: 0, data: result, message: '翻译成功' };
    } catch (error) {
      const detail = error && error.message ? `：${error.message}` : '';
      return { code: 500, data: null, message: `翻译失败${detail}` };
    }
  }

  @Post('api/proxy/translate')
  async translate() {
    return this.handleTranslate();
  }
}
