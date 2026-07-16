# LocalHub API 연동 명세

이 문서는 2026-07-16 기준 실서버의 OpenAPI 문서
`VITE_API_BASE_URL/openapi.json`을 프런트엔드 관점에서 정리한 것이다.

## 공통 규칙

- API 기준 주소는 `VITE_API_BASE_URL`에서 읽는다.
- 요청과 응답의 필드명은 snake_case이다.
- 목록 검증 오류는 `422`와 `detail[]`로 반환된다.
- 여행지 카테고리 목록 전용 API와 `/api/locations/{id}/posts` API는 존재하지 않는다.

## 엔드포인트 요약

| 영역   | Method | Path                                 | 설명                            |
| ------ | ------ | ------------------------------------ | ------------------------------- |
| 상태   | GET    | `/health`                            | 서버 상태 확인                  |
| 여행지 | GET    | `/api/locations`                     | 여행지 목록·검색·지도 범위 조회 |
| 여행지 | GET    | `/api/locations/{content_id}`        | 여행지 상세 조회                |
| 여행지 | GET    | `/api/locations/{content_id}/nearby` | 근처 여행지 조회                |
| 게시글 | GET    | `/api/posts`                         | 게시글 목록·검색·장소 필터 조회 |
| 게시글 | POST   | `/api/posts`                         | 게시글 생성                     |
| 게시글 | GET    | `/api/posts/{post_id}`               | 게시글 상세 조회                |
| 게시글 | PUT    | `/api/posts/{post_id}`               | 게시글 수정                     |
| 게시글 | DELETE | `/api/posts/{post_id}`               | 게시글 삭제                     |
| 챗     | GET    | `/api/chat/suggestions`              | 추천 질문 조회                  |
| 챗     | POST   | `/api/chat`                          | 챗봇 질문 전송                  |

## 여행지

### `GET /api/locations`

| Query      | Type    | 기본값 | 제약/설명                  |
| ---------- | ------- | ------ | -------------------------- |
| `category` | string  | 없음   | `content_type` 필터        |
| `query`    | string  | 없음   | 여행지 이름 또는 주소 검색 |
| `min_lat`  | number  | 없음   | 지도 남쪽 경계             |
| `max_lat`  | number  | 없음   | 지도 북쪽 경계             |
| `min_lng`  | number  | 없음   | 지도 서쪽 경계             |
| `max_lng`  | number  | 없음   | 지도 동쪽 경계             |
| `skip`     | integer | `0`    | 0 이상                     |
| `limit`    | integer | `100`  | 1~500                      |

성공 응답은 `LocationResponse[]`이다. 주요 필드는 `content_id`, `content_type`,
`title`, `address`, `longitude`, `latitude`, `original_image_url`,
`thumbnail_image_url`이다.

### `GET /api/locations/{content_id}`

`content_id`는 문자열이며 성공 시 단일 `LocationResponse`를 반환한다.

### `GET /api/locations/{content_id}/nearby`

`limit`은 1~20, 기본값은 5이다. 성공 응답은 `LocationResponse` 필드와
`distance_km`를 포함한 배열이다.

관련 게시글은 이 경로 아래에서 조회하지 않고 다음과 같이 조회한다.

```http
GET /api/posts?placeId={content_id}&page=1&size=3
```

## 게시글

### `GET /api/posts`

| Query      | Type    | 기본값 | 설명                        |
| ---------- | ------- | ------ | --------------------------- |
| `category` | string  | 없음   | 게시글 카테고리             |
| `query`    | string  | 없음   | 제목 또는 내용 검색         |
| `placeId`  | string  | 없음   | 특정 여행지를 포함한 게시글 |
| `page`     | integer | `1`    | 1 이상                      |
| `size`     | integer | `10`   | 1~100                       |

응답은 `items`, `page`, `size`, `total`, `total_pages`를 포함한다. 목록 항목은
`id`, `category`, `title`, `view_count`, `created_at`, `location_count`를 포함한다.

### `GET /api/posts/{post_id}`

상세 응답은 목록 필드 외에 `content`, `updated_at`, `locations[]`를 포함한다.
각 여행지는 `content_id`, `visit_order`, `content_type`, `title`, `address`,
`longitude`, `latitude`와 이미지 URL을 포함한다.

### `POST /api/posts`

```json
{
  "category": "COURSE",
  "title": "부산 여행 코스",
  "content": "여행 내용",
  "password": "1234",
  "locations": [{ "content_id": "126508", "visit_order": 1 }]
}
```

필수 필드는 `category`, `title`, `content`, `password`이며 성공 상태는 `201`이다.

### `PUT /api/posts/{post_id}`

POST와 같은 구조에 기존 비밀번호를 담아 전송한다. 성공 시 수정된 게시글과 `200`을 반환한다.

### `DELETE /api/posts/{post_id}`

```json
{ "password": "1234" }
```

성공 상태는 `200`이며 `{ "message": "..." }` 형태로 반환한다.

## 챗

### `POST /api/chat`

```json
{ "message": "해운대 근처 여행지를 추천해 줘" }
```

`message`는 1~1000자이다. 성공 응답은 `{ "answer": "..." }`이다.
현재 실서버 500 오류는 `백엔드이관.md`에서 추적한다.

### `GET /api/chat/suggestions`

추천 질문 데이터를 반환한다. 응답 구조는 현재 OpenAPI에서 구체적으로 선언하지 않는다.
