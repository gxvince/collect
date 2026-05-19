import { Injectable, Dependencies } from '@nestjs/common';

@Injectable()
@Dependencies('DB_POOL')
export class SiteService {
  constructor(dbPool) {
    this.dbPool = dbPool;
  }

  normalizeUrl(url) {
    if (!url) {
      return '';
    }
    return String(url).trim().replace(/\/+$/, '');
  }

  normalizeKeyword(keyword) {
    if (!keyword) {
      return '';
    }
    return String(keyword).trim();
  }

  async findById(siteId) {
    const [rows] = await this.dbPool.query(
      'SELECT site_id, site_name, site_status, wp_base_url, wp_auth_type, wp_auth_token, demo_site, is_deleted FROM sites WHERE site_id = ? LIMIT 1',
      [siteId],
    );
    return rows[0] || null;
  }

  async findByUrl(siteUrl) {
    const [rows] = await this.dbPool.query(
      'SELECT site_id, site_name, site_status, wp_base_url, wp_auth_type, wp_auth_token, demo_site, is_deleted FROM sites WHERE wp_base_url = ? AND is_deleted = 0 LIMIT 1',
      [siteUrl],
    );
    return rows[0] || null;
  }

  async findByToken(pluginToken) {
    const [rows] = await this.dbPool.query(
      'SELECT site_id, site_name, site_status, wp_base_url, wp_auth_type, wp_auth_token, demo_site, is_deleted FROM sites WHERE wp_auth_token = ? AND is_deleted = 0 LIMIT 1',
      [pluginToken],
    );
    return rows[0] || null;
  }

  async createSite({
    siteId,
    siteName,
    siteStatus,
    siteUrl,
    authType,
    authToken,
    demoSite,
  }) {
    await this.dbPool.query(
      'INSERT INTO sites (site_id, site_name, site_status, wp_base_url, wp_auth_type, wp_auth_token, demo_site, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
      [
        siteId,
        siteName,
        siteStatus,
        siteUrl,
        authType,
        authToken,
        demoSite || null,
      ],
    );
  }

  async updateSiteToken({ siteId, authType, authToken }) {
    await this.dbPool.query(
      'UPDATE sites SET wp_auth_type = ?, wp_auth_token = ?, updated_at = NOW() WHERE site_id = ?',
      [authType, authToken, siteId],
    );
  }

  async bindSiteUrl({ siteId, siteUrl }) {
    await this.dbPool.query(
      'UPDATE sites SET wp_base_url = ?, updated_at = NOW() WHERE site_id = ?',
      [siteUrl, siteId],
    );
  }

  async softDeleteSite(siteId) {
    await this.dbPool.query(
      'UPDATE sites SET is_deleted = 1, updated_at = NOW() WHERE site_id = ?',
      [siteId],
    );
  }

  buildListConditions(options) {
    const where = [];
    const params = [];

    if (!options.includeDeleted) {
      where.push('is_deleted = 0');
    }

    if (options.siteStatus === 0 || options.siteStatus === 1) {
      where.push('site_status = ?');
      params.push(options.siteStatus);
    }

    if (options.demoSite) {
      where.push('demo_site = ?');
      params.push(options.demoSite);
    }

    if (options.keyword) {
      where.push('(site_name LIKE ? OR wp_base_url LIKE ?)');
      const like = `%${options.keyword}%`;
      params.push(like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    return { whereSql, params };
  }

  async listSites(options = {}) {
    const keyword = this.normalizeKeyword(options.keyword);
    const demoSite = options.demoSite ? String(options.demoSite).trim() : '';
    const page = Math.max(1, Number(options.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(options.pageSize) || 10));
    const offset = (page - 1) * pageSize;
    const { whereSql, params } = this.buildListConditions({
      keyword,
      demoSite,
      siteStatus: options.siteStatus,
      includeDeleted: options.includeDeleted,
    });

    const [countRows] = await this.dbPool.query(
      `SELECT COUNT(*) AS total FROM sites ${whereSql}`,
      params,
    );
    const total = countRows[0]?.total ?? 0;

    const [rows] = await this.dbPool.query(
      `SELECT site_id, site_name, site_status, demo_site, wp_base_url, wp_auth_type, wp_auth_token, is_deleted, created_at, updated_at FROM sites ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, pageSize, offset],
    );
    return { total, list: rows, page, pageSize };
  }

  async listSitesByIds(siteIds, options = {}) {
    if (!siteIds.length) {
      return [];
    }

    const keyword = this.normalizeKeyword(options.keyword);
    const demoSite = options.demoSite ? String(options.demoSite).trim() : '';
    const placeholders = siteIds.map(() => '?').join(',');
    const { whereSql, params } = this.buildListConditions({
      keyword,
      demoSite,
      siteStatus: options.siteStatus,
      includeDeleted: false,
    });

    const andClause = whereSql ? ` AND ${whereSql.replace('WHERE ', '')}` : '';
    const [rows] = await this.dbPool.query(
      `SELECT site_id, site_name, site_status, demo_site, wp_base_url, wp_auth_type, is_deleted, created_at, updated_at FROM sites WHERE site_id IN (${placeholders})${andClause} ORDER BY created_at DESC`,
      [...siteIds, ...params],
    );
    return rows;
  }

  async attachUserRelations(sites) {
    if (!Array.isArray(sites) || sites.length === 0) {
      return [];
    }

    const siteIds = sites
      .map((site) => (site && site.site_id ? String(site.site_id) : ''))
      .filter(Boolean);
    if (!siteIds.length) {
      return sites.map((site) => ({ ...site, user_ids: [], users: [] }));
    }

    const placeholders = siteIds.map(() => '?').join(',');
    const [rows] = await this.dbPool.query(
      `SELECT us.site_id, u.id, u.username, u.role
       FROM user_sites us
       INNER JOIN users u ON u.id = us.user_id AND u.is_deleted = 0
       WHERE us.site_id IN (${placeholders})
       ORDER BY us.site_id ASC, u.id ASC`,
      siteIds,
    );

    const map = new Map();
    rows.forEach((row) => {
      const key = String(row.site_id);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push({
        id: row.id,
        username: row.username,
        role: row.role,
      });
    });

    return sites.map((site) => {
      const users = map.get(String(site.site_id)) || [];
      return {
        ...site,
        user_ids: users.map((user) => user.id),
        users,
      };
    });
  }

  async updateSite(siteId, fields) {
    const updates = [];
    const params = [];

    if (fields.siteName !== undefined) {
      updates.push('site_name = ?');
      params.push(fields.siteName);
    }
    if (fields.siteUrl !== undefined) {
      updates.push('wp_base_url = ?');
      params.push(fields.siteUrl);
    }
    if (fields.demoSite !== undefined) {
      updates.push('demo_site = ?');
      params.push(fields.demoSite || null);
    }
    if (fields.siteStatus !== undefined) {
      updates.push('site_status = ?');
      params.push(fields.siteStatus);
    }

    if (!updates.length) {
      return this.findById(siteId);
    }

    params.push(siteId);
    await this.dbPool.query(
      `UPDATE sites SET ${updates.join(', ')}, updated_at = NOW() WHERE site_id = ?`,
      params,
    );
    return this.findById(siteId);
  }

  async registerWithPlugin({ wpBaseUrl, pluginToken, systemUrl, demoSite }) {
    const registerKey = (process.env.WP_REGISTER_KEY || '').trim();
    if (!registerKey) {
      return { ok: false, message: '未配置 WP_REGISTER_KEY' };
    }

    const url = `${this.normalizeUrl(wpBaseUrl)}/wp-json/custom-db-api/v1/register`;
    const body = {
      plugin_token: pluginToken,
      system_url: systemUrl,
      demo_site: demoSite || '',
    };

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': registerKey,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const text = await res.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch (error) {
          return { ok: false, message: '插件返回非JSON响应', status: res.status };
        }
      }

      const ok = res.ok && data && data.code === 0;
      return {
        ok,
        status: res.status,
        data,
        message: data && data.message ? String(data.message) : '',
      };
    } catch (error) {
      if (error && error.name === 'AbortError') {
        return { ok: false, message: '注册请求超时' };
      }
      const code =
        (error && error.cause && error.cause.code) || (error && error.code) || '';
      if (code === 'ENOTFOUND') {
        return { ok: false, message: '目标站点域名解析失败' };
      }
      if (code === 'ECONNREFUSED') {
        return { ok: false, message: '目标站点拒绝连接' };
      }
      return {
        ok: false,
        message: error && error.message ? String(error.message) : '注册请求失败',
      };
    }
  }
}
