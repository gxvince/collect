import { DemoMediaConfigService } from './demo-media-config.service';

describe('DemoMediaConfigService', () => {
  it('更新已有配置时只写入已提交字段', async () => {
    const existing = { id: 1, demo: 'demo1' };
    const dbPool = {
      query: jest
        .fn()
        .mockResolvedValueOnce([[existing]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([[{ ...existing, imgs: '[{"id":2}]' }]]),
    };
    const service = new DemoMediaConfigService(dbPool);

    await service.save({ demo: 'demo1', imgs: [{ id: 2 }] });

    expect(dbPool.query).toHaveBeenNthCalledWith(
      2,
      'UPDATE demo_media_config SET imgs = ?, updated_at = CURRENT_TIMESTAMP WHERE demo = ?',
      ['[{"id":2}]', 'demo1'],
    );
  });

  it('创建配置时将未提交字段初始化为空数组', async () => {
    const dbPool = {
      query: jest
        .fn()
        .mockResolvedValueOnce([[]])
        .mockResolvedValueOnce([{ affectedRows: 1 }])
        .mockResolvedValueOnce([
          [{ id: 2, demo: 'demo2', imgs: '[]', sizes: '[]', blacklist: '[]' }],
        ]),
    };
    const service = new DemoMediaConfigService(dbPool);

    await service.save({ demo: 'demo2', imgs: [{ id: 1 }] });

    expect(dbPool.query).toHaveBeenNthCalledWith(
      2,
      'INSERT INTO demo_media_config (demo, imgs, sizes, blacklist) VALUES (?, ?, ?, ?)',
      ['demo2', '[{"id":1}]', '[]', '[]'],
    );
  });
});
