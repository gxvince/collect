import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('用户列表分页', () => {
  let request;
  let authService;
  let dbPool;
  let controller;

  beforeEach(() => {
    request = { headers: { authorization: 'Bearer token' }, query: {} };
    authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest.fn().mockResolvedValue({ id: 1, role: 'admin' }),
      hasUserDisabledSites: jest.fn().mockResolvedValue(false),
    };
    dbPool = { query: jest.fn() };
    controller = new UserController(
      request,
      authService,
      new UserService(dbPool),
    );
  });

  function mockPage(total, users = []) {
    dbPool.query
      .mockResolvedValueOnce([[{ total }]])
      .mockResolvedValueOnce([users]);
    if (users.length) {
      dbPool.query
        .mockResolvedValueOnce([
          [{ user_id: users[0].id, site_id: 'site1', site_name: '站点' }],
        ])
        .mockResolvedValueOnce([
          [{ user_id: users[0].id, site_id: 'site1', page_id: 5, allow: 1 }],
        ]);
    }
  }

  it('默认分页并保留当前页的站点和页面授权', async () => {
    mockPage(30, [{ id: 30, username: 'alice' }]);
    const result = await controller.list();
    expect(result.data).toEqual({
      page: 1,
      page_size: 20,
      total: 30,
      list: [
        {
          id: 30,
          username: 'alice',
          site_ids: ['site1'],
          sites: [{ site_id: 'site1', site_name: '站点' }],
          site_page_ids: [{ site_id: 'site1', page_ids: [5] }],
          site_page_rules: [
            { site_id: 'site1', rules: [{ page_id: 5, allow: true }] },
          ],
        },
      ],
    });
    expect(dbPool.query.mock.calls[1][0]).toContain(
      'ORDER BY id DESC LIMIT ? OFFSET ?',
    );
    expect(dbPool.query.mock.calls[1][1]).toEqual([0, 20, 0]);
    expect(dbPool.query.mock.calls[2][1]).toEqual([30]);
  });

  it.each(['list', 'listDeleted'])(
    '%s 的总数与分页查询使用相同筛选',
    async (method) => {
      request.query = {
        page: '2',
        page_size: '5',
        id: '42',
        username: ' alice ',
      };
      mockPage(1);
      const result = await controller[method]();
      const deleted = method === 'listDeleted' ? 1 : 0;
      expect(result.data).toEqual({
        list: [],
        page: 2,
        page_size: 5,
        total: 1,
      });
      expect(dbPool.query.mock.calls[0]).toEqual([
        'SELECT COUNT(*) AS total FROM users WHERE is_deleted = ? AND id = ? AND username = ?',
        [deleted, 42, 'alice'],
      ]);
      expect(dbPool.query.mock.calls[1][1]).toEqual([
        deleted,
        42,
        'alice',
        5,
        5,
      ]);
      expect(dbPool.query).toHaveBeenCalledTimes(2);
    },
  );

  it.each(['list', 'listDeleted'])('%s 限制每页最多 100 条', async (method) => {
    request.query = { page: '3', page_size: '1000' };
    mockPage(0);
    expect((await controller[method]()).data.page_size).toBe(100);
    expect(dbPool.query.mock.calls[1][1].slice(-2)).toEqual([100, 200]);
  });

  it.each([
    { page: '0' },
    { page: '-1' },
    { page: '1.5' },
    { page: 'abc' },
    { page: '' },
    { page: ['1', '2'] },
    { page: '9007199254740992' },
    { page: '9007199254740991', page_size: '100' },
    { page_size: '0' },
    { page_size: '-5' },
    { page_size: '1.5' },
    { page_size: 'Infinity' },
    { page_size: '' },
    { page_size: {} },
  ])('拒绝无效分页参数 %j', async (query) => {
    request.query = query;
    for (const method of ['list', 'listDeleted']) {
      expect((await controller[method]()).code).toBe(422);
    }
    expect(dbPool.query).not.toHaveBeenCalled();
  });

  it.each(['list', 'listDeleted'])(
    '%s 拒绝未登录和非管理员访问',
    async (method) => {
      request.headers = {};
      expect((await controller[method]()).code).toBe(401);
      request.headers.authorization = 'Bearer token';
      authService.findUserById.mockResolvedValue({ id: 2, role: 'user' });
      expect((await controller[method]()).code).toBe(403);
      expect(dbPool.query).not.toHaveBeenCalled();
    },
  );
});
