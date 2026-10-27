import { ProxyController } from './proxy.controller';

describe('ProxyController', () => {
  describe('内容创建开关', () => {
    let originalEnabled;

    beforeEach(() => {
      originalEnabled = process.env.PROXY_CONTENT_CREATE_ENABLED;
      delete process.env.PROXY_CONTENT_CREATE_ENABLED;
    });

    afterEach(() => {
      if (originalEnabled === undefined) {
        delete process.env.PROXY_CONTENT_CREATE_ENABLED;
      } else {
        process.env.PROXY_CONTENT_CREATE_ENABLED = originalEnabled;
      }
    });

    function createController(role = 'admin') {
      return new ProxyController(
        {
          headers: { authorization: 'Bearer token' },
          body: { site_id: 'site_demo', post_type: 'post', title: '测试' },
        },
        {
          verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
          findUserById: jest.fn().mockResolvedValue({ id: 1, role }),
          hasUserDisabledSites: jest.fn().mockResolvedValue(false),
          getUserSiteIds: jest.fn().mockResolvedValue([]),
        },
        {
          findById: jest.fn().mockResolvedValue({
            wp_base_url: 'https://example.com',
            wp_auth_token: 'token',
          }),
        },
        {
          requestJson: jest.fn().mockResolvedValue({
            ok: true,
            data: { data: { id: 123 } },
          }),
        },
      );
    }

    it.each([undefined, 'false', '', '1', 'TRUE'])(
      '配置为 %s 时禁用，且不查询数据库或调用 WordPress',
      async (value) => {
        if (value !== undefined) {
          process.env.PROXY_CONTENT_CREATE_ENABLED = value;
        }
        const controller = createController();
        await expect(controller.createContent()).resolves.toEqual({
          code: 503,
          data: null,
          message: '内容创建接口暂时禁用',
        });
        expect(controller.authService.verifyAccessToken).not.toHaveBeenCalled();
        expect(controller.siteService.findById).not.toHaveBeenCalled();
        expect(controller.wpClientService.requestJson).not.toHaveBeenCalled();
      },
    );

    it('显式开启后恢复创建，转发时去除 site_id', async () => {
      process.env.PROXY_CONTENT_CREATE_ENABLED = 'true';
      const controller = createController();
      await expect(controller.createContent()).resolves.toEqual({
        code: 0,
        data: { id: 123 },
        message: '创建成功',
      });
      expect(controller.wpClientService.requestJson).toHaveBeenCalledWith(
        expect.objectContaining({ wp_base_url: 'https://example.com' }),
        '/content_create',
        { method: 'POST', body: { post_type: 'post', title: '测试' } },
      );
    });

    it('开启后仍要求登录', async () => {
      process.env.PROXY_CONTENT_CREATE_ENABLED = 'true';
      const controller = createController();
      controller.request.headers = {};
      await expect(controller.createContent()).resolves.toEqual({
        code: 401,
        data: null,
        message: '未登录',
      });
      expect(controller.wpClientService.requestJson).not.toHaveBeenCalled();
    });

    it('开启后仍拦截无站点权限的用户', async () => {
      process.env.PROXY_CONTENT_CREATE_ENABLED = 'true';
      const controller = createController('user');
      await expect(controller.createContent()).resolves.toEqual({
        code: 403,
        data: null,
        message: '无权限',
      });
      expect(controller.siteService.findById).not.toHaveBeenCalled();
      expect(controller.wpClientService.requestJson).not.toHaveBeenCalled();
    });
  });

  it('缺少 Bearer token 时返回 401', async () => {
    const controller = new ProxyController(
      { headers: {}, query: { site_id: 'site_demo' } },
      {},
      {},
      {},
    );

    await expect(controller.getPostTypes()).resolves.toEqual({
      code: 401,
      data: null,
      message: '未登录',
    });
  });

  it('普通用户无站点权限时不查询站点', async () => {
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest.fn().mockResolvedValue({ id: 1, role: 'user' }),
      hasUserDisabledSites: jest.fn().mockResolvedValue(false),
      getUserSiteIds: jest.fn().mockResolvedValue([]),
    };
    const siteService = { findById: jest.fn() };
    const controller = new ProxyController(
      { headers: { authorization: 'Bearer token' }, query: { site_id: 'x' } },
      authService,
      siteService,
      {},
    );

    await expect(controller.getPostTypes()).resolves.toEqual({
      code: 403,
      data: null,
      message: '无权限',
    });
    expect(siteService.findById).not.toHaveBeenCalled();
  });

  it('WP 请求失败时保留统一错误包装和请求路径', async () => {
    const user = { id: 1, role: 'admin', is_deleted: 0 };
    const requestJson = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      message: '目标站点不可用',
    });
    const controller = new ProxyController(
      { headers: { authorization: 'Bearer token' }, query: { site_id: 'x' } },
      {
        verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
        findUserById: jest.fn().mockResolvedValue(user),
        getUserSiteIds: jest.fn(),
      },
      {
        findById: jest.fn().mockResolvedValue({
          wp_base_url: 'https://example.com',
          wp_auth_token: 'token',
        }),
      },
      { requestJson },
    );

    await expect(controller.getPostTypes()).resolves.toEqual({
      code: 502,
      data: null,
      message: '目标站点不可用',
    });
    expect(requestJson).toHaveBeenCalledWith(
      expect.objectContaining({ wp_base_url: 'https://example.com' }),
      '/post_types',
      { method: 'GET' },
    );
  });

  it('news_list 会按页面权限过滤列表', async () => {
    const request = {
      headers: { authorization: 'Bearer token' },
      query: { site_id: 'site_demo', page: '1', page_size: '20' },
    };
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest.fn().mockResolvedValue({
        id: 1,
        role: 'admin',
        is_deleted: 0,
      }),
      getUserPagePermissionScope: jest.fn().mockResolvedValue({
        restricted: true,
        allowedPageIds: [2],
        rules: [{ page_id: 2, allow: true }],
      }),
      getUserSiteIds: jest.fn(),
    };
    const siteService = {
      findById: jest.fn().mockResolvedValue({
        site_id: 'site_demo',
        wp_base_url: 'https://example.com',
        wp_auth_token: 'pt_demo',
        is_deleted: 0,
      }),
    };
    const wpClientService = {
      requestJson: jest.fn().mockResolvedValue({
        ok: true,
        data: {
          data: {
            list: [
              { id: 1, title: '新闻1' },
              { id: 2, title: '新闻2' },
            ],
            page: 1,
            page_size: 20,
            total: 2,
          },
        },
        message: '获取成功',
      }),
    };
    const controller = new ProxyController(
      request,
      authService,
      siteService,
      wpClientService,
    );

    const result = await controller.getNewsList();

    expect(authService.getUserPagePermissionScope).toHaveBeenCalledWith(
      { id: 1, role: 'admin', is_deleted: 0 },
      'site_demo',
    );
    expect(result.code).toBe(0);
    expect(result.data.list).toEqual([{ id: 2, title: '新闻2' }]);
    expect(result.data.total).toBe(1);
  });
});
