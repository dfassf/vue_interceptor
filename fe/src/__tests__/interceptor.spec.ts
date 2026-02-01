import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    VITE_SERVER_URL: 'http://localhost:3000',
  },
});

describe('Interceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('토큰 헤더 설정', () => {
    it('accessToken이 있을 때 Authorization 헤더가 설정되어야 함', async () => {
      localStorageMock.setItem('accessToken', 'test-token-123');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      });

      const interceptor = (await import('../interceptor')).default;
      await interceptor.get('/api/test');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe('http://localhost:3000/api/test');
      expect((options.headers as Headers).get('Authorization')).toBe('Bearer test-token-123');
    });

    it('accessToken이 없을 때 Authorization 헤더가 설정되지 않아야 함', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ data: 'test' }),
      });

      const interceptor = (await import('../interceptor')).default;
      await interceptor.get('/api/test');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, options] = mockFetch.mock.calls[0];
      expect((options.headers as Headers).get('Authorization')).toBeNull();
    });
  });

  describe('HTTP 메서드', () => {
    it('POST 요청 시 body가 JSON으로 변환되어야 함', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ success: true }),
      });

      const interceptor = (await import('../interceptor')).default;
      await interceptor.post('/api/test', { name: 'test' });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, options] = mockFetch.mock.calls[0];
      expect(options.method).toBe('POST');
      expect(options.body).toBe(JSON.stringify({ name: 'test' }));
    });

    it('DELETE 요청 시 data가 있으면 body에 포함되어야 함', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ deleted: true }),
      });

      const interceptor = (await import('../interceptor')).default;
      await interceptor.delete('/api/test/1', { id: 1 });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, options] = mockFetch.mock.calls[0];
      expect(options.method).toBe('DELETE');
      expect(options.body).toBe(JSON.stringify({ id: 1 }));
    });
  });

  describe('에러 처리', () => {
    it('응답이 ok가 아닐 때 에러를 throw해야 함', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => ({ error: 'Bad Request' }),
      });

      const interceptor = (await import('../interceptor')).default;
      
      await expect(interceptor.get('/api/test')).rejects.toThrow('Fetch error');
    });
  });

  describe('응답 파싱', () => {
    it('JSON 응답을 올바르게 파싱해야 함', async () => {
      const responseData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: async () => responseData,
      });

      const interceptor = (await import('../interceptor')).default;
      const result = await interceptor.get('/api/test');

      expect(result).toEqual(responseData);
    });

    it('텍스트 응답을 올바르게 파싱해야 함', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        text: async () => 'Hello World',
      });

      const interceptor = (await import('../interceptor')).default;
      const result = await interceptor.get('/api/test');

      expect(result).toBe('Hello World');
    });
  });
});
