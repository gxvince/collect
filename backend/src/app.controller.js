import { Controller, Dependencies, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';
import fs from 'fs';
import path from 'path';

@Controller()
@Dependencies(AppService, 'DB_POOL')
export class AppController {
  constructor(appService, dbPool) {
    this.appService = appService;
    this.dbPool = dbPool;
  }

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  async getHealth() {
    const checks = [{ name: 'app', ok: true, message: '应用可用' }];

    let dbOk = false;
    try {
      await this.dbPool.query('SELECT 1');
      dbOk = true;
      checks.push({
        name: 'db',
        ok: true,
        message: '数据库可用',
      });
    } catch (error) {
      checks.push({
        name: 'db',
        ok: false,
        message: '数据库不可用',
      });
    }

    if (dbOk) {
      try {
        const [dbRows] = await this.dbPool.query(
          'SELECT DATABASE() AS db_name',
        );
        const dbName = dbRows[0] && dbRows[0].db_name ? dbRows[0].db_name : '';
        checks.push({
          name: 'db.name',
          ok: !!dbName,
          message: dbName ? `当前库：${dbName}` : '未选择数据库',
        });

        const [rows] = await this.dbPool.query('SHOW TABLES');
        const tableSet = new Set(rows.map((row) => row[Object.keys(row)[0]]));

        checks.push({
          name: 'auth.refresh_tokens',
          ok: tableSet.has('refresh_tokens'),
          message: tableSet.has('refresh_tokens')
            ? 'refresh_tokens 表可用'
            : 'refresh_tokens 表缺失',
        });

        checks.push({
          name: 'user.users',
          ok: tableSet.has('users'),
          message: tableSet.has('users') ? 'users 表可用' : 'users 表缺失',
        });

        checks.push({
          name: 'user.user_sites',
          ok: tableSet.has('user_sites'),
          message: tableSet.has('user_sites')
            ? 'user_sites 表可用'
            : 'user_sites 表缺失',
        });

        checks.push({
          name: 'file.files',
          ok: tableSet.has('files'),
          message: tableSet.has('files') ? 'files 表可用' : 'files 表缺失',
        });

        checks.push({
          name: 'site.sites',
          ok: tableSet.has('sites'),
          message: tableSet.has('sites') ? 'sites 表可用' : 'sites 表缺失',
        });
      } catch (error) {
        checks.push({
          name: 'schema',
          ok: false,
          message: '无法读取数据表结构',
        });
      }
    } else {
      checks.push({
        name: 'auth.refresh_tokens',
        ok: false,
        message: '数据库不可用',
      });
      checks.push({
        name: 'user.users',
        ok: false,
        message: '数据库不可用',
      });
      checks.push({
        name: 'user.user_sites',
        ok: false,
        message: '数据库不可用',
      });
      checks.push({
        name: 'file.files',
        ok: false,
        message: '数据库不可用',
      });
      checks.push({
        name: 'site.sites',
        ok: false,
        message: '数据库不可用',
      });
    }

    const allOk = checks.every((item) => item.ok);
    return {
      code: allOk ? 0 : 500,
      data: { status: allOk ? 'ok' : 'degraded', checks },
      message: allOk ? '服务正常' : '服务异常',
    };
  }

  @Get('health/view')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  async getHealthView() {
    const templatePath = path.join(__dirname, 'health.view.html');
    const template = fs.readFileSync(templatePath, 'utf8');
    return template;
  }
}
