/**
 * 
 * 설정 값들
 * baseURL: 서버 URL
 * ACCESS_TOKEN_KEY: 로컬 스토리지에 저장되는 토큰 키
 * AUTHORIZATION_HEADER_KEY: 헤더에 저장되는 토큰 키
 * AUTHORIZATION_SCHEME_TYPE: 토큰 스킴 타입(Bearer, etc)
 * SHOULD_NOT_INCLUDE_URLS: 포함되면 안 되는 URL, includes로 비교
 * SHOULD_NOT_EQUAL_URLS: 포함되면 안 되는 URL, equal로 비교
 * 
 */
const baseURL = import.meta.env.VITE_SERVER_URL;
const ACCESS_TOKEN_KEY = 'accessToken';
const AUTHORIZATION_HEADER_KEY='Authorization';
const AUTHORIZATION_SCHEME_TYPE = 'Bearer';
const SHOULD_NOT_INCLUDE_URLS = [];
const SHOULD_NOT_EQUAL_URLS = ['/auth/login'];

let isTokenRefreshing = false;
let failedRequestsQueue = [];

function processQueue(error, token = null) {
  failedRequestsQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedRequestsQueue = [];
}

async function requestAccessToken() {
  // 여기서 토큰 갱신 로직 구현 혹은 외부 호출
  // 예시: 토큰 갱신 API 호출 후 로컬 스토리지 업데이트
  // 이 부분은 실제 store 동작에 맞게 변경 필요
  // return await store.dispatch('requestAccessToken');
  console.log('refreshToken을 이용한 accessToken request')
}

async function apiFetch(url, options = {}) {
  async function _parseResponseBody(response) {
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  }

  // 기본 헤더 세팅
  const headers = new Headers(options.headers || {});
  
  // 토큰 넣기 (request interceptor 역할)
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  if (accessToken) {
    headers.set(AUTHORIZATION_HEADER_KEY, `${AUTHORIZATION_SCHEME_TYPE} ${accessToken}`);
    headers.set('Access-Control-Allow-Origin', '*');
  }
  
  // 완성된 옵션
  const config = {
    ...options,
    headers,
  };

  // 실제 요청 함수
  const fetchUrl = baseURL + url;

  try {
    let response = await fetch(fetchUrl, config);

    // URL 검사를 위한 함수
    function _shouldProcessRequest(url) {
      // 정확히 일치하면 제외
      const isExactMatchBlocked = SHOULD_NOT_EQUAL_URLS.some(blockedUrl => url === blockedUrl);
    
      // 포함되어 있으면 제외
      const isPartialMatchBlocked = SHOULD_NOT_INCLUDE_URLS.some(blockedFragment => url.includes(blockedFragment));
    
      // 둘 다 만족하지 않으면(true), 즉 허용됨
      return !isExactMatchBlocked && !isPartialMatchBlocked;
    };

    // 401 응답 시 토큰 갱신 로직 처리 (response interceptor 역할)
    if (response.status === 401 && _shouldProcessRequest(url)) {
      // 원본 요청 정보 저장
      const originalRequest = { url, options: config };

      if (!isTokenRefreshing) {
        isTokenRefreshing = true;
        try {
          await requestAccessToken();
          isTokenRefreshing = false;
          processQueue(null, accessToken);
        } catch (refreshError) {
          isTokenRefreshing = false;
          processQueue(refreshError, null);
          throw refreshError;
        }
        // 토큰 갱신 후 원래 요청 재시도
        // 재시도 시 토큰 헤더 다시 설정
        originalRequest.options.headers.set(AUTHORIZATION_HEADER_KEY, `${AUTHORIZATION_SCHEME_TYPE} ${accessToken}`);
        response = await fetch(fetchUrl, originalRequest.options);
        if (!response.ok) throw response; // 재시도 후에도 실패면 throw
        
        return await _parseResponseBody(response)
      } else {
        // 토큰 갱신 중이면 큐에 넣고 Promise 대기
        return new Promise((resolve, reject) => {
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

    // 401 이외 에러 처리
    if (!response.ok) {
      let errorBody = null;
      try {
        errorBody = await _parseResponseBody(response);
      } catch (_) {
        errorBody = null;
      }
      const error = new Error('Fetch error');
      error.status = response.status;
      error.response = errorBody;
      throw error;
    }

    return await _parseResponseBody(response)
  } catch (error) {
    // 네트워크 오류 등
    throw error;
  }
}

export default {
  get: (url, options = {}) => apiFetch(url, {
    ...options,
    method: 'GET',
  }),

  post: (url, data, options = {}) => {
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    return apiFetch(url, {
      ...options,
      method: 'POST',
      body,
      headers,
    });
  },

  put: (url, data, options = {}) => {
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    return apiFetch(url, {
      ...options,
      method: 'PUT',
      body,
      headers,
    });
  },

  delete: (url, data = null, options = {}) => {
    const body = data ? JSON.stringify(data) : null;
    const headers = {
      ...(data ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    };
    return apiFetch(url, {
      ...options,
      method: 'DELETE',
      ...(body ? { body } : {}),
      headers,
    });
  },

  patch: (url, data, options = {}) => {
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    return apiFetch(url, {
      ...options,
      method: 'PATCH',
      body,
      headers,
    });
  },
};