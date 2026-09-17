# 선생님이 직접 해 주셔야 하는 설정

개발자가 대신 할 수 없는 부분만 모았습니다. 처음 한 번만 하면 됩니다.
**요금제는 Spark(무료) 그대로 두세요.** 이 앱은 무료 범위 안에서만 동작하도록 만들었습니다.

## 1. Firebase 프로젝트 만들기 (약 5분)

1. `dongssam2021@gmail.com` 으로 <https://console.firebase.google.com> 에 들어갑니다.
2. **프로젝트 만들기** → 이름은 `dongssam-tycoon` 처럼 이 앱 전용으로 짓습니다.
   (다른 수업 앱과 섞이지 않게 반드시 새로 만듭니다.)
3. Google 애널리틱스는 **사용 안 함** 으로 두셔도 됩니다.

## 2. 필요한 기능 켜기

| 메뉴 | 할 일 |
| --- | --- |
| 빌드 → Authentication | **시작하기** → 로그인 방법에서 **Google** 사용 설정 (선생님 로그인용) |
| 빌드 → Authentication | 같은 화면에서 **이메일/비밀번호** 도 사용 설정 (학생 로그인용) |
| 빌드 → Firestore Database | **데이터베이스 만들기** → 위치 `asia-northeast3 (서울)` → **프로덕션 모드** |
| 빌드 → Hosting | **시작하기** (안내는 넘기고 만들기만 하면 됩니다) |

> Firestore 를 "프로덕션 모드"로 만드는 게 맞습니다. 이 앱의 규칙 파일을
> 배포하면 그 규칙이 적용됩니다.

## 3. 웹 앱 등록하고 설정값 복사

1. 프로젝트 설정(톱니바퀴) → **내 앱** → **웹(</>)** 추가 → 이름은 아무거나.
2. 화면에 나오는 `apiKey`, `authDomain`, `projectId` 등 6개 값을 복사합니다.
3. 개발자에게 전달하거나, 저장소 Secrets 에 직접 등록합니다(아래 5번).

## 4. 서비스 계정 키 만들기 (배포·시세 자동 갱신용)

1. 프로젝트 설정 → **서비스 계정** → **새 비공개 키 생성** → JSON 파일이 받아집니다.
2. 이 파일은 **비밀번호와 같습니다.** 메일·메신저로 보내지 말고, 아래 Secrets 에만 넣습니다.

## 5. GitHub 저장소 Secrets 등록

저장소 → Settings → Secrets and variables → Actions → **New repository secret**

| 이름 | 값 |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_TYCOON` | 4번에서 받은 JSON 파일 내용 전체 |
| `TYCOON_FIREBASE_PROJECT_ID` | 예: `dongssam-tycoon` |
| `TYCOON_FIREBASE_API_KEY` | 3번의 apiKey |
| `TYCOON_FIREBASE_AUTH_DOMAIN` | 3번의 authDomain |
| `TYCOON_FIREBASE_STORAGE_BUCKET` | 3번의 storageBucket |
| `TYCOON_FIREBASE_MESSAGING_SENDER_ID` | 3번의 messagingSenderId |
| `TYCOON_FIREBASE_APP_ID` | 3번의 appId |
| `TYCOON_CLASS_ID` | (8단계 주식 기능을 쓸 때) 운영 중인 학급 ID |

여기까지 하면 `tycoon/` 폴더가 바뀔 때마다 자동으로 배포됩니다.

## 6. 규칙과 인덱스 배포

개발자가 아래 명령으로 한 번 올려 두면 됩니다.

```bash
cd tycoon
npx firebase use --add            # 위에서 만든 프로젝트 선택
npx firebase deploy --only firestore
```

## 7. 첫 수업 준비

1. 배포된 주소에 접속 → **선생님으로 들어가기** → Google 로그인
2. 학급 이름을 넣고 **학급 만들기** → 6자리 학급 코드가 나옵니다
3. **학생 명단 등록** → 번호와 이름을 붙여넣기 → 등록
4. **로그인 카드 인쇄** → 잘라서 학생들에게 나눠 줍니다
5. 대통령 콘솔에서 **국고 발행** 으로 시작 자금을 만듭니다 (예: 200,000코인)

## 자주 묻는 것

**Q. 학생이 PIN을 잊었어요.**
명단 화면에서 그 학생의 **PIN 초기화** 를 누르면 새 PIN 이 나옵니다.
학생은 새 PIN 으로 다시 로그인하면 되고, 잔액과 거래내역은 그대로 남습니다.

**Q. 학생이 PIN을 바꿨는데 화면에는 예전 PIN이 보여요.**
맞습니다. 학생이 스스로 바꾼 PIN 은 선생님도 볼 수 없습니다. 초기화해 주세요.

**Q. 돈이 이상하게 늘거나 줄 수 있나요?**
없습니다. 모든 계정 잔액의 합은 항상 0 이고, 통화량은 선생님이 발행한 만큼입니다.
`npx tsx scripts/verify-ledger.ts <학급ID>` 로 언제든 확인할 수 있습니다.
