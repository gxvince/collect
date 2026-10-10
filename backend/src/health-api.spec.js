import fs from 'fs';
import path from 'path';
import vm from 'vm';
import 'reflect-metadata';
import { RequestMethod } from '@nestjs/common';
import {
  MODULE_METADATA,
  PATH_METADATA,
  METHOD_METADATA,
} from '@nestjs/common/constants';
import { AppController } from './app.controller';

// 仅加载模块定义，不初始化数据库或读取运行配置。
function activeRoutes() {
  const controllers = new Set([AppController]);
  const seen = new Set();
  function visit(module) {
    if (!module || seen.has(module)) return;
    seen.add(module);
    (Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, module) || []).forEach(
      (c) => controllers.add(c),
    );
    (Reflect.getMetadata(MODULE_METADATA.IMPORTS, module) || []).forEach(visit);
  }
  const root = fs.readFileSync(path.join(__dirname, 'app.module.js'), 'utf8');
  for (const match of root.matchAll(/from ['"](\.\/[^'"]+\.module)['"]/g)) {
    Object.values(require(match[1])).forEach(visit);
  }
  return [...controllers]
    .flatMap((c) =>
      Object.getOwnPropertyNames(c.prototype).flatMap((name) => {
        const fn = c.prototype[name];
        const method = Reflect.getMetadata(METHOD_METADATA, fn);
        if (method === undefined) return [];
        const route =
          '/' +
          [
            Reflect.getMetadata(PATH_METADATA, c),
            Reflect.getMetadata(PATH_METADATA, fn),
          ]
            .filter(Boolean)
            .join('/')
            .split('/')
            .filter(Boolean)
            .join('/');
        return `${RequestMethod[method]} ${route}`;
      }),
    )
    .sort();
}
function catalog() {
  expect(fs.existsSync(path.join(__dirname, 'health-api-catalog.js'))).toBe(
    true,
  );
  return require('./health-api-catalog').apiCatalog;
}
it('接口目录完整覆盖真实路由且没有重复或失效项', () => {
  expect(
    catalog()
      .map((e) => `${e.method} ${e.path}`)
      .sort(),
  ).toEqual(activeRoutes());
});
it('每个接口都有说明、权限与可编辑示例', () => {
  for (const e of catalog()) {
    expect(e.title).toMatch(/[\u4e00-\u9fff]/);
    expect(e.description).toBeTruthy();
    expect(e.auth).toBeTruthy();
    expect(e.examples.length).toBeGreaterThan(0);
    for (const example of e.examples) {
      expect(['none', 'json', 'form']).toContain(example.bodyType);
      for (const key of e.path.match(/:[a-z_]+/g) || [])
        expect(example.params[key.slice(1)]).toBeDefined();
    }
  }
});
async function page() {
  const html = await new AppController({}, {}).getHealthView();
  const elements = new Map();
  function element() {
    return {
      value: '',
      textContent: '',
      className: '',
      children: [],
      files: [],
      handlers: {},
      append(...nodes) {
        this.children.push(...nodes);
      },
      replaceChildren(...nodes) {
        this.children = nodes;
      },
      addEventListener(type, fn) {
        this.handlers[type] = fn;
      },
      setAttribute() {},
      scrollIntoView() {},
      focus() {},
    };
  }
  for (const match of html.matchAll(/id="([^"]+)"/g))
    elements.set(match[1], element());
  const embedded = html.match(
    /<script id="api-catalog" type="application\/json">([\s\S]*?)<\/script>/,
  );
  if (embedded) elements.get('api-catalog').textContent = embedded[1];
  const fetch = jest.fn().mockResolvedValue({
    status: 200,
    text: async () => JSON.stringify({ code: 0, data: { checks: [] } }),
  });
  const context = vm.createContext({
    document: {
      getElementById: (id) => elements.get(id),
      createElement: element,
    },
    location: { origin: 'http://localhost' },
    URL,
    URLSearchParams,
    FormData,
    Blob,
    performance,
    fetch,
    AbortController,
    setTimeout,
    clearTimeout,
  });
  for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g))
    vm.runInContext(match[1], context);
  await Promise.resolve();
  return {
    elements,
    fetch,
    run: (code) => vm.runInContext(code, context),
    submit: () =>
      elements.get('request-form').handlers.submit({ preventDefault() {} }),
  };
}
it('载入不发送，路径和查询正确编码', async () => {
  const p = await page();
  const before = p.fetch.mock.calls.length;
  p.run(
    "loadExample(apiCatalog.findIndex(e => e.path === '/api/proxy/elementor_data/:id'), 0)",
  );
  expect(p.fetch).toHaveBeenCalledTimes(before);
  p.elements.get('path-params').value = '{"id":"12/34"}';
  p.elements.get('query').value = '{"site_id":"测试 & 站点"}';
  await p.submit();
  expect(p.fetch.mock.calls.at(-1)[0]).toBe(
    '/api/proxy/elementor_data/12%2F34?site_id=%E6%B5%8B%E8%AF%95+%26+%E7%AB%99%E7%82%B9',
  );
});
it.each(['/api/user/list', '/api/user/deleted'])(
  '%s 调试示例展示分页说明并发送编辑后的分页参数',
  async (route) => {
    const p = await page();
    p.run(`selectEndpoint(apiCatalog.findIndex(e => e.path === '${route}'))`);
    expect(JSON.parse(p.elements.get('query').value)).toEqual({
      username: '',
      page: 1,
      page_size: 20,
    });
    const description = p.elements.get('endpoint-description').textContent;
    expect(description).toContain('data: { list, total, page, page_size }');
    expect(description).toContain('code=422');
    p.elements.get('query').value = JSON.stringify({ page: 2, page_size: 50 });
    await p.submit();
    expect(p.fetch.mock.calls.at(-1)[0]).toBe(`${route}?page=2&page_size=50`);
  },
);
it('可编辑 JSON，登录后自动携带令牌并显示耗时', async () => {
  const p = await page();
  p.fetch.mockResolvedValueOnce({
    status: 200,
    text: async () =>
      JSON.stringify({ code: 0, data: { access_token: 'test-only-token' } }),
  });
  await p.elements.get('login-form').handlers.submit({ preventDefault() {} });
  p.run(
    "loadExample(apiCatalog.findIndex(e => e.path === '/api/proxy/site_title' && e.method === 'POST'), 0)",
  );
  p.elements.get('body').value = '{"site_id":"demo","title":"修改后的标题"}';
  await p.submit();
  const options = p.fetch.mock.calls.at(-1)[1];
  expect(options.headers.Authorization).toBe('Bearer test-only-token');
  expect(JSON.parse(options.body).title).toBe('修改后的标题');
  expect(
    JSON.parse(p.elements.get('response-output').textContent).duration_ms,
  ).toBeGreaterThanOrEqual(0);
});
it('上传使用 FormData，由浏览器生成 Content-Type', async () => {
  const p = await page();
  p.run(
    "loadExample(apiCatalog.findIndex(e => e.path === '/api/file/upload'), 0)",
  );
  p.elements.get('file').files = [new Blob(['image'])];
  await p.submit();
  const options = p.fetch.mock.calls.at(-1)[1];
  expect(options.body).toBeInstanceOf(FormData);
  expect(options.body.get('file')).toBeInstanceOf(Blob);
  expect(options.body.get('site_id')).toBeTruthy();
  expect(options.headers['Content-Type']).toBeUndefined();
});
it.each(['//evil.example/path', '/\\evil.example/path'])(
  '拒绝跨域路径 %s',
  async (value) => {
    const p = await page();
    p.run('loadExample(0, 0)');
    const before = p.fetch.mock.calls.length;
    p.elements.get('path').value = value;
    await p.submit();
    expect(p.fetch).toHaveBeenCalledTimes(before);
    expect(p.elements.get('response-output').textContent).toContain('仅支持');
  },
);
it('无效 JSON 或未填写的路径参数不发送请求', async () => {
  const p = await page();
  p.run(
    "loadExample(apiCatalog.findIndex(e => e.path === '/api/user/:id'), 0)",
  );
  const before = p.fetch.mock.calls.length;
  p.elements.get('path-params').value = '{}';
  await p.submit();
  expect(p.elements.get('response-output').textContent).toContain('id');
  p.elements.get('query').value = '{';
  await p.submit();
  expect(p.fetch).toHaveBeenCalledTimes(before);
});
it('翻译示例通过真实控制器参数校验', () => {
  const { TranslateController } = require('./translate/translate.controller');
  const body = catalog().find((e) => e.path === '/api/proxy/translate')
    .examples[0].body;
  const controller = new TranslateController({ body }, {}, {});
  expect(controller.validatePayload(controller.parsePayload())).toEqual({
    ok: true,
  });
});
it('SMTP 示例字段被插件实际接受', () => {
  const plugin = fs.readFileSync(
    path.join(__dirname, '../../custom-api-plugin.php'),
    'utf8',
  );
  const merge = plugin.slice(
    plugin.indexOf('function custom_db_api_merge_smtp_settings'),
    plugin.indexOf(
      '// SMTP',
      plugin.indexOf('function custom_db_api_merge_smtp_settings'),
    ),
  );
  const body = catalog().find((e) => e.path === '/api/proxy/smtp_config')
    .examples[0].body;
  for (const key of Object.keys(body).filter((key) => key !== 'site_id'))
    expect(merge).toContain(`$payload['${key}']`);
});
it('搜索和模块过滤能定位接口，点击载入且不发送', async () => {
  const p = await page();
  p.elements.get('api-search').value = 'product_short_description';
  p.elements.get('api-search').handlers.input();
  expect(p.elements.get('api-count').textContent).toMatch(/^显示 2 \/ /);
  const button = p.elements
    .get('endpoint-list')
    .children.find((e) => e.textContent.startsWith('GET '));
  const before = p.fetch.mock.calls.length;
  button.handlers.click();
  expect(p.elements.get('path').value).toBe(
    '/api/proxy/product_short_description',
  );
  expect(p.fetch).toHaveBeenCalledTimes(before);
  p.elements.get('api-group').value = '认证';
  p.elements.get('api-group').handlers.change();
  expect(p.elements.get('api-count').textContent).toMatch(/^显示 0 \/ /);
});
it('网络失败显示错误，解除按钮禁用；非 JSON 响应以文本显示', async () => {
  const p = await page();
  p.fetch.mockRejectedValueOnce(new Error('连接失败'));
  await p.submit();
  expect(p.elements.get('response-output').textContent).toContain('连接失败');
  expect(p.elements.get('send-request').disabled).toBe(false);
  p.fetch.mockResolvedValueOnce({
    status: 502,
    text: async () => '<html>upstream error</html>',
  });
  await p.submit();
  const output = JSON.parse(p.elements.get('response-output').textContent);
  expect(output.http_status).toBe(502);
  expect(output.body).toBe('<html>upstream error</html>');
});
it('响应敏感字段递归脱敏，HTML 注入不能结束目录脚本', async () => {
  const p = await page();
  expect(
    p.run(
      "redact({nested: {smtp_pass: 'test', api_key: 'test', token: 'test'}})",
    ),
  ).toEqual({
    nested: { smtp_pass: '[已隐藏]', api_key: '[已隐藏]', token: '[已隐藏]' },
  });
  const first = catalog()[0];
  const original = first.description;
  try {
    first.description = '</script><script>alert(1)</script>';
    const html = await new AppController({}, {}).getHealthView();
    expect(html).not.toContain('</script><script>alert(1)</script>');
    const data = JSON.parse(
      html.match(
        /<script id="api-catalog" type="application\/json">([\s\S]*?)<\/script>/,
      )[1],
    );
    expect(data[0].description).toBe(first.description);
  } finally {
    first.description = original;
  }
});
it('素材列表示例页大小被控制器原样接受', () => {
  const { MediaController } = require('./media/media.controller');
  const query = catalog().find((e) => e.path === '/api/media/get').examples[0]
    .query;
  const controller = new MediaController({}, {}, {});
  expect(controller.normalizePageSize(query.page_size)).toBe(query.page_size);
});
