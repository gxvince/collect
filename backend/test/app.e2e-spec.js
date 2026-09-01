import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health/view (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/view')
      .expect(200)
      .expect('Content-Type', /text\/html; charset=utf-8/);

    expect(response.text).toContain('id="health-status"');
    expect(response.text).toContain('id="login-form"');
    expect(response.text).toContain('id="request-form"');
    expect(response.text.split('\n').length).toBeLessThanOrEqual(250);
  });
});
