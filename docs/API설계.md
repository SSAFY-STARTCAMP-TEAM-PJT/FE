# LocalHub REST API 설계 상세표

## 1. API 전체 목록

| 구분      | Method | Endpoint                             | 기능                                       | 인증     | 주요 응답           |
| --------- | ------ | ------------------------------------ | ------------------------------------------ | -------- | ------------------- |
| 상태 확인 | GET    | `/api/health`                        | 서버 및 DB 연결 상태 확인                  | 없음     | `200`               |
| 여행지    | GET    | `/api/locations`                     | 여행지 목록, 검색, 카테고리·지도 범위 필터 | 없음     | `200`               |
| 여행지    | GET    | `/api/locations/categories`          | 여행지 카테고리 목록 조회                  | 없음     | `200`               |
| 여행지    | GET    | `/api/locations/{content_id}`        | 여행지 상세 조회                           | 없음     | `200`, `404`        |
| 여행지    | GET    | `/api/locations/{content_id}/nearby` | 근처 여행지 조회                           | 없음     | `200`, `404`        |
| 여행지    | GET    | `/api/locations/{content_id}/posts`  | 해당 여행지가 첨부된 게시글 조회           | 없음     | `200`, `404`        |
| 게시글    | GET    | `/api/posts`                         | 게시글 목록, 검색, 필터, 페이지네이션      | 없음     | `200`               |
| 게시글    | GET    | `/api/posts/{post_id}`               | 게시글 상세 및 여행 코스 조회              | 없음     | `200`, `404`        |
| 게시글    | POST   | `/api/posts`                         | 익명 게시글과 여행 코스 등록               | 없음     | `201`, `400`, `422` |
| 게시글    | PUT    | `/api/posts/{post_id}`               | 비밀번호 확인 후 게시글·코스 수정          | 비밀번호 | `200`, `403`, `404` |
| 게시글    | DELETE | `/api/posts/{post_id}`               | 비밀번호 확인 후 게시글 삭제               | 비밀번호 | `204`, `403`, `404` |
| 챗봇      | POST   | `/api/chat`                          | 지역 정보 및 게시글 자연어 질의응답        | 없음     | `200`, `503`        |

---

# 2. 상태 확인 API

## `GET /api/health`

| 항목           | 내용                                     |
| -------------- | ---------------------------------------- |
| 목적           | Render 배포 상태와 SQLite 연결 여부 확인 |
| 요청 본문      | 없음                                     |
| 쿼리 파라미터  | 없음                                     |
| 성공 상태 코드 | `200 OK`                                 |
| 실패 상태 코드 | `503 Service Unavailable`                |
| 주요 사용 화면 | 배포 점검, 운영 상태 확인                |

### 성공 응답

| 필드       | 타입   | 설명         |
| ---------- | ------ | ------------ |
| `status`   | string | 서버 상태    |
| `database` | string | DB 연결 상태 |

```json
{
  "status": "ok",
  "database": "connected"
}
```

---

# 3. 여행지 API

## 3.1 여행지 목록 조회

### `GET /api/locations`

| 항목             | 내용                                           |
| ---------------- | ---------------------------------------------- |
| 목적             | 지도 마커, 현재 지도 범위 목록, 검색 결과 조회 |
| 요청 본문        | 없음                                           |
| 성공 상태 코드   | `200 OK`                                       |
| 정렬 기준        | 기본 `title ASC` 또는 데이터 적재 순서         |
| 좌표 없는 데이터 | 지도용 조회에서는 제외 권장                    |

### 쿼리 파라미터

| 이름           | 타입    |   필수 | 기본값 | 설명                 | 검증                    |
| -------------- | ------- | -----: | ------ | -------------------- | ----------------------- |
| `q`            | string  | 아니요 | 없음   | 여행지명·주소 검색   | 최대 100자              |
| `content_type` | string  | 아니요 | 없음   | 여행지 카테고리 필터 | 등록된 유형만 허용 권장 |
| `min_lat`      | float   | 아니요 | 없음   | 지도 남쪽 경계       | `-90~90`                |
| `max_lat`      | float   | 아니요 | 없음   | 지도 북쪽 경계       | `-90~90`                |
| `min_lng`      | float   | 아니요 | 없음   | 지도 서쪽 경계       | `-180~180`              |
| `max_lng`      | float   | 아니요 | 없음   | 지도 동쪽 경계       | `-180~180`              |
| `limit`        | integer | 아니요 | `500`  | 최대 반환 개수       | `1~1000`                |
| `offset`       | integer | 아니요 | `0`    | 조회 시작 위치       | `0 이상`                |

### 좌표 경계 검증

| 조건                    | 처리                       |
| ----------------------- | -------------------------- |
| 일부 좌표 경계값만 전달 | `400 Bad Request`          |
| `min_lat > max_lat`     | `400 Bad Request`          |
| `min_lng > max_lng`     | `400 Bad Request`          |
| 범위를 벗어난 좌표      | `422 Unprocessable Entity` |

### 응답 필드

| 필드                          | 타입        | 설명                  |
| ----------------------------- | ----------- | --------------------- |
| `items`                       | array       | 여행지 요약 목록      |
| `items[].content_id`          | string      | 여행지 고유 ID        |
| `items[].content_type`        | string      | 여행지 카테고리       |
| `items[].title`               | string      | 여행지명              |
| `items[].address`             | string/null | 주소                  |
| `items[].longitude`           | number      | 경도                  |
| `items[].latitude`            | number      | 위도                  |
| `items[].thumbnail_image_url` | string/null | 썸네일                |
| `total`                       | integer     | 조건에 맞는 전체 건수 |
| `limit`                       | integer     | 적용된 반환 개수      |
| `offset`                      | integer     | 적용된 시작 위치      |

### 호출 예시

```http
GET /api/locations?q=해운대&content_type=관광지
```

```http
GET /api/locations?min_lat=35.10&max_lat=35.20&min_lng=129.10&max_lng=129.20
```

### 성공 응답 예시

```json
{
  "items": [
    {
      "content_id": "126508",
      "content_type": "관광지",
      "title": "해운대 해수욕장",
      "address": "부산광역시 해운대구",
      "longitude": 129.1604,
      "latitude": 35.1587,
      "thumbnail_image_url": "https://example.com/thumb.jpg"
    }
  ],
  "total": 1,
  "limit": 500,
  "offset": 0
}
```

---

## 3.2 여행지 카테고리 조회

### `GET /api/locations/categories`

| 항목           | 내용                    |
| -------------- | ----------------------- |
| 목적           | 지도 카테고리 필터 구성 |
| 요청 본문      | 없음                    |
| 성공 상태 코드 | `200 OK`                |
| 정렬 기준      | 표시 순서 또는 이름순   |

### 응답 필드

| 필드            | 타입    | 설명                    |
| --------------- | ------- | ----------------------- |
| `items`         | array   | 카테고리 목록           |
| `items[].value` | string  | API 필터에 전달할 값    |
| `items[].label` | string  | 화면 표시 이름          |
| `items[].count` | integer | 해당 카테고리 여행지 수 |

### 응답 예시

```json
{
  "items": [
    {
      "value": "관광지",
      "label": "관광지",
      "count": 125
    },
    {
      "value": "문화시설",
      "label": "문화시설",
      "count": 42
    },
    {
      "value": "음식점",
      "label": "맛집",
      "count": 88
    }
  ]
}
```

---

## 3.3 여행지 상세 조회

### `GET /api/locations/{content_id}`

| 항목           | 내용                            |
| -------------- | ------------------------------- |
| 목적           | 지도 상세 패널의 기본 정보 조회 |
| 경로 파라미터  | `content_id`                    |
| 요청 본문      | 없음                            |
| 성공 상태 코드 | `200 OK`                        |
| 실패 상태 코드 | `404 Not Found`                 |

### 경로 파라미터

| 이름         | 타입   | 설명           |
| ------------ | ------ | -------------- |
| `content_id` | string | 여행지 고유 ID |

### 응답 필드

| 필드                  | 타입         | 설명                |
| --------------------- | ------------ | ------------------- |
| `content_id`          | string       | 여행지 고유 ID      |
| `content_type`        | string       | 카테고리            |
| `title`               | string       | 여행지명            |
| `address`             | string/null  | 기본 주소           |
| `address_detail`      | string/null  | 상세 주소           |
| `zipcode`             | string/null  | 우편번호            |
| `telephone`           | string/null  | 전화번호            |
| `longitude`           | number/null  | 경도                |
| `latitude`            | number/null  | 위도                |
| `map_level`           | integer/null | 권장 지도 확대 수준 |
| `area_code`           | string/null  | 지역 코드           |
| `original_image_url`  | string/null  | 원본 이미지         |
| `thumbnail_image_url` | string/null  | 썸네일 이미지       |

### 성공 응답 예시

```json
{
  "content_id": "126508",
  "content_type": "관광지",
  "title": "해운대 해수욕장",
  "address": "부산광역시 해운대구",
  "address_detail": "우동",
  "zipcode": "48094",
  "telephone": "051-000-0000",
  "longitude": 129.1604,
  "latitude": 35.1587,
  "map_level": 5,
  "area_code": "6",
  "original_image_url": "https://example.com/original.jpg",
  "thumbnail_image_url": "https://example.com/thumb.jpg"
}
```

### 오류 응답 예시

```json
{
  "detail": {
    "code": "LOCATION_NOT_FOUND",
    "message": "여행지를 찾을 수 없습니다."
  }
}
```

---

## 3.4 근처 여행지 조회

### `GET /api/locations/{content_id}/nearby`

| 항목           | 내용                                      |
| -------------- | ----------------------------------------- |
| 목적           | 여행지 상세 패널의 근처 여행지 3~5개 조회 |
| 거리 기준      | 위도·경도 기반 직선거리                   |
| 경로 파라미터  | `content_id`                              |
| 성공 상태 코드 | `200 OK`                                  |
| 실패 상태 코드 | `404 Not Found`, `400 Bad Request`        |

### 쿼리 파라미터

| 이름           | 타입    |   필수 | 기본값 | 설명          | 검증          |
| -------------- | ------- | -----: | -----: | ------------- | ------------- |
| `limit`        | integer | 아니요 |    `5` | 반환 개수     | `1~10`        |
| `radius_km`    | float   | 아니요 |   없음 | 검색 반경     | `0 초과`      |
| `content_type` | string  | 아니요 |   없음 | 카테고리 제한 | 유효 카테고리 |

### 응답 필드

| 필드                       | 타입        | 설명             |
| -------------------------- | ----------- | ---------------- |
| `base_location`            | object      | 기준 여행지      |
| `base_location.content_id` | string      | 기준 여행지 ID   |
| `base_location.title`      | string      | 기준 여행지명    |
| `items`                    | array       | 근처 여행지 목록 |
| `items[].content_id`       | string      | 여행지 ID        |
| `items[].content_type`     | string      | 카테고리         |
| `items[].title`            | string      | 여행지명         |
| `items[].address`          | string/null | 주소             |
| `items[].longitude`        | number      | 경도             |
| `items[].latitude`         | number      | 위도             |
| `items[].distance_km`      | number      | 직선거리         |
| `distance_basis`           | string      | 거리 산정 기준   |

### 응답 예시

```json
{
  "base_location": {
    "content_id": "126508",
    "title": "해운대 해수욕장"
  },
  "items": [
    {
      "content_id": "126509",
      "content_type": "관광지",
      "title": "동백섬",
      "address": "부산광역시 해운대구",
      "longitude": 129.1523,
      "latitude": 35.1521,
      "distance_km": 0.8
    }
  ],
  "distance_basis": "straight_line"
}
```

### 예외 조건

| 상황                  | 상태 코드 | 오류 코드                      |
| --------------------- | --------: | ------------------------------ |
| 여행지 없음           |     `404` | `LOCATION_NOT_FOUND`           |
| 기준 여행지 좌표 없음 |     `400` | `LOCATION_COORDINATES_MISSING` |

---

## 3.5 여행지 관련 게시글 조회

### `GET /api/locations/{content_id}/posts`

| 항목           | 내용                                  |
| -------------- | ------------------------------------- |
| 목적           | 여행지 상세 패널에서 관련 게시글 조회 |
| 경로 파라미터  | `content_id`                          |
| 성공 상태 코드 | `200 OK`                              |
| 실패 상태 코드 | `404 Not Found`                       |
| 기본 정렬      | 최신순                                |

### 쿼리 파라미터

| 이름     | 타입    | 기본값 | 설명           | 검증     |
| -------- | ------- | -----: | -------------- | -------- |
| `limit`  | integer |    `3` | 반환 게시글 수 | `1~50`   |
| `offset` | integer |    `0` | 조회 시작 위치 | `0 이상` |

### 응답 필드

| 필드                     | 타입     | 설명                |
| ------------------------ | -------- | ------------------- |
| `items`                  | array    | 게시글 요약 목록    |
| `items[].id`             | integer  | 게시글 ID           |
| `items[].category`       | string   | 게시글 카테고리     |
| `items[].title`          | string   | 제목                |
| `items[].location_count` | integer  | 첨부 여행지 수      |
| `items[].view_count`     | integer  | 조회수              |
| `items[].created_at`     | datetime | 작성일              |
| `total`                  | integer  | 관련 게시글 전체 수 |

### 응답 예시

```json
{
  "items": [
    {
      "id": 12,
      "category": "여행 코스",
      "title": "부산 바다 따라 하루 여행",
      "location_count": 3,
      "view_count": 18,
      "created_at": "2026-07-14T08:30:00"
    }
  ],
  "total": 4
}
```

---

# 4. 게시글 API

## 4.1 게시글 목록 조회

### `GET /api/posts`

| 항목           | 내용                                    |
| -------------- | --------------------------------------- |
| 목적           | 게시판 목록, 검색, 카테고리·여행지 필터 |
| 요청 본문      | 없음                                    |
| 성공 상태 코드 | `200 OK`                                |
| 기본 정렬      | 최신순                                  |

### 쿼리 파라미터

| 이름         | 타입    |   필수 | 기본값   | 설명                    | 검증              |
| ------------ | ------- | -----: | -------- | ----------------------- | ----------------- |
| `page`       | integer | 아니요 | `1`      | 페이지 번호             | `1 이상`          |
| `size`       | integer | 아니요 | `10`     | 페이지 크기             | `1~50`            |
| `q`          | string  | 아니요 | 없음     | 제목·본문 검색          | 최대 100자        |
| `category`   | string  | 아니요 | 없음     | 게시글 카테고리         | 최대 50자         |
| `content_id` | string  | 아니요 | 없음     | 특정 여행지가 첨부된 글 | 여행지 ID         |
| `sort`       | string  | 아니요 | `latest` | 정렬 방식               | `latest`, `views` |

### 응답 필드

| 필드                       | 타입     | 설명                    |
| -------------------------- | -------- | ----------------------- |
| `items`                    | array    | 게시글 목록             |
| `items[].id`               | integer  | 게시글 ID               |
| `items[].category`         | string   | 카테고리                |
| `items[].title`            | string   | 제목                    |
| `items[].view_count`       | integer  | 조회수                  |
| `items[].location_count`   | integer  | 첨부 장소 수            |
| `items[].location_preview` | array    | 배지 툴팁용 여행지 요약 |
| `items[].created_at`       | datetime | 작성일                  |
| `items[].updated_at`       | datetime | 수정일                  |
| `page`                     | integer  | 현재 페이지             |
| `size`                     | integer  | 페이지 크기             |
| `total`                    | integer  | 전체 게시글 수          |
| `total_pages`              | integer  | 전체 페이지 수          |

### 응답 예시

```json
{
  "items": [
    {
      "id": 12,
      "category": "여행 코스",
      "title": "부산 바다 따라 하루 여행",
      "view_count": 18,
      "location_count": 3,
      "location_preview": [
        {
          "content_id": "126508",
          "title": "해운대 해수욕장"
        },
        {
          "content_id": "126509",
          "title": "동백섬"
        },
        {
          "content_id": "126510",
          "title": "광안리 해수욕장"
        }
      ],
      "created_at": "2026-07-14T08:30:00",
      "updated_at": "2026-07-14T08:30:00"
    }
  ],
  "page": 1,
  "size": 10,
  "total": 23,
  "total_pages": 3
}
```

---

## 4.2 게시글 상세 조회

### `GET /api/posts/{post_id}`

| 항목           | 내용                                    |
| -------------- | --------------------------------------- |
| 목적           | 게시글 본문 및 순서 있는 여행 코스 조회 |
| 경로 파라미터  | `post_id`                               |
| 성공 상태 코드 | `200 OK`                                |
| 실패 상태 코드 | `404 Not Found`                         |
| 조회수         | 상세 조회 성공 시 1 증가                |
| 여행지 정렬    | `visit_order ASC`                       |

### 응답 필드

| 필드                              | 타입        | 설명             |
| --------------------------------- | ----------- | ---------------- |
| `id`                              | integer     | 게시글 ID        |
| `category`                        | string      | 게시글 카테고리  |
| `title`                           | string      | 제목             |
| `content`                         | string      | 본문             |
| `view_count`                      | integer     | 조회수           |
| `created_at`                      | datetime    | 작성일           |
| `updated_at`                      | datetime    | 수정일           |
| `locations`                       | array       | 코스 여행지 목록 |
| `locations[].content_id`          | string      | 여행지 ID        |
| `locations[].content_type`        | string      | 카테고리         |
| `locations[].title`               | string      | 여행지명         |
| `locations[].address`             | string/null | 주소             |
| `locations[].longitude`           | number      | 경도             |
| `locations[].latitude`            | number      | 위도             |
| `locations[].thumbnail_image_url` | string/null | 썸네일           |
| `locations[].visit_order`         | integer     | 방문 순서        |

### 응답 예시

```json
{
  "id": 12,
  "category": "여행 코스",
  "title": "부산 바다 따라 하루 여행",
  "content": "해운대에서 시작해 광안리까지 이동하는 코스입니다.",
  "view_count": 19,
  "created_at": "2026-07-14T08:30:00",
  "updated_at": "2026-07-14T08:30:00",
  "locations": [
    {
      "content_id": "126508",
      "content_type": "관광지",
      "title": "해운대 해수욕장",
      "address": "부산광역시 해운대구",
      "longitude": 129.1604,
      "latitude": 35.1587,
      "thumbnail_image_url": "https://example.com/1.jpg",
      "visit_order": 1
    },
    {
      "content_id": "126509",
      "content_type": "관광지",
      "title": "동백섬",
      "address": "부산광역시 해운대구",
      "longitude": 129.1523,
      "latitude": 35.1521,
      "thumbnail_image_url": "https://example.com/2.jpg",
      "visit_order": 2
    }
  ]
}
```

---

## 4.3 게시글 작성

### `POST /api/posts`

| 항목           | 내용                                   |
| -------------- | -------------------------------------- |
| 목적           | 익명 게시글과 순서 있는 여행 코스 등록 |
| 요청 형식      | `application/json`                     |
| 성공 상태 코드 | `201 Created`                          |
| 실패 상태 코드 | `400`, `409`, `422`                    |
| 트랜잭션       | 게시글과 첨부 장소를 함께 저장         |

### 요청 필드

| 필드           | 타입     |   필수 | 설명                    | 검증                 |
| -------------- | -------- | -----: | ----------------------- | -------------------- |
| `category`     | string   |     예 | 게시글 카테고리         | 1~50자               |
| `title`        | string   |     예 | 제목                    | 1~200자              |
| `content`      | string   |     예 | 본문                    | 1자 이상             |
| `password`     | string   |     예 | 수정·삭제용 비밀번호    | 1~100자              |
| `location_ids` | string[] | 아니요 | 선택 순서대로 여행지 ID | 최대 10개, 중복 금지 |

### 요청 예시

```json
{
  "category": "여행 코스",
  "title": "부산 하루 여행 코스",
  "content": "해운대에서 시작하는 여행 코스입니다.",
  "password": "1234",
  "location_ids": ["126508", "126509", "126510"]
}
```

### 저장 규칙

|         배열 위치 | `visit_order` |
| ----------------: | ------------: |
| `location_ids[0]` |             1 |
| `location_ids[1]` |             2 |
| `location_ids[2]` |             3 |

### 성공 응답

| 필드      | 타입    | 설명             |
| --------- | ------- | ---------------- |
| `id`      | integer | 생성된 게시글 ID |
| `message` | string  | 처리 결과 메시지 |

```json
{
  "id": 13,
  "message": "게시글이 등록되었습니다."
}
```

### 오류 조건

| 상황                 | 상태 코드 | 오류 코드            |
| -------------------- | --------: | -------------------- |
| 중복 여행지 ID       |     `409` | `DUPLICATE_LOCATION` |
| 존재하지 않는 여행지 |     `400` | `LOCATION_NOT_FOUND` |
| 첨부 개수 초과       |     `422` | Pydantic 검증 오류   |
| 필수값 누락          |     `422` | Pydantic 검증 오류   |

---

## 4.4 게시글 수정

### `PUT /api/posts/{post_id}`

| 항목           | 내용                                          |
| -------------- | --------------------------------------------- |
| 목적           | 비밀번호 확인 후 게시글과 여행 코스 전체 수정 |
| 요청 형식      | `application/json`                            |
| 성공 상태 코드 | `200 OK`                                      |
| 실패 상태 코드 | `403`, `404`, `409`, `422`                    |
| 코스 수정 방식 | 기존 연결 삭제 후 요청 순서대로 재등록        |

### 요청 필드

| 필드           | 타입     |   필수 | 설명                 | 검증                 |
| -------------- | -------- | -----: | -------------------- | -------------------- |
| `category`     | string   |     예 | 게시글 카테고리      | 1~50자               |
| `title`        | string   |     예 | 제목                 | 1~200자              |
| `content`      | string   |     예 | 본문                 | 1자 이상             |
| `password`     | string   |     예 | 기존 수정용 비밀번호 | 1~100자              |
| `location_ids` | string[] | 아니요 | 수정된 코스 순서     | 최대 10개, 중복 금지 |

### 요청 예시

```json
{
  "category": "여행 코스",
  "title": "수정된 부산 여행 코스",
  "content": "수정된 게시글 내용입니다.",
  "password": "1234",
  "location_ids": ["126510", "126508"]
}
```

### 처리 순서

| 순서 | 처리                       |
| ---: | -------------------------- |
|    1 | 게시글 존재 확인           |
|    2 | 비밀번호 검증              |
|    3 | 여행지 ID 존재·중복 검증   |
|    4 | 게시글 필드 수정           |
|    5 | 기존 `post_locations` 삭제 |
|    6 | 새 순서대로 재등록         |
|    7 | `updated_at` 갱신          |
|    8 | 트랜잭션 커밋              |

### 성공 응답

```json
{
  "id": 12,
  "message": "게시글이 수정되었습니다.",
  "updated_at": "2026-07-14T10:30:00"
}
```

### 비밀번호 오류 응답

```json
{
  "detail": {
    "code": "INVALID_PASSWORD",
    "message": "수정용 비밀번호가 일치하지 않습니다."
  }
}
```

---

## 4.5 게시글 삭제

### `DELETE /api/posts/{post_id}`

| 항목           | 내용                         |
| -------------- | ---------------------------- |
| 목적           | 비밀번호 확인 후 게시글 삭제 |
| 요청 형식      | `application/json`           |
| 성공 상태 코드 | `204 No Content`             |
| 실패 상태 코드 | `403`, `404`                 |
| 연관 데이터    | `post_locations` 자동 삭제   |

### 요청 필드

| 필드       | 타입   | 필수 | 설명                 |
| ---------- | ------ | ---: | -------------------- |
| `password` | string |   예 | 수정·삭제용 비밀번호 |

### 요청 예시

```json
{
  "password": "1234"
}
```

### 성공 응답

```http
204 No Content
```

### 오류 조건

| 상황            | 상태 코드 | 오류 코드          |
| --------------- | --------: | ------------------ |
| 게시글 없음     |     `404` | `POST_NOT_FOUND`   |
| 비밀번호 불일치 |     `403` | `INVALID_PASSWORD` |

---

# 5. 챗봇 API

## `POST /api/chat`

| 항목           | 내용                                             |
| -------------- | ------------------------------------------------ |
| 목적           | 제공 여행지 데이터와 게시글 기반 자연어 질의응답 |
| 요청 형식      | `application/json`                               |
| 성공 상태 코드 | `200 OK`                                         |
| 실패 상태 코드 | `422`, `503`                                     |
| 대화 저장      | DB 영구 저장하지 않음                            |
| 히스토리       | 프론트에서 최근 메시지 전달                      |

### 요청 필드

| 필드                | 타입   |   필수 | 설명             | 검증                |
| ------------------- | ------ | -----: | ---------------- | ------------------- |
| `message`           | string |     예 | 사용자 질문      | 1~1000자            |
| `history`           | array  | 아니요 | 이전 대화 목록   | 최대 20개 권장      |
| `history[].role`    | string |     예 | 메시지 작성 주체 | `user`, `assistant` |
| `history[].content` | string |     예 | 메시지 내용      | 최대 길이 제한 권장 |

### 요청 예시

```json
{
  "message": "해운대 근처 여행지 세 곳을 추천해줘",
  "history": [
    {
      "role": "user",
      "content": "부산 여행지를 찾고 있어"
    },
    {
      "role": "assistant",
      "content": "어떤 유형의 장소를 찾으시나요?"
    }
  ]
}
```

### 응답 필드

| 필드                                | 타입    | 설명                 |
| ----------------------------------- | ------- | -------------------- |
| `answer`                            | string  | 챗봇 답변            |
| `references`                        | object  | 답변에 활용된 데이터 |
| `references.locations`              | array   | 관련 여행지          |
| `references.locations[].content_id` | string  | 여행지 ID            |
| `references.locations[].title`      | string  | 여행지명             |
| `references.posts`                  | array   | 관련 게시글          |
| `references.posts[].id`             | integer | 게시글 ID            |
| `references.posts[].title`          | string  | 게시글 제목          |

### 응답 예시

```json
{
  "answer": "해운대 주변에서는 동백섬, 달맞이길, 블루라인파크를 추천합니다.",
  "references": {
    "locations": [
      {
        "content_id": "126509",
        "title": "동백섬"
      },
      {
        "content_id": "126510",
        "title": "달맞이길"
      }
    ],
    "posts": []
  }
}
```

### 오류 조건

| 상황                | 상태 코드 | 오류 코드                     |
| ------------------- | --------: | ----------------------------- |
| 질문 누락·길이 초과 |     `422` | Pydantic 검증 오류            |
| OpenAI API 실패     |     `503` | `CHAT_SERVICE_UNAVAILABLE`    |
| API 키 미설정       |     `503` | `CHAT_SERVICE_NOT_CONFIGURED` |

---

# 6. 공통 오류 응답

| 필드             | 타입   | 설명                        |
| ---------------- | ------ | --------------------------- |
| `detail`         | object | 오류 상세                   |
| `detail.code`    | string | 클라이언트 처리용 오류 코드 |
| `detail.message` | string | 사용자 표시용 메시지        |

```json
{
  "detail": {
    "code": "POST_NOT_FOUND",
    "message": "게시글을 찾을 수 없습니다."
  }
}
```

## 공통 상태 코드

|                  상태 코드 | 의미                            | 사용 예                          |
| -------------------------: | ------------------------------- | -------------------------------- |
|                   `200 OK` | 정상 조회·수정                  | 목록, 상세, 수정                 |
|              `201 Created` | 생성 성공                       | 게시글 작성                      |
|           `204 No Content` | 삭제 성공                       | 게시글 삭제                      |
|          `400 Bad Request` | 요청 의미 오류                  | 좌표 경계 오류, 없는 여행지 첨부 |
|            `403 Forbidden` | 권한 확인 실패                  | 비밀번호 불일치                  |
|            `404 Not Found` | 대상 없음                       | 게시글·여행지 없음               |
|             `409 Conflict` | 데이터 충돌                     | 여행지 중복 첨부                 |
| `422 Unprocessable Entity` | 입력 형식 검증 실패             | 필수값 누락, 길이 초과           |
|  `503 Service Unavailable` | 외부 서비스 또는 서버 기능 불가 | 챗봇 API 실패                    |

---

# 7. API와 화면 기능 매핑

| 화면 기능           | API                                      | 사용 데이터                |
| ------------------- | ---------------------------------------- | -------------------------- |
| 여행지 지도 핀 표시 | `GET /api/locations`                     | 좌표, 이름, 카테고리       |
| 지도 검색           | `GET /api/locations?q=...`               | 이름·주소 검색 결과        |
| 지도 카테고리 필터  | `GET /api/locations?content_type=...`    | 카테고리별 여행지          |
| 현재 지도 범위 목록 | `GET /api/locations?min_lat=...`         | 지도 경계 내 여행지        |
| 카테고리 필터 목록  | `GET /api/locations/categories`          | 카테고리명, 건수           |
| 여행지 상세 패널    | `GET /api/locations/{content_id}`        | 상세 주소, 이미지 등       |
| 관련 게시글         | `GET /api/locations/{content_id}/posts`  | 게시글 최대 3개            |
| 근처 여행지         | `GET /api/locations/{content_id}/nearby` | 거리순 3~5개               |
| 게시글 목록         | `GET /api/posts`                         | 제목, 조회수, 작성일       |
| 제목 옆 핀 `+N`     | `GET /api/posts`                         | `location_count`           |
| 배지 툴팁           | `GET /api/posts`                         | `location_preview`         |
| 게시글 상세 코스    | `GET /api/posts/{post_id}`               | 순서 있는 여행지 배열      |
| 게시글 작성         | `POST /api/posts`                        | 게시글과 `location_ids`    |
| 게시글 수정         | `PUT /api/posts/{post_id}`               | 비밀번호와 수정 데이터     |
| 게시글 삭제         | `DELETE /api/posts/{post_id}`            | 비밀번호                   |
| 챗봇 위젯           | `POST /api/chat`                         | 질문, 대화 이력, 참조 정보 |
