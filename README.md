# Fetch Interceptor

## 프로젝트 설명

이 프로젝트는 액세스 토큰을 헤더에 담아 Fetch 요청을 보내고 응답이 401(Unauthorized)일 시 토큰 재발급 로직 수행 후 재요청하는 인터셉터 예시입니다. Vue 3와 Vite를 사용한 프론트엔드 예제 프로젝트 위에 작업했습니다.

**⚠️ 중요: 이 프로젝트의 핵심은 프론트엔드의 Fetch 인터셉터 구현입니다. 백엔드는 프론트엔드 인터셉터 테스트를 위한 간단한 목업(Mock) 서버로, 실제 비즈니스 로직이나 프로덕션 수준의 구현을 포함하지 않습니다.**

## 주요 기능

- Fetch API 기반 HTTP 클라이언트
- 자동 토큰 헤더 추가
- 401 응답 시 자동 토큰 갱신 및 재요청
- 요청 큐 처리로 토큰 갱신 중 중복 요청 방지
- TypeScript 지원
- Vitest 기반 테스트 코드

## 프로젝트 구조

```
vue_interceptor/
├── fe/                    # 프론트엔드 (Vue 3)
│   ├── src/
│   │   ├── interceptor.ts # Fetch 인터셉터 (TypeScript)
│   │   ├── main.js        # Vue 앱 진입점
│   │   └── __tests__/     # 테스트 코드
│   ├── package.json
│   └── vitest.config.ts   # Vitest 설정
└── be/                    # 백엔드 (NestJS) - 프론트엔드 테스트용 목업 서버
    ├── src/
    │   ├── app.controller.ts
    │   ├── app.service.ts
    │   └── connection-test/  # 인터셉터 테스트용 엔드포인트
    └── test/                # E2E 테스트
```

## 프로젝트 설정

### 프론트엔드 (Vue.js)

1. 프론트엔드 디렉토리로 이동:
   ```bash
   cd fe
   ```

2. 의존성 설치:
   ```bash
   npm install
   ```

3. 개발 모드에서 서버 시작:
   ```bash
   npm run dev
   ```

4. 테스트 실행:
   ```bash
   npm run test:run
   ```

### 백엔드 (NestJS) - 목업 서버

**참고**: 백엔드는 프론트엔드 인터셉터 테스트를 위한 목업 서버입니다. 실제 비즈니스 로직이나 인증 시스템을 구현하지 않으며, 단순히 다양한 HTTP 응답을 반환하여 프론트엔드 인터셉터의 동작을 검증하는 용도로만 사용됩니다.

1. 백엔드 디렉토리로 이동:
   ```bash
   cd be
   ```

2. 의존성 설치:
   ```bash
   npm install
   ```

3. 개발 모드에서 서버 시작:
   ```bash
   npm run start:dev
   ```

4. 프로덕션 모드에서 서버 시작:
   ```bash
   npm run start:prod
   ```

#### 백엔드 API 엔드포인트 (테스트용)

백엔드는 다음 엔드포인트를 제공합니다:

- `GET /` - 기본 헬로 월드 응답
- `GET /connection-test/common` - 인증 헤더를 반환 (정상 응답)
- `POST /connection-test/common` - 요청 바디를 반환 (정상 응답)
- `GET /connection-test/error` - 500 에러 반환 (에러 처리 테스트용)
- `GET /connection-test/unauthorized` - 401 에러 반환 (토큰 갱신 테스트용)

#### 백엔드 테스트

```bash
cd be

# 단위 테스트 실행
npm run test

# 테스트 커버리지 확인
npm run test:cov

# E2E 테스트 실행
npm run test:e2e
```

## 환경 변수 설정

이 프로젝트는 환경 변수를 사용하여 서버 URL을 설정합니다. `.env` 파일을 프로젝트 루트에 생성하고 다음과 같이 설정합니다.

```
VITE_SERVER_URL=http://localhost:3000
```

여기서 `http://localhost:3000`은 백엔드 서버의 URL입니다. 필요에 따라 변경할 수 있습니다.

## Fetch 인터셉터

프론트엔드에서는 Fetch 함수를 사용한 인터셉터를 사용하여 요청과 응답을 처리합니다. `fe/src/interceptor.ts` 파일에서 인터셉터의 로직을 확인할 수 있습니다.

### 인터셉터 기능

- Axios와 비슷하게 사용할 수 있는 API 제공
- 요청 시 토큰을 자동으로 추가
- 401 응답 시 토큰을 갱신하고 원래 요청을 재시도
- 토큰 갱신 중 발생한 요청은 큐에 저장 후 갱신 완료 시 일괄 처리

### 사용 방법

```typescript
import interceptor from './interceptor';

// GET 요청
const data = await interceptor.get('/api/users');

// POST 요청
const result = await interceptor.post('/api/users', { name: 'John' });

// PUT 요청
const updated = await interceptor.put('/api/users/1', { name: 'Jane' });

// DELETE 요청
await interceptor.delete('/api/users/1');

// PATCH 요청
const patched = await interceptor.patch('/api/users/1', { name: 'Bob' });
```

### 토큰 갱신 로직

인터셉터는 401 응답을 받으면 자동으로 토큰 갱신을 시도합니다. `requestAccessToken` 함수를 실제 토큰 갱신 로직으로 구현해야 합니다.

```typescript
async function requestAccessToken(): Promise<void> {
  // 실제 토큰 갱신 API 호출
  const response = await fetch(`${baseURL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: localStorage.getItem('refreshToken') })
  });
  
  const data = await response.json();
  localStorage.setItem('accessToken', data.accessToken);
}
```

### 설정 옵션

인터셉터는 다음 상수를 통해 동작을 제어합니다.

- `ACCESS_TOKEN_KEY`: 로컬 스토리지에 저장되는 토큰 키 (기본값: 'accessToken')
- `AUTHORIZATION_HEADER_KEY`: 헤더에 저장되는 토큰 키 (기본값: 'Authorization')
- `AUTHORIZATION_SCHEME_TYPE`: 토큰 스킴 타입 (기본값: 'Bearer')
- `SHOULD_NOT_INCLUDE_URLS`: 포함되면 안 되는 URL 목록 (includes로 비교)
- `SHOULD_NOT_EQUAL_URLS`: 포함되면 안 되는 URL 목록 (equal로 비교, 기본값: ['/auth/login'])

## 테스트 실행

### 프론트엔드 테스트

프론트엔드의 각 버튼은 로컬 스토리지에 액세스 토큰 저장, 일반 요청 처리, 401 오류 시 토큰 갱신 및 재요청, 그 외의 오류 응답 반환 기능을 테스트합니다.

```bash
cd fe
npm run test:run
```

프론트엔드 테스트는 다음 항목을 검증합니다:

- 토큰 헤더 설정
- HTTP 메서드별 요청 처리
- 에러 처리
- 응답 파싱 (JSON 및 텍스트)

### 백엔드 테스트

백엔드는 프론트엔드 인터셉터 테스트를 위한 목업 서버이므로, 테스트는 각 엔드포인트가 의도한 대로 응답하는지 확인하는 수준입니다.

```bash
cd be

# 단위 테스트 실행
npm run test

# 테스트 커버리지 확인
npm run test:cov

# E2E 테스트 실행
npm run test:e2e
```

백엔드 테스트는 다음을 검증합니다:

- 각 엔드포인트의 정상 응답
- 에러 응답 (401, 500)
- 요청 헤더 및 바디 처리

## 기술 스택

- Vue 3: 프론트엔드 프레임워크
- TypeScript: 타입 안정성
- Vite: 빌드 도구
- Vitest: 테스트 프레임워크
- Fetch API: HTTP 클라이언트

## 라이선스

이 프로젝트는 MIT 라이선스에 따라 배포됩니다.
