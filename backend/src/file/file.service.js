import { Injectable, Dependencies } from '@nestjs/common';

@Injectable()
@Dependencies('DB_POOL')
export class FileService {
  constructor(dbPool) {
    this.dbPool = dbPool;
  }

  async createFile({ siteId, pageId, fileUrl, createdBy, meta }) {
    const metaValue = meta ? JSON.stringify(meta) : null;
    const [result] = await this.dbPool.query(
      'INSERT INTO files (site_id, elementor_id, file_url, meta, created_by) VALUES (?, ?, ?, ?, ?)',
      [siteId, pageId || '', fileUrl, metaValue, createdBy],
    );
    return result.insertId;
  }

  async listFiles({ siteId, pageId, componentId, page, pageSize }) {
    const params = [siteId];
    let whereSql = 'WHERE is_deleted = 0 AND site_id = ?';

    if (pageId) {
      whereSql += ' AND elementor_id = ?';
      params.push(pageId);
    }

    if (componentId) {
      whereSql += " AND JSON_UNQUOTE(JSON_EXTRACT(meta, '$.component_id')) = ?";
      params.push(componentId);
    }

    const countSql = `SELECT COUNT(*) AS total FROM files ${whereSql}`;
    const [countRows] = await this.dbPool.query(countSql, params);
    const total = countRows[0] ? Number(countRows[0].total) : 0;

    const offset = (page - 1) * pageSize;
    const listSql = `
      SELECT id, site_id, elementor_id, file_url, meta, created_by, created_at
      FROM files
      ${whereSql}
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await this.dbPool.query(listSql, [
      ...params,
      pageSize,
      offset,
    ]);

    return { total, list: rows };
  }
}
