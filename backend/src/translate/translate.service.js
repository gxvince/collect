import * as Alimt20181012 from '@alicloud/alimt20181012';
import { Config } from '@alicloud/openapi-client';
import { RuntimeOptions } from '@alicloud/tea-util';

export class TranslateService {
  constructor() {
    this.client = null;
  }

  getProvider() {
    return String(process.env.TRANSLATE_PROVIDER || '')
      .trim()
      .toLowerCase();
  }

  checkConfig() {
    if (this.getProvider() !== 'aliyun') {
      return { ok: false, message: '未配置翻译服务' };
    }

    const accessKeyId = String(process.env.ALIYUN_ACCESS_KEY_ID || '').trim();
    const accessKeySecret = String(
      process.env.ALIYUN_ACCESS_KEY_SECRET || '',
    ).trim();
    const regionId = String(process.env.ALIYUN_REGION_ID || '').trim();

    if (!accessKeyId || !accessKeySecret || !regionId) {
      return { ok: false, message: '翻译服务配置缺失' };
    }

    return { ok: true };
  }

  buildClient() {
    const accessKeyId = String(process.env.ALIYUN_ACCESS_KEY_ID || '').trim();
    const accessKeySecret = String(
      process.env.ALIYUN_ACCESS_KEY_SECRET || '',
    ).trim();
    const regionId = String(process.env.ALIYUN_REGION_ID || '').trim();
    const endpoint = String(process.env.ALIYUN_TRANSLATE_ENDPOINT || '').trim();

    const config = new Config({
      accessKeyId,
      accessKeySecret,
      regionId,
    });
    if (endpoint) {
      config.endpoint = endpoint;
    }

    return new Alimt20181012.default(config);
  }

  getClient() {
    if (this.client) {
      return this.client;
    }

    const check = this.checkConfig();
    if (!check.ok) {
      const error = new Error(check.message);
      error.code = 'TRANSLATE_NOT_CONFIGURED';
      throw error;
    }

    this.client = this.buildClient();
    return this.client;
  }

  normalizeResponse(response) {
    const body = response && response.body ? response.body : {};
    const respCode = body.code !== undefined ? body.code : body.Code;
    if (respCode !== undefined && respCode !== 200) {
      return {
        error: {
          code: Number(respCode),
          message: body.message || body.Message || '翻译服务返回错误',
        },
        request_id: body.RequestId || body.requestId || '',
        raw: body,
      };
    }
    const rawData = body.data !== undefined ? body.data : body.Data;
    let translatedText = '';
    let detectedLanguage = '';

    if (typeof rawData === 'string') {
      const trimmed = rawData.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(rawData);
          if (parsed && typeof parsed === 'object') {
            translatedText =
              parsed.Translated ||
              parsed.translated ||
              parsed.translatedText ||
              '';
            detectedLanguage =
              parsed.DetectedLanguage || parsed.detectedLanguage || '';
          } else {
            translatedText = rawData;
          }
        } catch (error) {
          translatedText = rawData;
        }
      } else {
        translatedText = rawData;
      }
    } else if (rawData && typeof rawData === 'object') {
      translatedText =
        rawData.Translated ||
        rawData.translated ||
        rawData.translatedText ||
        '';
      detectedLanguage =
        rawData.DetectedLanguage || rawData.detectedLanguage || '';
    }

    if (!detectedLanguage) {
      detectedLanguage = body.DetectedLanguage || body.detectedLanguage || '';
    }

    return {
      translated_text: translatedText,
      detected_language: detectedLanguage,
      request_id: body.RequestId || body.requestId || '',
      raw: body,
    };
  }

  async translateText({ text, sourceLanguage, targetLanguage, formatType }) {
    const client = this.getClient();
    const request = new Alimt20181012.TranslateGeneralRequest({
      sourceLanguage,
      targetLanguage,
      sourceText: text,
      formatType: formatType || 'text',
    });
    const runtime = new RuntimeOptions({});
    const response = await client.translateGeneralWithOptions(request, runtime);
    return this.normalizeResponse(response);
  }

  async translateProfessional({
    text,
    sourceLanguage,
    targetLanguage,
    formatType,
    scene,
    context,
  }) {
    const client = this.getClient();
    const request = new Alimt20181012.TranslateRequest({
      sourceLanguage,
      targetLanguage,
      sourceText: text,
      formatType: formatType || 'text',
      scene: scene || undefined,
      context: context || undefined,
    });
    const runtime = new RuntimeOptions({});
    const response = await client.translateWithOptions(request, runtime);
    return this.normalizeResponse(response);
  }
}
