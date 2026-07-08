import { Injectable, Dependencies } from '@nestjs/common';

@Injectable()
@Dependencies('DB_POOL')
export class MediaService {
  constructor(dbPool) {
    this.dbPool = dbPool;
  }

  buildListWhere({ demo, pageName }) {
    const clauses = [];
    const params = [];

    if (demo) {
      clauses.push('demo LIKE ?');
      params.push(`%${demo}%`);
    }
    if (pageName) {
      clauses.push('page LIKE ?');
      params.push(`%${pageName}%`);
    }

    return {
      whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
      params,
    };
  }

  async findById(id) {
    const [rows] = await this.dbPool.query(
      'SELECT id, demo, page, url, created_at, updated_at FROM demo_media_assets WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] || null;
  }

  async createMedia({ demo, page, url }) {
    const [result] = await this.dbPool.query(
      'INSERT INTO demo_media_assets (demo, page, url) VALUES (?, ?, ?)',
      [demo, page, url],
    );
    return this.findById(result.insertId);
  }

  async updateMedia(id, fields) {
    const updates = [];
    const params = [];

    if (fields.demo !== undefined) {
      updates.push('demo = ?');
      params.push(fields.demo);
    }
    if (fields.page !== undefined) {
      updates.push('page = ?');
      params.push(fields.page);
    }
    if (fields.url !== undefined) {
      updates.push('url = ?');
      params.push(fields.url);
    }

    if (!updates.length) {
      return this.findById(id);
    }

    params.push(id);
    await this.dbPool.query(
      `UPDATE demo_media_assets SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      params,
    );
    return this.findById(id);
  }

  async deleteMedia(id) {
    const [result] = await this.dbPool.query(
      'DELETE FROM demo_media_assets WHERE id = ?',
      [id],
    );
    return result.affectedRows > 0;
  }

  async listMedia({ demo, pageName, page, pageSize }) {
    const { whereSql, params } = this.buildListWhere({ demo, pageName });
    const offset = (page - 1) * pageSize;
    const [countRows] = await this.dbPool.query(
      `SELECT COUNT(*) AS total FROM demo_media_assets ${whereSql}`,
      params,
    );
    const [rows] = await this.dbPool.query(
      `SELECT id, demo, page, url, created_at, updated_at
       FROM demo_media_assets
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
