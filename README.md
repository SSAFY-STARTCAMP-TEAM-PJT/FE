# LocalHub Frontend

> 지도에서 여행지를 탐색하고 나만의 여행 코스를 공유하는 커뮤니티 서비스

LocalHub Frontend는 Vue 3 기반의 SPA입니다. 공공 관광 데이터를 지도에서 탐색하고, 여러 여행지를 방문 순서대로 묶어 코스로 공유할 수 있습니다. 여행지별 관련 게시글과 주변 장소를 확인하거나 AI 챗봇에 여행 정보를 질문할 수도 있습니다.

## 주요 기능

- **여행지 탐색**: 현재 지도 영역의 여행지를 조회하고 이름·주소 및 카테고리로 검색합니다.
- **여행지 상세**: 선택한 장소의 정보, 관련 게시글, 주변 여행지를 한 화면에서 확인합니다.
- **여행 코스 작성**: 여러 여행지를 선택하고 방문 순서를 조정한 뒤 지도에서 경로를 미리 봅니다.
- **게시글 관리**: 익명 게시글을 작성·조회·수정·삭제합니다. 작성 시 설정한 비밀번호로 수정과 삭제를 보호합니다.
- **AI 챗봇**: 여행지 정보와 추천 코스를 대화형으로 안내합니다.
- **반응형 UI**: 데스크톱과 모바일 환경에 맞춰 지도와 사이드 패널 레이아웃을 제공합니다.

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Framework | Vue 3 (Composition API) |
| Build | Vite 8 |
| Language | JavaScript (ES Modules) |
| Routing | Vue Router 5 |
| State | Pinia 3 |
| HTTP | Fetch API |
| Map | Kakao Maps JavaScript SDK, Kakao Mobility Directions API |
| Test | Vitest, Vue Test Utils, jsdom |
| Code Quality | ESLint, Oxlint, Prettier |

## 시작하기

### 요구 사항

- Node.js `^22.18.0` 또는 `>=24.12.0`
- npm
- 실행 가능한 LocalHub Backend API
- Kakao Developers JavaScript 키 및 REST API 키

### 설치 및 실행

```bash
git clone <repository-url>
cd FE
npm ci
```

프로젝트 루트에 `.env`를 만들고 아래 값을 설정합니다.

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_KAKAO_MAP_JAVASCRIPT_KEY=your_javascript_key
VITE_KAKAO_REST_API_KEY=your_rest_api_key
```

개발 서버를 시작합니다.

```bash
npm run dev
```

터미널에 표시되는 주소(기본값 `http://localhost:5173`)로 접속합니다. Kakao Developers 애플리케이션의 JavaScript SDK 도메인에도 개발 서버 주소를 등록해야 지도가 정상적으로 표시됩니다.

> `.env`는 Git에서 제외됩니다. 실제 API 키나 운영 서버 주소를 커밋하지 마세요. `VITE_` 접두사가 붙은 값은 빌드 결과물에서 브라우저에 노출될 수 있습니다.

## 환경 변수

| 변수 | 필수 | 설명 |
| --- | :---: | --- |
| `VITE_API_BASE_URL` | 예 | FastAPI Backend의 기준 URL |
| `VITE_KAKAO_MAP_JAVASCRIPT_KEY` | 예 | 지도 렌더링에 사용하는 Kakao JavaScript 키 |
| `VITE_KAKAO_REST_API_KEY` | 예 | 다중 경유지 자동차 경로 요청에 사용하는 Kakao REST API 키 |

## 주요 화면과 라우트

| 경로 | 화면 | 설명 |
| --- | --- | --- |
| `/` | 홈 | 최근 여행 코스와 추천 여행지 |
| `/map` | 여행지 지도 | 지도 탐색, 검색, 필터, 장소 상세 |
| `/posts` | 게시글 목록 | 코스 검색 및 페이지별 목록 |
| `/posts/create` | 게시글 작성 | 여행지 선택, 순서 지정, 코스 미리보기 |
| `/posts/:postId` | 게시글 상세 | 게시글 및 코스 정보 |
| `/posts/:postId/edit` | 게시글 수정 | 비밀번호 확인 후 게시글과 코스 수정 |

존재하지 않는 경로는 404 화면으로 이동합니다.

## 프로젝트 구조

```text
src/
├── assets/          # 전역 스타일과 정적 리소스
├── components/
│   ├── chat/        # AI 챗봇 위젯
│   ├── common/      # 헤더, 내비게이션, 로딩, 오류 UI
│   ├── location/    # 여행지 카드
│   ├── map/         # Kakao 지도, 필터, 목록·상세 패널
│   └── post/        # 게시글 카드와 코스 작성 폼
├── composables/     # 재사용 가능한 Vue 로직
├── Layouts/         # 애플리케이션 공통 레이아웃
├── router/          # 라우트 정의
├── services/        # Backend 및 Kakao API 통신, 응답 정규화, 지도 캐시
├── stores/          # Pinia 전역 상태
├── utils/           # 좌표와 표시 형식 유틸리티
├── views/           # 라우트 단위 화면
├── App.vue
└── main.js
```

## API 연동

Frontend는 `VITE_API_BASE_URL`을 기준으로 다음 Backend API를 호출합니다.

- `/api/locations`: 여행지 목록, 상세, 주변 여행지
- `/api/posts`: 게시글 목록 및 CRUD
- `/api/chat`: AI 챗봇 질의응답

코스 지도 경로는 브라우저에서 Kakao Mobility 다중 경유지 길찾기 API를 호출해 그립니다. 상세 요청·응답 형식은 [API 설계 문서](./docs/API설계.md)를 참고하세요.

## 스크립트

```bash
npm run dev         # 개발 서버 실행
npm run build       # 프로덕션 빌드
npm run preview     # 빌드 결과 로컬 미리보기
npm run test:unit   # Vitest 실행(감시 모드)
npm run lint        # Oxlint와 ESLint 검사 및 자동 수정
npm run format      # src 디렉터리 Prettier 포맷 적용
```

CI처럼 테스트를 한 번만 실행하려면 다음 명령을 사용합니다.

```bash
npm run test:unit -- --run
```

## 관련 문서

- [API 설계](./docs/API설계.md)
- [화면 설계](./docs/화면설계.md)
