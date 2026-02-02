import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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

  describe('/connection-test', () => {
    describe('GET /connection-test/common - Authorization header validation', () => {
      it('should return 200 with valid Bearer token', () => {
        return request(app.getHttpServer())
          .get('/connection-test/common')
          .set('Authorization', 'Bearer valid-token-123')
          .expect(200)
          .expect((res) => {
            expect(res.text).toContain('hej värden');
            expect(res.text).toContain('Bearer valid-token-123');
          });
      });

      it('should return 200 with JWT token format', () => {
        return request(app.getHttpServer())
          .get('/connection-test/common')
          .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0')
          .expect(200)
          .expect((res) => {
            expect(res.text).toContain('hej värden');
            expect(res.text).toContain('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
          });
      });

      it('should return 200 without authorization header', () => {
        return request(app.getHttpServer())
          .get('/connection-test/common')
          .expect(200)
          .expect((res) => {
            expect(res.text).toContain('hej värden');
          });
      });

      it('should return 200 with empty authorization header', () => {
        return request(app.getHttpServer())
          .get('/connection-test/common')
          .set('Authorization', '')
          .expect(200)
          .expect((res) => {
            expect(res.text).toContain('hej värden');
          });
      });

      it('should return 200 with Basic auth header', () => {
        return request(app.getHttpServer())
          .get('/connection-test/common')
          .set('Authorization', 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=')
          .expect(200)
          .expect((res) => {
            expect(res.text).toContain('hej värden');
            expect(res.text).toContain('Basic dXNlcm5hbWU6cGFzc3dvcmQ=');
          });
      });
    });

    describe('POST /connection-test/common', () => {
      it('should return 201 with request body', () => {
        const testBody = { name: 'test', value: 123 };
        return request(app.getHttpServer())
          .post('/connection-test/common')
          .send(testBody)
          .expect(201)
          .expect((res) => {
            expect(res.text).toContain('hej värden');
            expect(res.text).toContain(JSON.stringify(testBody));
          });
      });

      it('should return 201 with empty body', () => {
        return request(app.getHttpServer())
          .post('/connection-test/common')
          .send({})
          .expect(201)
          .expect((res) => {
            expect(res.text).toContain('hej värden');
            expect(res.text).toContain('{}');
          });
      });
    });

    describe('GET /connection-test/error', () => {
      it('should return exactly 500 status code', () => {
        return request(app.getHttpServer())
          .get('/connection-test/error')
          .expect(500);
      });

      it('should return 500 regardless of authorization header', () => {
        return request(app.getHttpServer())
          .get('/connection-test/error')
          .set('Authorization', 'Bearer valid-token')
          .expect(500);
      });
    });

    describe('GET /connection-test/unauthorized - 401 Unauthorized error validation', () => {
      it('should return exactly 401 status code', () => {
        return request(app.getHttpServer())
          .get('/connection-test/unauthorized')
          .expect(401);
      });

      it('should return 401 even with valid authorization header', () => {
        return request(app.getHttpServer())
          .get('/connection-test/unauthorized')
          .set('Authorization', 'Bearer valid-token')
          .expect(401);
      });

      it('should return 401 even without authorization header', () => {
        return request(app.getHttpServer())
          .get('/connection-test/unauthorized')
          .expect(401);
      });

      it('should return correct error message in response', () => {
        return request(app.getHttpServer())
          .get('/connection-test/unauthorized')
          .expect(401)
          .expect((res) => {
            expect(res.body).toHaveProperty('message', 'test');
            expect(res.body.statusCode).toBe(401);
          });
      });

      it('should always return 401 status code consistently', async () => {
        // Should always return 401 even with multiple requests
        for (let i = 0; i < 3; i++) {
          await request(app.getHttpServer())
            .get('/connection-test/unauthorized')
            .expect(401);
        }
      });
    });
  });
});
