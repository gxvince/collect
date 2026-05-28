import { PageConfigController } from './pageconfig.controller';

describe('PageConfigController', () => {
  it('保存素材配置时会按站点和页面写入', async () => {
    const request = {
      headers: { authorization: 'Bearer token' },
      body: {
        site_id: 'site_xxx',
        data: {
          page_id1: [{ id: 1, url: 'http://123.png' }],
        },
      },
    };
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest
        .fn()
        .mockResolvedValue({ id: 1, role: 'admin', is_deleted: 0 }),
      getUserSiteIds: jest.fn(),
      canUserAccessPage: jest.fn(),
    };
    const siteService = {
      findById: jest
        .fn()
        .mockResolvedValue({ site_id: 'site_xxx', is_deleted: 0 }),
    };
    const pageConfigService = {
      upsertMaterials: jest.fn().mockResolvedValue(undefined),
      upsertSizes: jest.fn(),
      upsertAttachData: jest.fn(),
      findBySitePage: jest.fn(),
    };
    const controller = new PageConfigController(
      request,
      authService,
      siteService,
      pageConfigService,
    );

    const result = await controller.saveMaterials();

    expect(result.code).toBe(0);
    expect(pageConfigService.upsertMaterials).toHaveBeenCalledWith({
      siteId: 'site_xxx',
      pageId: 'page_id1',
      materials: [{ id: 1, url: 'http://123.png' }],
    });
  });

  it('保存附加数据时会按站点和页面写入', async () => {
    const request = {
      headers: { authorization: 'Bearer token' },
      body: {
        site_id: 'site_xxx',
        data: {
          page_id1: [{ key: 'custom', value: 123 }],
        },
      },
    };
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest
        .fn()
        .mockResolvedValue({ id: 1, role: 'admin', is_deleted: 0 }),
      getUserSiteIds: jest.fn(),
      canUserAccessPage: jest.fn(),
    };
    const siteService = {
      findById: jest
        .fn()
        .mockResolvedValue({ site_id: 'site_xxx', is_deleted: 0 }),
    };
    const pageConfigService = {
      upsertMaterials: jest.fn(),
      upsertSizes: jest.fn(),
      upsertAttachData: jest.fn().mockResolvedValue(undefined),
      findBySitePage: jest.fn(),
    };
    const controller = new PageConfigController(
      request,
      authService,
      siteService,
      pageConfigService,
    );

    const result = await controller.saveAttachData();

    expect(result.code).toBe(0);
    expect(pageConfigService.upsertAttachData).toHaveBeenCalledWith({
      siteId: 'site_xxx',
      pageId: 'page_id1',
      attachData: [{ key: 'custom', value: 123 }],
    });
  });

  it('查询不存在的页面配置时返回空数组', async () => {
    const request = {
      headers: { authorization: 'Bearer token' },
      query: { site_id: 'site_xxx', page_id: 'page_id1' },
    };
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest
        .fn()
        .mockResolvedValue({ id: 1, role: 'admin', is_deleted: 0 }),
      getUserSiteIds: jest.fn(),
      canUserAccessPage: jest.fn(),
    };
    const siteService = {
      findById: jest
        .fn()
        .mockResolvedValue({ site_id: 'site_xxx', is_deleted: 0 }),
    };
    const pageConfigService = {
      upsertMaterials: jest.fn(),
      upsertSizes: jest.fn(),
      upsertAttachData: jest.fn(),
      findBySitePage: jest.fn().mockResolvedValue(null),
    };
    const controller = new PageConfigController(
      request,
      authService,
      siteService,
      pageConfigService,
    );

    const result = await controller.get();

    expect(result.code).toBe(0);
    expect(result.data.materials).toEqual([]);
    expect(result.data.sizes).toEqual([]);
    expect(result.data.attach_data).toEqual([]);
  });
});
