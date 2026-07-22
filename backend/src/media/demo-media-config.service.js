import { Injectable, Dependencies } from '@nestjs/common';

@Injectable()
@Dependencies('DB_POOL')
export class DemoMediaConfigService {
  constructor(dbPool) {
    this.dbPool = dbPool;
  }

  buildListWhere({ demo }) {
    const clauses = [];
    const params = [];

    if (demo) {
      clauses.push('demo LIKE ?');
      params.push(`%${demo}%`);
    }

    return {
      whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
      params,
    };
  }

  async findByDemo(demo) {
    const [rows] = await this.dbPool.query(
      'SELECT id, demo, imgs, sizes, blacklist, created_at, updated_at FROM demo_media_config WHERE demo = ? LIMIT 1',
      [demo],
    );
    return rows[0] || null;
  }

  async save({ demo, imgs, sizes, blacklist }) {
    const existing = await this.findByDemo(demo);

    if (existing) {
      const updates = [];
      const params = [];
      for (const [field, value] of Object.entries({
        imgs,
        sizes,
        blacklist,
      })) {
        if (value !== undefined) {
          updates.push(`${field} = ?`);
          params.push(JSON.stringify(value));
        }
      }
      if (updates.length) {
        await this.dbPool.query(
          `UPDATE demo_media_config SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE demo = ?`,
          params.concat(demo),
        );
      }
    } else {
      await this.dbPool.query(
        'INSERT INTO demo_media_config (demo, imgs, sizes, blacklist) VALUES (?, ?, ?, ?)',
        [
          demo,
          JSON.stringify(imgs || []),
          JSON.stringify(sizes || []),
          JSON.stringify(blacklist || []),
        ],
      );
    }
    return this.findByDemo(demo);
  }

  async deleteByDemo(demo) {
    const [result] = await this.dbPool.query(
      'DELETE FROM demo_media_config WHERE demo = ?',
      [demo],
    );
    return result.affectedRows > 0;
  }

  async list({ demo, page, pageSize }) {
    const { whereSql, params } = this.buildListWhere({ demo });
    const offset = (page - 1) * pageSize;
    const [countRows] = await this.dbPool.query(
      `SELECT COUNT(*) AS total FROM demo_media_config ${whereSql}`,
      params,
    );
    const [rows] = await this.dbPool.query(
      `SELECT id, demo, imgs, sizes, blacklist, created_at, updated_at
       FROM demo_media_config
       ${whereSql}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      params.concat([pageSize, offset]),
    );
    return {
      list: rows,
      total: Number((countRows[0] && countRows[0].total) || 0),
    };
  }
}
