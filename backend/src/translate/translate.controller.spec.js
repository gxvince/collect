import { TranslateController } from './translate.controller';

describe('TranslateController', () => {
  const admin = { id: 1, role: 'admin', is_deleted: 0 };

  it('returns 401 when not logged in', async () => {
    const request = {
      body: { text: 'hello', target_language: 'zh' },
      headers: {},
    };
    const authService = {
      verifyAccessToken: jest.fn(),
      findUserById: jest.fn(),
    };
    const service = {
      checkConfig: jest.fn().mockReturnValue({ ok: true }),
      translateText: jest.fn(),
    };
    const controller = new TranslateController(request, authService, service);

    const result = await controller.translate();

    expect(result.code).toBe(401);
  });

  it('returns 422 when payload is invalid', async () => {
    const request = {
      body: { target_language: 'en' },
      headers: { authorization: 'Bearer token' },
    };
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest.fn().mockResolvedValue(admin),
    };
    const service = {
      checkConfig: jest.fn().mockReturnValue({ ok: true }),
      translateText: jest.fn(),
    };
    const controller = new TranslateController(request, authService, service);

    const result = await controller.translate();

    expect(result.code).toBe(422);
    expect(service.translateText).not.toHaveBeenCalled();
  });

  it('returns 501 when provider not configured', async () => {
    const request = {
      body: { text: 'hello', target_language: 'zh' },
      headers: { authorization: 'Bearer token' },
    };
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest.fn().mockResolvedValue(admin),
    };
    const service = {
      checkConfig: jest
        .fn()
        .mockReturnValue({ ok: false, message: '未配置翻译服务' }),
      translateText: jest.fn(),
    };
    const controller = new TranslateController(request, authService, service);

    const result = await controller.translate();

    expect(result.code).toBe(501);
    expect(result.message).toBe('未配置翻译服务');
  });

  it('returns translated result when success', async () => {
    const request = {
      body: { text: 'hello', target_language: 'zh' },
      headers: { authorization: 'Bearer token' },
    };
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest.fn().mockResolvedValue(admin),
    };
    const service = {
      checkConfig: jest.fn().mockReturnValue({ ok: true }),
      translateText: jest.fn().mockResolvedValue({ translated_text: '你好' }),
    };
    const controller = new TranslateController(request, authService, service);

    const result = await controller.translate();

    expect(result.code).toBe(0);
    expect(result.data).toEqual({ translated_text: '你好' });
  });

  it('uses professional translate when mode is professional', async () => {
    const request = {
      body: { text: 'hello', target_language: 'zh', mode: 'professional' },
      headers: { authorization: 'Bearer token' },
    };
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest.fn().mockResolvedValue(admin),
    };
    const service = {
      checkConfig: jest.fn().mockReturnValue({ ok: true }),
      translateText: jest.fn(),
      translateProfessional: jest
        .fn()
        .mockResolvedValue({ translated_text: '你好' }),
    };
    const controller = new TranslateController(request, authService, service);

    const result = await controller.translate();

    expect(service.translateProfessional).toHaveBeenCalled();
    expect(result.code).toBe(0);
  });

  it('returns 500 when translate throws', async () => {
    const request = {
      body: { text: 'hello', target_language: 'zh' },
      headers: { authorization: 'Bearer token' },
    };
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest.fn().mockResolvedValue(admin),
    };
    const service = {
      checkConfig: jest.fn().mockReturnValue({ ok: true }),
      translateText: jest.fn().mockRejectedValue(new Error('boom')),
    };
    const controller = new TranslateController(request, authService, service);

    const result = await controller.translate();

    expect(result.code).toBe(500);
    expect(result.message).toContain('boom');
  });
});
