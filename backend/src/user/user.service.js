import { Injectable, Dependencies } from '@nestjs/common';
import bcrypt from 'bcrypt';

@Injectable()
@Dependencies('DB_POOL')
export class UserService {
  constructor(dbPool) {
    this.dbPool = dbPool;
  }

  async findById(id) {
    const [rows] = await this.dbPool.query(
      'SELECT id, username, role, is_deleted, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    return rows[0] || null;
  }

  async findByUsername(username) {
    const [rows] = await this.dbPool.query(
      'SELECT id, username, role, is_deleted FROM users WHERE username = ? LIMIT 1',
      [username],
    );
    return rows[0] || null;
  }

  async listUsers(filters = {}) {
    const conditions = ['is_deleted = 0'];
    const values = [];

    if (filters.id) {
      conditions.push('id = ?');
      values.push(filters.id);
    }
    if (filters.username) {
      conditions.push('username = ?');
      values.push(filters.username);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await this.dbPool.query(
      `SELECT id, username, role, is_deleted, created_at, updated_at FROM users ${where} ORDER BY id DESC`,
      values,
    );
    return rows;
  }

  async listDeletedUsers() {
    const [rows] = await this.dbPool.query(
      'SELECT id, username, role, is_deleted, created_at, updated_at FROM users WHERE is_deleted = 1 ORDER BY id DESC',
    );
    return rows;
  }

  async attachSiteRelations(users) {
    if (!Array.isArray(users) || users.length === 0) {
      return [];
    }

    const userIds = users
      .map((user) => Number(user.id))
      .filter((id) => Number.isFinite(id) && id > 0);
    if (!userIds.length) {
      return users.map((user) => ({ ...user, site_ids: [], sites: [] }));
    }

    const placeholders = userIds.map(() => '?').join(',');
    const [rows] = await this.dbPool.query(
      `SELECT us.user_id, s.site_id, s.site_name
       FROM user_sites us
       INNER JOIN sites s ON s.site_id = us.site_id AND s.is_deleted = 0
       WHERE us.user_id IN (${placeholders})
       ORDER BY us.user_id ASC, s.site_id ASC`,
      userIds,
    );

    const map = new Map();
    rows.forEach((row) => {
      const key = Number(row.user_id);
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push({
        site_id: row.site_id,
        site_name: row.site_name,
      });
    });

    const [permissionRows] = await this.dbPool.query(
      `SELECT user_id, site_id, page_id, allow
       FROM user_site_pages
       WHERE user_id IN (${placeholders})
       ORDER BY user_id ASC, site_id ASC, page_id ASC`,
      userIds,
    );
    const permissionMap = new Map();
    permissionRows.forEach((row) => {
      const userId = Number(row.user_id);
      if (!permissionMap.has(userId)) {
        permissionMap.set(userId, new Map());
      }
      const siteMap = permissionMap.get(userId);
      const siteId = String(row.site_id);
      if (!siteMap.has(siteId)) {
        siteMap.set(siteId, { site_id: siteId, page_ids: [], rules: [] });
      }
      const item = siteMap.get(siteId);
      const pageId = Number(row.page_id);
      const allow = Number(row.allow) === 1;
      item.rules.push({ page_id: pageId, allow });
      if (allow) {
        item.page_ids.push(pageId);
      }
    });

    return users.map((user) => {
      const sites = map.get(Number(user.id)) || [];
      const siteIdSet = new Set(sites.map((site) => site.site_id));
      const userPermissionSites =
        permissionMap.get(Number(user.id)) || new Map();
      const sitePageRules = Array.from(userPermissionSites.values())
        .filter((item) => siteIdSet.has(item.site_id))
        .map((item) => ({ site_id: item.site_id, rules: item.rules }));
      const sitePageIds = Array.from(userPermissionSites.values())
        .filter((item) => siteIdSet.has(item.site_id))
        .map((item) => ({ site_id: item.site_id, page_ids: item.page_ids }));
      return {
        ...user,
        site_ids: sites.map((site) => site.site_id),
        sites,
        site_page_ids: sitePageIds,
        site_page_rules: sitePageRules,
      };
    });
  }

  async createUser({ username, password, role = 'user', siteIds = [] }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const connection = await this.dbPool.getConnection();

    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
        [username, passwordHash, role],
      );
      const userId = result.insertId;

      if (siteIds.length > 0) {
        const values = siteIds.map((siteId) => [userId, siteId]);
        await connection.query(
          'INSERT INTO user_sites (user_id, site_id) VALUES ?',
          [values],
        );
      }

      await connection.commit();
      return userId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async updateUserAdmin(userId, payload) {
    const { username, role, password, siteIds } = payload;
    const connection = await this.dbPool.getConnection();

    try {
      await connection.beginTransaction();
      if (username || role || password) {
        const updates = [];
        const values = [];

        if (username) {
          updates.push('username = ?');
          values.push(username);
        }
        if (role) {
          updates.push('role = ?');
          values.push(role);
        }
        if (password) {
          const passwordHash = await bcrypt.hash(password, 10);
          updates.push('password_hash = ?');
          values.push(passwordHash);
        }

        values.push(userId);
        await connection.query(
          `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
          values,
        );
      }

      if (siteIds) {
        await connection.query('DELETE FROM user_sites WHERE user_id = ?', [
          userId,
        ]);
        if (siteIds.length > 0) {
          const values = siteIds.map((siteId) => [userId, siteId]);
          await connection.query(
            'INSERT INTO user_sites (user_id, site_id) VALUES ?',
            [values],
          );
          const placeholders = siteIds.map(() => '?').join(',');
          await connection.query(
            `DELETE FROM user_site_pages WHERE user_id = ? AND site_id NOT IN (${placeholders})`,
            [userId, ...siteIds],
          );
        } else {
          await connection.query(
            'DELETE FROM user_site_pages WHERE user_id = ?',
            [userId],
          );
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async revokeUserSites(userId, siteIds) {
    if (!Array.isArray(siteIds) || siteIds.length === 0) {
      return 0;
    }

    const normalizedSiteIds = [
      ...new Set(
        siteIds.map((siteId) => String(siteId).trim()).filter(Boolean),
      ),
    ];
    if (!normalizedSiteIds.length) {
      return 0;
    }

    const placeholders = normalizedSiteIds.map(() => '?').join(',');
    const [result] = await this.dbPool.query(
      `DELETE FROM user_sites WHERE user_id = ? AND site_id IN (${placeholders})`,
      [userId, ...normalizedSiteIds],
    );
    await this.dbPool.query(
      `DELETE FROM user_site_pages WHERE user_id = ? AND site_id IN (${placeholders})`,
      [userId, ...normalizedSiteIds],
    );
    return result.affectedRows || 0;
  }

  normalizeSiteIds(siteIds) {
    if (!Array.isArray(siteIds)) {
      return [];
    }
    return [
      ...new Set(
        siteIds.map((siteId) => String(siteId).trim()).filter(Boolean),
      ),
    ];
  }

  async listExistingSiteIds(siteIds) {
    const normalizedSiteIds = this.normalizeSiteIds(siteIds);
    if (!normalizedSiteIds.length) {
      return [];
    }

    const placeholders = normalizedSiteIds.map(() => '?').join(',');
    const [rows] = await this.dbPool.query(
      `SELECT site_id
       FROM sites
       WHERE site_id IN (${placeholders}) AND is_deleted = 0`,
      normalizedSiteIds,
    );
    return rows.map((row) => row.site_id);
  }

  async listUserSiteIds(userId) {
    const [rows] = await this.dbPool.query(
      `SELECT us.site_id
       FROM user_sites us
       INNER JOIN sites s ON s.site_id = us.site_id AND s.is_deleted = 0
       WHERE us.user_id = ?
       ORDER BY us.site_id ASC`,
      [userId],
    );
    return rows.map((row) => row.site_id);
  }

  async updateUserSelf(userId, payload) {
    const { username } = payload;
    if (!username) {
      return false;
    }
    await this.dbPool.query(
      'UPDATE users SET username = ?, updated_at = NOW() WHERE id = ?',
      [username, userId],
    );
    return true;
  }

  async softDeleteUser(userId) {
    await this.dbPool.query(
      'UPDATE users SET is_deleted = 1, updated_at = NOW() WHERE id = ?',
      [userId],
    );
  }

  async restoreUser(userId) {
    await this.dbPool.query(
      'UPDATE users SET is_deleted = 0, updated_at = NOW() WHERE id = ?',
      [userId],
    );
  }

  async listUserSitePagePermissions(userId, siteId) {
    const [rows] = await this.dbPool.query(
      `SELECT page_id, allow
       FROM user_site_pages
       WHERE user_id = ? AND site_id = ?
       ORDER BY page_id ASC`,
      [userId, siteId],
    );
    return rows.map((row) => ({
      page_id: Number(row.page_id),
      allow: Number(row.allow) === 1,
    }));
  }

  async setUserSitePagePermission(userId, siteId, pageId, allow) {
    await this.dbPool.query(
      `INSERT INTO user_site_pages (user_id, site_id, page_id, allow)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE allow = VALUES(allow), updated_at = NOW()`,
      [userId, siteId, pageId, allow ? 1 : 0],
    );
  }

  async clearUserSitePagePermissions(userId, siteId, pageIds = []) {
    if (!Array.isArray(pageIds) || pageIds.length === 0) {
      const [result] = await this.dbPool.query(
        'DELETE FROM user_site_pages WHERE user_id = ? AND site_id = ?',
        [userId, siteId],
      );
      return result.affectedRows || 0;
    }

    const normalized = this.normalizePageIds(pageIds);
    if (!normalized.length) {
      return 0;
    }
    const placeholders = normalized.map(() => '?').join(',');
    const [result] = await this.dbPool.query(
      `DELETE FROM user_site_pages WHERE user_id = ? AND site_id = ? AND page_id IN (${placeholders})`,
      [userId, siteId, ...normalized],
    );
    return result.affectedRows || 0;
  }

  normalizePageIds(pageIds) {
    if (!Array.isArray(pageIds)) {
      return [];
    }
    return [
      ...new Set(
        pageIds
          .map((pageId) => Number(pageId))
          .filter((pageId) => Number.isFinite(pageId) && pageId > 0),
      ),
    ];
  }
}
