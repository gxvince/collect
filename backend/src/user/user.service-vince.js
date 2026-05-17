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

    return users.map((user) => {
      const sites = map.get(Number(user.id)) || [];
      return {
        ...user,
        site_ids: sites.map((site) => site.site_id),
        sites,
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
    return result.affectedRows || 0;
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
}
