import { ProxyController } from './proxy.controller';

describe('ProxyController', () => {
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
