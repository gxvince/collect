import { Injectable, Dependencies } from '@nestjs/common';
import { SiteService } from '../site/site.service';

@Injectable()
@Dependencies(SiteService)
export class WpClientService {
  constructor(siteService) {
    this.siteService = siteService;
  }

  getTimeoutMs() {
    const raw = Number(process.env.WP_REQUEST_TIMEOUT_MS || 15000);
    return Number.isFinite(raw) && raw > 0 ? raw : 15000;
  }

  getUploadTimeoutMs() {
    const raw = Number(process.env.WP_UPLOAD_TIMEOUT_MS || 60000);
    return Number.isFinite(raw) && raw > 0 ? raw : 60000;
  }

  buildBaseUrl(site) {
    const base = this.siteService.normalizeUrl(site.wp_base_url || '');
    return `${base}/wp-json/custom-db-api/v1`;
  }

  buildFallbackRestUrl(site, path) {
    const base = this.siteService.normalizeUrl(site.wp_base_url || '');
    const rawPath = String(path || '');
    const [pathname, search = ''] = rawPath.split('?');
    const params = new URLSearchParams(search);
    params.set('rest_route', `/custom-db-api/v1${pathname}`);
    return `${base}/?${params.toString()}`;
  }

  buildAuthHeaders(site) {
    const token = site.wp_auth_token || '';
    const authType = (site.wp_auth_type || 'api_key').toLowerCase();
    if (!token) {
      return {};
    }
    if (authType === 'api_key') {
      return { 'x-api-key': token };
    }
    if (authType === 'basic' || authType === 'app_password') {
      const encoded = Buffer.from(token).toString('base64');
      return { Authorization: `Basic ${encoded}` };
    }
    if (authType === 'jwt' || authType === 'bearer') {
      return { Authorization: `Bearer ${token}` };
    }
    return { 'x-api-key': token };
  }

  async requestJson(site, path, { method, headers, body }) {
    const url = `${this.buildBaseUrl(site)}${path}`;
    const fallbackUrl = this.buildFallbackRestUrl(site, path);
    const finalHeaders = { ...this.buildAuthHeaders(site), ...(headers || {}) };
    if (body !== undefined) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    const result = await this.request(url, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (this.shouldRetryWithFallbackRestRoute(result)) {
      return this.request(fallbackUrl, {
        method,
        headers: finalHeaders,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    }
    return result;
  }

  async requestForm(site, path, formData, headers) {
    const url = `${this.buildBaseUrl(site)}${path}`;
    const fallbackUrl = this.buildFallbackRestUrl(site, path);
    const finalHeaders = { ...this.buildAuthHeaders(site), ...(headers || {}) };
    const result = await this.request(url, {
      method: 'POST',
      headers: finalHeaders,
      body: formData,
    }, this.getUploadTimeoutMs());
    if (this.shouldRetryWithFallbackRestRoute(result)) {
      return this.request(fallbackUrl, {
        method: 'POST',
        headers: finalHeaders,
        body: formData,
      }, this.getUploadTimeoutMs());
    }
    return result;
  }

  shouldRetryWithFallbackRestRoute(result) {
    return (
      result &&
      !result.ok &&
      result.status === 404 &&
      result.message === '非JSON响应'
    );
  }

  buildNetworkError(error) {
    const code =
      (error && error.cause && error.cause.code) ||
      error.code ||
      '';
    if (code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
      return {
        ok: false,
        status: 0,
        message: '目标站点使用自签名 HTTPS 证书',
        errorCode: code,
      };
    }
    if (code === 'ENOTFOUND') {
      return {
        ok: false,
        status: 0,
        message: '目标站点域名解析失败',
        errorCode: code,
      };
    }
    if (code === 'ECONNREFUSED') {
      return {
        ok: false,
        status: 0,
        message: '目标站点拒绝连接',
        errorCode: code,
      };
    }
    if (code === 'ETIMEDOUT') {
      return {
        ok: false,
        status: 0,
        message: '目标站点连接超时',
        errorCode: code,
      };
    }
    return {
      ok: false,
      status: 0,
      message:
        error && error.message ? String(error.message) : '请求失败',
      errorCode: code,
    };
  }

  async request(url, options, timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs || this.getTimeoutMs());
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      const text = await res.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (error) {
          return {
            ok: false,
            status: res.status,
            message: '非JSON响应',
            raw: text,
          };
        }
      }

      const ok = res.ok && data && typeof data === 'object' && data.code === 0;
      return {
        ok,
        status: res.status,
        data,
        message: data && data.message ? String(data.message) : '',
      };
    } catch (error) {
      if (error && error.name === 'AbortError') {
        return { ok: false, status: 0, message: '请求超时' };
      }
      return this.buildNetworkError(error);
    } finally {
      clearTimeout(timeout);
    }
  }
}
