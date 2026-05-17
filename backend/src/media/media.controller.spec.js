import { MediaController } from './media.controller';

describe('MediaController', () => {
  it('未登录时返回 401', async () => {
    const request = { headers: {}, body: {} };
    const authService = {
      verifyAccessToken: jest.fn(),
      findUserById: jest.fn(),
    };
    const mediaService = {
      findById: jest.fn(),
      listMedia: jest.fn(),
    };
    const controller = new MediaController(request, authService, mediaService);

    const result = await controller.get();

    expect(result.code).toBe(401);
  });

  it('保存单条素材时会新增记录', async () => {
    const request = {
      headers: { authorization: 'Bearer token' },
      body: { demo: 'demo67', page: 'home', url: 'http://123.png' },
    };
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest
        .fn()
        .mockResolvedValue({ id: 1, role: 'admin', is_deleted: 0 }),
    };
    const mediaService = {
      findById: jest.fn(),
      createMedia: jest.fn().mockResolvedValue({
        id: 1,
        demo: 'demo67',
        page: 'home',
        url: 'http://123.png',
      }),
      updateMedia: jest.fn(),
    };
    const controller = new MediaController(request, authService, mediaService);

    const result = await controller.save();

    expect(result.code).toBe(0);
    expect(mediaService.createMedia).toHaveBeenCalledWith({
      demo: 'demo67',
      page: 'home',
      url: 'http://123.png',
    });
  });

  it('不传 id、demo、page 时会返回默认分页列表', async () => {
    const request = {
      headers: { authorization: 'Bearer token' },
      query: {},
    };
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest
        .fn()
        .mockResolvedValue({ id: 1, role: 'admin', is_deleted: 0 }),
    };
    const mediaService = {
      listMedia: jest.fn().mockResolvedValue({
        list: [{ id: 2, demo: 'demo67', page: 'home', url: 'http://123.png' }],
        total: 1,
      }),
    };
    const controller = new MediaController(request, authService, mediaService);

    const result = await controller.get();

    expect(result.code).toBe(0);
    expect(mediaService.listMedia).toHaveBeenCalledWith({
      demo: '',
      pageName: '',
      page: 1,
      pageSize: 10,
    });
    expect(result.data).toEqual({
      list: [{ id: 2, demo: 'demo67', page: 'home', url: 'http://123.png' }],
      total: 1,
      page: 1,
      page_size: 10,
    });
  });

  it('分页查询会兼容旧的非数字 page 过滤并回退非法 page_size', async () => {
    const request = {
      headers: { authorization: 'Bearer token' },
      query: { demo: 'demo67', page: 'home', page_size: '20' },
    };
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest
        .fn()
        .mockResolvedValue({ id: 1, role: 'admin', is_deleted: 0 }),
    };
    const mediaService = {
      listMedia: jest.fn().mockResolvedValue({
        list: [],
        total: 0,
      }),
    };
    const controller = new MediaController(request, authService, mediaService);

    const result = await controller.get();

    expect(result.code).toBe(0);
    expect(mediaService.listMedia).toHaveBeenCalledWith({
      demo: 'demo67',
      pageName: 'home',
      page: 1,
      pageSize: 10,
    });
  });

  it('按 id 查询时保持单条返回结构不变', async () => {
    const request = {
      headers: { authorization: 'Bearer token' },
      query: { id: '2' },
    };
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest
        .fn()
        .mockResolvedValue({ id: 1, role: 'admin', is_deleted: 0 }),
    };
    const mediaService = {
      findById: jest.fn().mockResolvedValue({
        id: 2,
        demo: 'demo67',
        page: 'home',
        url: 'http://123.png',
      }),
      listMedia: jest.fn(),
    };
    const controller = new MediaController(request, authService, mediaService);

    const result = await controller.get();

    expect(result.code).toBe(0);
    expect(result.data).toEqual({
      id: 2,
      demo: 'demo67',
      page: 'home',
      url: 'http://123.png',
    });
    expect(mediaService.listMedia).not.toHaveBeenCalled();
  });

  it('传入非法 id 时返回 422', async () => {
    const request = {
      headers: { authorization: 'Bearer token' },
      query: { id: 'abc' },
    };
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
      findUserById: jest
        .fn()
        .mockResolvedValue({ id: 1, role: 'admin', is_deleted: 0 }),
    };
    const mediaService = {
      findById: jest.fn(),
      listMedia: jest.fn(),
    };
    const controller = new MediaController(request, authService, mediaService);

    const result = await controller.get();

    expect(result.code).toBe(422);
    expect(mediaService.findById).not.toHaveBeenCalled();
    expect(mediaService.listMedia).not.toHaveBeenCalled();
  });
});
