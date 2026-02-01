// 설정
const baseURL = import.meta.env.VITE_SERVER_URL as string;
const ACCESS_TOKEN_KEY = 'accessToken';
const AUTHORIZATION_HEADER_KEY = 'Authorization';
const AUTHORIZATION_SCHEME_TYPE = 'Bearer';
const SHOULD_NOT_INCLUDE_URLS: string[] = [];
const SHOULD_NOT_EQUAL_URLS: string[] = ['/auth/login'];

// 타입 정의
interface RequestOptions extends RequestInit {
  headers?: HeadersInit;
}

interface QueuedRequest {
  resolve: (value?: unknown) => void;
  reject: (reason?: Error | unknown) => void;
}

interface FetchError extends Error {
  status?: number;
  response?: unknown;
}

let isTokenRefreshing = false;
let failedRequestsQueue: QueuedRequest[] = [];

function processQueue(error: Error | null, token: string | null = null): void {
  failedRequestsQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedRequestsQueue = [];
}

// 토큰 갱신 로직 (실제 구현 필요)
async function requestAccessToken(): Promise<void> {
  console.log('refreshToken을 이용한 accessToken request');
}

async function apiFetch<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  async function _parseResponseBody(response: Response): Promise<T> {
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      return await response.json() as T;
    } else {
      return await response.text() as unknown as T;
    }
  }

  const headers = new Headers(options.headers || {});
  
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (accessToken) {
    headers.set(AUTHORIZATION_HEADER_KEY, `${AUTHORIZATION_SCHEME_TYPE} ${accessToken}`);
  }
  
  const config: RequestInit = {
    ...options,
    headers,
  };

  const fetchUrl = baseURL + url;

  try {
    let response = await fetch(fetchUrl, config);

    function _shouldProcessRequest(url: string): boolean {
      const isExactMatchBlocked = SHOULD_NOT_EQUAL_URLS.some(blockedUrl => url === blockedUrl);
      const isPartialMatchBlocked = SHOULD_NOT_INCLUDE_URLS.some(blockedFragment => url.includes(blockedFragment));
      return !isExactMatchBlocked && !isPartialMatchBlocked;
    }

    if (response.status === 401 && _shouldProcessRequest(url)) {
      const originalRequest = { url, options: { ...config, headers } };

      if (!isTokenRefreshing) {
        isTokenRefreshing = true;
        try {
          await requestAccessToken();
          isTokenRefreshing = false;
          const newToken = localStorage.getItem(ACCESS_TOKEN_KEY);
          processQueue(null, newToken);
        } catch (refreshError) {
          isTokenRefreshing = false;
          processQueue(refreshError as Error, null);
          throw refreshError;
        }
        const refreshedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        (originalRequest.options.headers as Headers).set(AUTHORIZATION_HEADER_KEY, `${AUTHORIZATION_SCHEME_TYPE} ${refreshedToken}`);
        response = await fetch(fetchUrl, originalRequest.options);
        if (!response.ok) throw response;
        
        return await _parseResponseBody(response);
      } else {
        return new Promise<T>((resolve, reject) => {
          failedRequestsQueue.push({
            resolve: async () => {
              const retryResponse = await fetch(fetchUrl, originalRequest.options);
              resolve(await _parseResponseBody(retryResponse));
            },
            reject,
          });
        });
      }
    }

    if (!response.ok) {
      let errorBody: unknown = null;
      try {
        errorBody = await _parseResponseBody(response);
      } catch (_) {
        errorBody = null;
      }
      const error: FetchError = new Error('Fetch error');
      error.status = response.status;
      error.response = errorBody;
      throw error;
    }

    return await _parseResponseBody(response);
  } catch (error) {
    throw error;
  }
}

export default {
  get: <T = unknown>(url: string, options: RequestOptions = {}): Promise<T> => apiFetch<T>(url, {
    ...options,
    method: 'GET',
  }),

  post: <T = unknown>(url: string, data: unknown, options: RequestOptions = {}): Promise<T> => {
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    return apiFetch<T>(url, {
      ...options,
      method: 'POST',
      body,
      headers,
    });
  },

  put: <T = unknown>(url: string, data: unknown, options: RequestOptions = {}): Promise<T> => {
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    return apiFetch<T>(url, {
      ...options,
      method: 'PUT',
      body,
      headers,
    });
  },

  delete: <T = unknown>(url: string, data: unknown = null, options: RequestOptions = {}): Promise<T> => {
    const body = data ? JSON.stringify(data) : null;
    const headers = {
      ...(data ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };
    return apiFetch<T>(url, {
      ...options,
      method: 'DELETE',
      ...(body ? { body } : {}),
      headers,
    });
  },

  patch: <T = unknown>(url: string, data: unknown, options: RequestOptions = {}): Promise<T> => {
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    return apiFetch<T>(url, {
      ...options,
      method: 'PATCH',
      body,
      headers,
    });
  },
};
