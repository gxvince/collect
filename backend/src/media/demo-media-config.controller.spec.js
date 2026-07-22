import { DemoMediaConfigController } from './demo-media-config.controller';

function createController(body, existing) {
  const request = {
    headers: { authorization: 'Bearer token' },
    body,
  };
  const authService = {
    verifyAccessToken: jest.fn().mockResolvedValue({ user_id: 1 }),
    findUserById: jest
      .fn()
      .mockResolvedValue({ id: 1, role: 'admin', is_deleted: 0 }),
  };
  const configService = {
    findByDemo: jest.fn().mockResolvedValue(existing),
    save: jest.fn().mockImplementation(async (data) => ({ id: 1, ...data })),
  };
  return {
    controller: new DemoMediaConfigController(
      request,
      authService,
      configService,
    ),
    configService,
  };
}

describe('DemoMediaConfigController', () => {
  const existing = {
    id: 1,
    demo: 'demo1',
    imgs: '[{"id":1}]',
    sizes: '[{"width":100}]',
    blacklist: '["blocked.png"]',
  };

  it('更新时未提交的字段保持不变', async () => {
    const { controller, configService } = createController(
      { demo: 'demo1', imgs: [{ id: 2 }] },
      existing,
    );

    const result = await controller.save();

    expect(result.code).toBe(0);
    expect(configService.save).toHaveBeenCalledWith({
      demo: 'demo1',
      imgs: [{ id: 2 }],
    });
  });

  it('显式提交空数组时允许清空字段', async () => {
    const { controller, configService } = createController(
      { demo: 'demo1', sizes: [] },
      existing,
    );

    await controller.save();

    expect(configService.save).toHaveBeenCalledWith({
      demo: 'demo1',
      sizes: [],
    });
  });

  it('显式提交非法数组字段时返回 422 且不保存', async () => {
    const { controller, configService } = createController(
      { demo: 'demo1', blacklist: 'not-json' },
      existing,
    );

    const result = await controller.save();

    expect(result.code).toBe(422);
    expect(configService.save).not.toHaveBeenCalled();
  });

  it('首次创建时将未提交的字段初始化为空数组', async () => {
    const { controller, configService } = createController(
      { demo: 'demo2', imgs: [{ id: 1 }] },
      null,
    );

    await controller.save();

    expect(configService.save).toHaveBeenCalledWith({
      demo: 'demo2',
      imgs: [{ id: 1 }],
      sizes: [],
      blacklist: [],
    });
  });
});
