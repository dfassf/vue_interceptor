import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConnectionTestController } from './connection-test.controller';
import { ConnectionTestService } from '../services/connection-test.service';

describe('ConnectionTestController', () => {
  let controller: ConnectionTestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConnectionTestController],
      providers: [ConnectionTestService],
    }).compile();

    controller = module.get<ConnectionTestController>(ConnectionTestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /connection-test/common - Authorization header validation', () => {
    it('should return 200 with valid Bearer token', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-token-123',
        },
      } as any;

      const result = await controller.connectionTest(mockRequest);
      expect(result).toContain('hej värden');
      expect(result).toContain('Bearer valid-token-123');
    });

    it('should return 200 with different Bearer token format', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        },
      } as any;

      const result = await controller.connectionTest(mockRequest);
      expect(result).toContain('hej värden');
      expect(result).toContain('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    });

    it('should return 200 without authorization header', async () => {
      const mockRequest = {
        headers: {},
      } as any;

      const result = await controller.connectionTest(mockRequest);
      expect(result).toContain('hej värden');
      expect(result).toContain('undefined');
    });

    it('should return 200 with empty authorization header', async () => {
      const mockRequest = {
        headers: {
          authorization: '',
        },
      } as any;

      const result = await controller.connectionTest(mockRequest);
      expect(result).toContain('hej värden');
      expect(result).toContain('');
    });

    it('should return 200 with non-Bearer authorization', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=',
        },
      } as any;

      const result = await controller.connectionTest(mockRequest);
      expect(result).toContain('hej värden');
      expect(result).toContain('Basic dXNlcm5hbWU6cGFzc3dvcmQ=');
    });
  });

  describe('POST /connection-test/common', () => {
    it('should return request body', async () => {
      const mockRequest = {
        headers: {},
      } as any;
      const mockBody = { name: 'test', value: 123 };

      const result = await controller.connectionTestPost(mockRequest, mockBody);
      expect(result).toContain('hej värden');
      expect(result).toContain(JSON.stringify(mockBody));
    });
  });

  describe('GET /connection-test/error', () => {
    it('should throw 500 error', async () => {
      await expect(controller.onerrorTest()).rejects.toThrow(HttpException);
      try {
        await controller.onerrorTest();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      }
    });
  });

  describe('GET /connection-test/unauthorized - 401 Unauthorized error validation', () => {
    it('should throw HttpException with 401 status code', async () => {
      await expect(controller.unauthorizedTest()).rejects.toThrow(HttpException);
    });

    it('should return exactly 401 status code', async () => {
      try {
        await controller.unauthorizedTest();
        fail('should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
        expect(error.getStatus()).toBe(401);
      }
    });

    it('should return correct error message', async () => {
      try {
        await controller.unauthorizedTest();
        fail('should have thrown HttpException');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.message).toBe('test');
        expect(error.getResponse()).toBe('test');
      }
    });

    it('should always return 401 regardless of request', async () => {
      // Should return 401 even with authorization header
      try {
        await controller.unauthorizedTest();
        fail('should have thrown HttpException');
      } catch (error) {
        expect(error.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      }
    });
  });
});
