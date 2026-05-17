import { MediaService } from './media.service';

describe('MediaService', () => {
  it('分页查询全部素材时会先查总数再查列表', async () => {
    const dbPool = {
      query: jest
        .fn()
        .mockResolvedValueOnce([[{ total: 3 }]])
        .mockResolvedValueOnce([
          [
            { id: 3, demo: 'demo3', page: 'home', url: 'http://3.png' },
            { id: 2, demo: 'demo2', page: 'home', url: 'http://2.png' },
          ],
        ]),
    };
    const service = new MediaService(dbPool);

    const result = await service.listMedia({
      demo: '',
      pageName: '',
      page: 2,
      pageSize: 10,
    });

    expect(dbPool.query).toHaveBeenNthCalledWith(
      1,
      'SELECT COUNT(*) AS total FROM demo_media_assets ',
      [],
    );
    expect(dbPool.query).toHaveBeenNthCalledWith(
      2,
      `SELECT id, demo, page, url, created_at, updated_at
       FROM demo_media_assets
       
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [10, 10],
    );
    expect(result).toEqual({
      list: [
        { id: 3, demo: 'demo3', page: 'home', url: 'http://3.png' },
        { id: 2, demo: 'demo2', page: 'home', url: 'http://2.png' },
      ],
      total: 3,
    });
  });

  it('分页查询会按 demo 和 pageName 组合筛选', async () => {
    const dbPool = {
      query: jest
        .fn()
        .mockResolvedValueOnce([[{ total: 1 }]])
        .mockResolvedValueOnce([
          [{ id: 1, demo: 'demo1', page: 'landing', url: 'http://1.png' }],
        ]),
    };
    const service = new MediaService(dbPool);

    await service.listMedia({
      demo: 'demo1',
      pageName: 'landing',
      page: 1,
      pageSize: 50,
    });

    expect(dbPool.query).toHaveBeenNthCalledWith(
      1,
      'SELECT COUNT(*) AS total FROM demo_media_assets WHERE demo = ? AND page = ?',
      ['demo1', 'landing'],
    );
    expect(dbPool.query).toHaveBeenNthCalledWith(
      2,
      `SELECT id, demo, page, url, created_at, updated_at
       FROM demo_media_assets
       WHERE demo = ? AND page = ?
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      ['demo1', 'landing', 50, 0],
    );
  });
});
