# 🗺️ LocalHub Frontend

> 여행지 기반 코스 공유 커뮤니티 서비스 Frontend

## 📖 프로젝트 소개

**LocalHub**는 공공 관광 데이터를 활용하여 여행지를 지도에서 탐색하고,
여러 여행지를 하나의 여행 코스로 구성하여 익명으로 공유할 수 있는 웹 서비스입니다.

사용자는 여행지를 검색하고 지도를 통해 위치를 확인할 수 있으며,
여러 장소를 순서대로 선택하여 자신만의 여행 코스를 작성하고 다른 사용자들과 공유할 수 있습니다.

또한 각 여행지에서는 관련 게시글과 근처 여행지를 함께 확인할 수 있어
여행 계획을 더욱 쉽게 세울 수 있도록 지원합니다.

---

## ✨ 주요 기능

### 🗺️ 여행지 탐색

- 여행지 지도 시각화
- 여행지 검색
- 카테고리별 필터
- 현재 지도 영역의 여행지 목록 조회

### 📍 여행지 상세

- 여행지 상세 정보 조회
- 관련 게시글 조회
- 근처 여행지 추천

### 📝 여행 코스 공유

- 익명 게시글 작성
- 여러 여행지 첨부
- 여행지 순서 지정
- 코스 지도 시각화

### 🤖 AI 챗봇

- 여행지 정보 질의응답
- 여행지 추천
- 관련 게시글 안내

---

# 🖥️ Frontend

Frontend는 **Vue 3** 기반 SPA(Single Page Application)로 구현되었습니다.

지도 기반 UX를 중심으로 여행지 탐색과 게시글 작성을 자연스럽게 연결하는 것을 목표로 하였습니다.

### 주요 역할

- 여행지 지도 시각화
- 게시글 CRUD 화면
- 여행지 검색 및 필터
- 여행 코스 작성 UI
- 챗봇 UI
- FastAPI REST API 연동

---

## 🛠 Tech Stack

| Category    | Tech       |
| ----------- | ---------- |
| Framework   | Vue 3      |
| Build Tool  | Vite       |
| Language    | JavaScript |
| Routing     | Vue Router |
| State       | Pinia      |
| HTTP Client | Axios      |
| Map         | KakaoMap   |
| Styling     | CSS3       |

---

## 📂 프로젝트 구조

```text
src
├── assets
├── components
│   ├── common
│   ├── post
│   ├── map
│   └── chat
├── layouts
├── router
├── services
├── stores
├── views
├── App.vue
└── main.js
```

---

## 📱 주요 화면

- Home
- 게시글 목록
- 게시글 작성
- 게시글 상세
- 게시글 수정
- 여행지 지도
- 챗봇

---

## 🔄 화면 흐름

```text
Home
   │
   ├── 게시판
   │      ├── 게시글 목록
   │      ├── 게시글 작성
   │      └── 게시글 상세
   │
   └── 여행지 지도
          │
          ├── 여행지 목록
          ├── 여행지 상세
          ├── 관련 게시글
          └── 근처 여행지
```

---

## 🌐 Backend API

Frontend는 FastAPI 기반 REST API와 통신합니다.

주요 API

- 여행지 조회
- 게시글 CRUD
- 근처 여행지 조회
- 관련 게시글 조회
- AI 챗봇

---

## 👥 Team

Frontend

- 지도 UI
- 게시글 UI
- 여행 코스 작성
- API 연동
- 챗봇 UI
