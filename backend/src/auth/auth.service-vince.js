import { Injectable, Dependencies } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { createHash } from 'crypto';

@Injectable()
@Dependencies(JwtService, ConfigService, 'DB_POOL')
export class AuthService {
  constructor(jwtService, configService, dbPool) {
    this.jwtService = jwtService;
    this.configService = configService;
    this.dbPool = dbPool;
  }

  async findUserByUsername(username) {
    const [rows] = await this.dbPool.query(
      'SELECT id, username, password_hash, role, is_deleted FROM users WHERE username = ? LIMIT 1',
      [username],
    );
    return rows[0] || null;
  }

  async findUserById(userId) {
    const [rows] = await this.dbPool.query(
      'SELECT id, username, role, is_deleted FROM users WHERE id = ? LIMIT 1',
      [userId],
    );
    return rows[0] || null;
  }

  async getUserSiteIds(user) {
    if (user.role === 'admin') {
      const [rows] = await this.dbPool.query(
        'SELECT site_id FROM sites WHERE is_deleted = 0 ORDER BY site_id ASC',
      );
      return rows.map((row) => row.site_id);
    }

    const [rows] = await this.dbPool.query(
      'SELECT us.site_id FROM user_sites us INNER JOIN sites s ON s.site_id = us.site_id AND s.is_deleted = 0 WHERE us.user_id = ? ORDER BY us.site_id ASC',
      [user.id],
    );
    return rows.map((row) => row.site_id);
  }

  async getUserSites(user) {
    if (user.role === 'admin') {
      const [rows] = await this.dbPool.query(
        'SELECT site_id, site_name, site_status, demo_site, wp_base_url FROM sites WHERE is_deleted = 0 ORDER BY site_id ASC',
      );
      return rows;
    }

    const [rows] = await this.dbPool.query(
      `SELECT s.site_id, s.site_name, s.site_status, s.demo_site, s.wp_base_url
       FROM user_sites us
       INNER JOIN sites s ON s.site_id = us.site_id AND s.is_deleted = 0
       WHERE us.user_id = ?
       ORDER BY us.site_id ASC`,
      [user.id],
    );
    return rows;
  }

  async hasUserSitePageRules(userId, siteId) {
    const [rows] = await this.dbPool.query(
      'SELECT id FROM user_site_pages WHERE user_id = ? AND site_id = ? LIMIT 1',
      [userId, siteId],
    );
    return !!rows[0];
  }

  async canUserAccessPage(user, siteId, pageId) {
    if (!Number.isFinite(pageId) || pageId <= 0) {
      return false;
    }
    if (user.role === 'admin') {
      return true;
    }

    const hasRules = await this.hasUserSitePageRules(user.id, siteId);
    if (!hasRules) {
      return true;
    }

    const [rows] = await this.dbPool.query(
      `SELECT allow
       FROM user_site_pages
       WHERE user_id = ? AND site_id = ? AND page_id = ?
       LIMIT 1`,
      [user.id, siteId, pageId],
    );
    if (!rows[0]) {
      return false;
    }
    return Number(rows[0].allow) === 1;
  }

  async getUserPagePermissionScope(user, siteId) {
    if (user.role === 'admin') {
      return {
        restricted: false,
        allowedPageIds: [],
        rules: [],
      };
    }

    const hasRules = await this.hasUserSitePageRules(user.id, siteId);
    if (!hasRules) {
      return {
        restricted: false,
        allowedPageIds: [],
        rules: [],
      };
    }

    const [rows] = await this.dbPool.query(
      `SELECT page_id, allow
       FROM user_site_pages
       WHERE user_id = ? AND site_id = ?
       ORDER BY page_id ASC`,
      [user.id, siteId],
    );
    const rules = rows.map((row) => ({
      page_id: Number(row.page_id),
      allow: Number(row.allow) === 1,
    }));
    const allowedPageIds = rules
      .filter((item) => item.allow)
      .map((item) => item.page_id);

    return {
      restricted: true,
      allowedPageIds,
      rules,
    };
  }

  async getUserSitePagePermissions(user) {
    if (user.role === 'admin') {
      return { site_page_ids: [], site_page_rules: [] };
    }

    const [rows] = await this.dbPool.query(
      `SELECT usp.site_id, usp.page_id, usp.allow
       FROM user_site_pages usp
       INNER JOIN user_sites us ON us.user_id = usp.user_id AND us.site_id = usp.site_id
       INNER JOIN sites s ON s.site_id = usp.site_id AND s.is_deleted = 0
       WHERE usp.user_id = ?
       ORDER BY usp.site_id ASC, usp.page_id ASC`,
      [user.id],
    );

    const bySite = new Map();
    rows.forEach((row) => {
      const siteId = String(row.site_id);
      if (!bySite.has(siteId)) {
        bySite.set(siteId, { site_id: siteId, page_ids: [], rules: [] });
      }
      const item = bySite.get(siteId);
      const pageId = Number(row.page_id);
      const allow = Number(row.allow) === 1;
      item.rules.push({ page_id: pageId, allow });
      if (allow) {
        item.page_ids.push(pageId);
      }
    });

    const sitePageRules = Array.from(bySite.values()).map((item) => ({
      site_id: item.site_id,
      rules: item.rules,
    }));
    const sitePageIds = Array.from(bySite.values()).map((item) => ({
      site_id: item.site_id,
      page_ids: item.page_ids,
    }));

    return {
      site_page_ids: sitePageIds,
      site_page_rules: sitePageRules,
    };
  }

  async validateUser(username, password) {
    const user = await this.findUserByUsername(username);
    if (!user || user.is_deleted) {
      return null;
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return null;
    }

    return user;
  }

  signAccessToken(user) {
    return this.jwtService.sign({
      user_id: user.id,
      role: user.role,
    });
  }

  signRefreshToken(user) {
    const refreshExpiresIn = this.configService.get('JWT_REFRESH_EXPIRES_IN');
    return this.jwtService.sign(
      {
        user_id: user.id,
        role: user.role,
        token_type: 'refresh',
      },
      { expiresIn: refreshExpiresIn },
    );
  }

  hashToken(token) {
    return createHash('sha256').update(token).digest('hex');
  }

  async storeRefreshToken(userId, refreshToken) {
    const tokenHash = this.hashToken(refreshToken);
    const decoded = this.jwtService.decode(refreshToken);
    const expiresAt =
      decoded && decoded.exp ? new Date(decoded.exp * 1000) : null;

    if (!expiresAt) {
      throw new Error('refresh token 无法解析过期时间');
    }

    await this.dbPool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt],
    );
  }

  async isRefreshTokenActive(refreshToken) {
    const tokenHash = this.hashToken(refreshToken);
    const [rows] = await this.dbPool.query(
      'SELECT id FROM refresh_tokens WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > NOW() LIMIT 1',
      [tokenHash],
    );
    return !!rows[0];
  }

  async revokeRefreshToken(refreshToken) {
    const tokenHash = this.hashToken(refreshToken);
    await this.dbPool.query(
      'UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL',
      [tokenHash],
    );
  }

  async updatePassword(userId, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.dbPool.query(
      'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, userId],
    );
  }

  async verifyAccessToken(token) {
    return this.jwtService.verifyAsync(token);
  }

  async verifyRefreshToken(token) {
    return this.jwtService.verifyAsync(token);
  }
}
