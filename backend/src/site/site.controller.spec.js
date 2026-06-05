import { SiteController } from './site.controller';

describe('SiteController', () => {
  function createAuthService() {
    return {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest
        .fn()
        .mockResolvedValue({ id: 1, role: 'admin', is_deleted: 0 }),
    };
  }

  it('创建站点时会保存可选 metadata', async () => {
    const request = {
      headers: { authorization: 'Bearer token' },
      body: {
        site_name: 'Demo',
        metadata: { note: '备注', rows: [{ id: 1 }] },
      },
    };
    const siteService = {
      normalizeUrl: jest.fn().mockReturnValue(''),
      createSite: jest.fn().mockResolvedValue(undefined),
    };
    const controller = new SiteController(
      request,
      siteService,
      createAuthService(),
    );

    const result = await controller.createSite();

    expect(result.code).toBe(0);
    expect(siteService.createSite).toHaveBeenCalledWith(
      expect.objectContaining({
        siteName: 'Demo',
        metadata: JSON.stringify({ note: '备注', rows: [{ id: 1 }] }),
      }),
    );
    expect(result.data.metadata).toEqual({ note: '备注', rows: [{ id: 1 }] });
  });

  it('更新站点时会保存 null metadata', async () => {
    const request = {
      headers: { authorization: 'Bearer token' },
      body: {
        site_id: 'site_xxx',
        metadata: null,
      },
    };
    const siteService = {
      findById: jest
        .fn()
        .mockResolvedValue({ site_id: 'site_xxx', is_deleted: 0 }),
      updateSite: jest.fn().mockResolvedValue({
        site_id: 'site_xxx',
        metadata: null,
      }),
    };
    const controller = new SiteController(
      request,
      siteService,
      createAuthService(),
    );

    const result = await controller.updateSite();

    expect(result.code).toBe(0);
    expect(siteService.updateSite).toHaveBeenCalledWith('site_xxx', {
      metadata: null,
    });
  });

  it('metadata 字符串不是合法 JSON 时返回 422', async () => {
    const request = {
      headers: { authorization: 'Bearer token' },
      body: {
        site_name: 'Demo',
        metadata: '{bad',
      },
    };
    const siteService = {
      normalizeUrl: jest.fn().mockReturnValue(''),
      createSite: jest.fn(),
    };
    const controller = new SiteController(
      request,
      siteService,
      createAuthService(),
    );

    const result = await controller.createSite();

    expect(result.code).toBe(422);
    expect(siteService.createSite).not.toHaveBeenCalled();
  });
});
