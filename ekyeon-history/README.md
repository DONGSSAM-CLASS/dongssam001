# 에듀테크 교사 연구회 역사연구팀 웹사이트

> EDUTECH TEACHERS · HISTORY RESEARCH TEAM
>
> 전국 단위 에듀테크 교육 연구자 모임 **‘에듀테크 교사 연구회(에크연)’의 스핀오프 연구회**이자,
> **교육부 역사교사학습공동체**입니다.

역사 수업을 함께 연구하고, 함께 만든 것을 남기기 위한 연구팀 공식 웹사이트입니다.
본원 사이트(<https://edutech-teachers.web.app>)와 같은 디자인 체계·인증 구조를 씁니다.

- 프런트: React 18 + Vite + React Router v6
- 디자인: Tailwind CSS 3.4 + daisyUI(dark 고정) + Pretendard + lucide-react
- 백엔드: Firebase Authentication + Cloud Firestore + Firebase Hosting
- QR: `qrcode` 패키지로 캔버스에 직접 그림(외부 QR API 호출 없음)
- **Cloud Functions·Cloud Storage 를 쓰지 않으므로 Spark(무료) 요금제에서 그대로 동작합니다.**
- 이미지·영상·파일은 업로드가 아니라 외부 공유 URL 링크로 연결합니다.

---

## 1. 빠른 시작

```bash
npm install
cp .env.example .env            # Firebase 웹 앱 설정값 채우기
cp .firebaserc.example .firebaserc
npm run dev                     # http://localhost:5173
```

`.env` 가 비어 있어도 화면은 뜹니다(회원 기능만 비활성화 상태로 안내됩니다).

## 2. 화면 구성

| 경로 | 메뉴 | 내용 |
| --- | --- | --- |
| `/` | 홈 | 정체성 히어로 · 4개 공간 카드 · 최근 수업 기록 3건 · 웹앱 하이라이트 · 협업 안내 |
| `/about` | 소개 공간 | 연구팀 소개, 하는 일 4가지, 공식 노션 링크 카드 |
| `/lessons` | 수업 공간 | 수업 나눔·수업 공개 실적 등록과 연도별 누적 목록 |
| `/dev` | 개발 공간 | 비밀번호 게이트 후 구글 드라이브 폴더 연결 |
| `/webapps` | 개발 웹앱 | 웹앱 갤러리 8건 + 전면 QR 송출 |
| `/collaborate` | 협업 요청 | 협업 유형·절차 안내와 요청 양식(메일/복사) |
| `/signup` `/login` `/pending` | — | 회원가입 · 로그인 · 승인 대기 |
| `/admin/login` `/admin/approve` `/admin` | — | 관리자 2단계 로그인 · 승인 · 운영 도구 |

## 3. 회원 유형 3종

| 유형 | 권한 |
| --- | --- |
| `staff` 운영진 | 모든 수업 기록·웹앱 관리, 운영 도구 접근 |
| `member` 연구팀 교사 | 본인 수업 기록 등록·수정·삭제 |
| `guest` 참관 회원 | 읽기 전용 |

- 가입 신청은 **언제나 `status: 'pending'`** 으로만 만들어집니다.
- 가입 화면에서는 `member` 와 `guest` 만 고를 수 있고, `staff` 승격은 운영 도구에서만 가능합니다.
- 이 제약은 UI가 아니라 `firestore.rules` 가 집행합니다.

## 4. 데이터 구조

```text
members/{uid}       uid, email, displayName, school, region, subject, intro,
                    memberType('staff'|'member'|'guest'), status, role, createdAt, updatedAt
admins/{uid}        adminId, verifiedUntil, lastApprovedAt, lastApprovedBy
adminSessions/{id}  uid, adminId, status, requestedAt, userAgent, approvedAt, approvedBy
lessons/{id}        type, title, schoolLevel, grade, unit, summary, body, lessonDate,
                    link, thumbnailUrl, tags[], published, ownerUid, authorName,
                    createdAt, updatedAt
webapps/{id}        title, description, url, tags[], order, group, published,
                    createdAt, updatedAt
collabRequests/{id} category, orgName, contactName, contactInfo, schedule,
                    audience, message, createdAt   ← 운영진만 읽기
stats/{id}          key, date, page, count, updatedAt
```

웹앱 8건은 `src/data/webapps.js` 에 상수로 들어 있습니다.
Firestore `webapps` 에 데이터가 없으면 이 상수를 그대로 보여 주고, 있으면 Firestore 쪽을 씁니다.
운영 도구의 **[시드 8건 불러오기]** 버튼으로 상수를 Firestore 에 한 번에 등록할 수 있습니다.

## 5. 보안 규칙 요약

- `admins/{uid}` 는 클라이언트에서 **생성·삭제 불가**(Firebase 콘솔에서만 생성)
- 관리자 작업은 `admins/{uid}.verifiedUntil > request.time` 일 때만 허용(메일 2단계 승인)
- 가입 문서는 `status: 'pending'`, `role: 'member'` 로만 생성 가능
- `lessons` 쓰기는 승인된 `member`·`staff` 만, 수정·삭제는 `ownerUid` 본인 또는 운영진만
- 작성자는 `ownerUid`·`authorName` 을 바꿀 수 없음(공개 여부는 본인도 변경 가능)
- `published == false` 인 글은 비로그인·타인 조회에서 제외
- `collabRequests` 는 create 만 공개, 읽기는 운영진만

> 오류가 난다고 규칙을 느슨하게 바꾸지 마세요. `allow read, write: if true` 는 쓰지 않습니다.

## 6. 환경변수

`.env.example` 을 복사해 `.env` 로 만들고 Firebase 콘솔 값을 채웁니다. `.env` 는 Git에 올리지 않습니다.

주요 값
- `VITE_DEV_SPACE_PASSCODE` 개발 공간 비밀번호(기본 `2026`)
- `VITE_CONTACT_EMAIL` 문의·협업 메일(`dongssam94@gmail.com`)
- `VITE_ADMIN_APPROVER_EMAIL` 관리자 2단계 승인 메일(`dongssam94@gmail.com`)
- `VITE_NOTIFICATION_WEBHOOK_URL` Google Apps Script 웹훅(비우면 건너뜀)
- `VITE_NOTION_ABOUT_URL`, `VITE_DEV_DRIVE_URL`, `VITE_PARENT_SITE_URL`

## 7. 명령

```bash
npm run dev             # 개발 서버
npm run build           # 프로덕션 빌드
npm run preview         # 빌드 결과 확인
npm run deploy:hosting  # 화면만 배포
npm run deploy:rules    # 규칙·색인 배포
npm run deploy          # 전체 배포
```

## 8. 배포 전 콘솔 작업

Firebase 프로젝트 생성부터 관리자 계정 만들기까지는 **직접 콘솔에서 눌러야 합니다.**
단계별 메뉴 경로는 [`HANDOFF.md`](./HANDOFF.md) 9장을 그대로 따라 하세요.

## 9. 지켜야 할 조건

1. 콘솔에서 직접 해야 하는 작업은 우회하지 않고 멈춘 뒤 안내합니다.
2. **결제 계정을 연결하지 않습니다.** Cloud Functions·유료 Storage 등 Blaze 전제 기능은 넣지 않습니다.
3. 오류가 나도 `firestore.rules` 를 느슨하게 바꾸지 않습니다.
4. 링크·비밀번호·메일 주소는 오타 없이 그대로 유지합니다.
5. 확인되지 않은 이력·실적은 싣지 않습니다.
