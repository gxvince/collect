import { Injectable, Dependencies } from '@nestjs/common';

@Injectable()
@Dependencies('DB_POOL')
export class PageConfigService {
  constructor(dbPool) {
    this.dbPool = dbPool;
  }

  async upsertMaterials({ siteId, pageId, materials }) {
    await this.dbPool.query(
      `INSERT INTO site_page_configs (site_id, page_id, materials_json, sizes_json)
       VALUES (?, ?, ?, NULL)
       ON DUPLICATE KEY UPDATE materials_json = VALUES(materials_json), updated_at = CURRENT_TIMESTAMP`,
      [siteId, pageId, JSON.stringify(materials || [])],
    );
  }

  async upsertSizes({ siteId, pageId, sizes }) {
    await this.dbPool.query(
      `INSERT INTO site_page_configs (site_id, page_id, materials_json, sizes_json)
       VALUES (?, ?, NULL, ?)
       ON DUPLICATE KEY UPDATE sizes_json = VALUES(sizes_json), updated_at = CURRENT_TIMESTAMP`,
      [siteId, pageId, JSON.stringify(sizes || [])],
    );
  }

  async findBySitePage(siteId, pageId) {
    const [rows] = await this.dbPool.query(
      `SELECT id, site_id, page_id, materials_json, sizes_json, created_at, updated_at
       FROM site_page_configs
       WHERE site_id = ? AND page_id = ?
       LIMIT 1`,
      [siteId, pageId],
    );
    return rows[0] || null;
  }
}
