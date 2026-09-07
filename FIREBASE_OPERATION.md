# Firebase Hosting 개인정보 보호 운영 안내

## 운영 원칙

- 이 앱은 Firebase Hosting으로 정적 파일만 제공합니다.
- Firebase SDK, Authentication, Firestore, Analytics를 사용하지 않습니다.
- 학생의 답변과 학습 기록은 브라우저 `localStorage`에만 저장됩니다.
- 앱 코드에는 외부 전송 기능이 없습니다.
- 별명은 선택용 화면 이름이며 실명, 학번, 학교명, 연락처를 입력받지 않습니다.

## 반드시 고지할 사항

앱은 학생 입력값을 서버로 보내지 않습니다. 다만 Firebase Hosting은 서비스 제공과 악용 방지를 위해 접속 IP 등 웹 요청 로그를 처리할 수 있습니다. 운영자는 이 로그를 학생 평가, 추적, 프로파일링 목적으로 사용하지 않습니다.

Firebase Hosting 요청 로그의 기본 보관과 이용 방식은 Firebase 공식 개인정보 안내를 따릅니다. 학교의 개인정보 처리방침에는 이 사실과 담당자 연락처를 반영합니다.

## 배포 전 점검

1. Firebase Console에서 이 수업 전용 프로젝트를 선택하거나 만듭니다.
2. 프로젝트에는 Hosting만 사용합니다. Authentication, Firestore, Realtime Database, Analytics, Functions, Cloud Run은 사용 설정하지 않습니다.
3. Console의 IAM 권한은 배포 담당자에게만 최소한으로 부여합니다.
4. `firebase.json`의 `public` 값이 `public`인지 확인합니다.
5. `firebase.json`의 CSP에 `connect-src 'none'`이 있는지 확인합니다.
6. 소스에서 외부 요청과 개인정보 입력 필드가 없는지 확인합니다.

## 최초 연결과 배포

`PROJECT_ID`는 수업 전용 Firebase 프로젝트 ID로 바꿉니다.

```powershell
firebase use --add PROJECT_ID
firebase deploy --only hosting
```

`firebase use --add`가 `.firebaserc`의 빈 기본 프로젝트를 실제 ID로 설정합니다. 이 파일은 프로젝트 설정이므로 저장소에 함께 관리합니다.

## 배포 후 확인

```powershell
curl.exe -I https://PROJECT_ID.web.app
curl.exe -I http://PROJECT_ID.web.app
```

- HTTPS 응답에 CSP, `Referrer-Policy`, `Permissions-Policy`가 있어야 합니다.
- HTTP 주소는 HTTPS 주소로 이동해야 합니다.
- `web.app` 기본 도메인의 HSTS 값은 Firebase Hosting이 관리합니다. 연결한 맞춤 도메인에는 설정한 HSTS가 적용되는지 확인합니다.
- 개발자 도구 Network에서 외부 요청과 Analytics 요청이 없는지 확인합니다.
- 여러 학생 기기에서 같은 답변이 공유되지 않는지 확인합니다.

## 운영과 변경 관리

- 정식 배포 전에는 `firebase hosting:channel:deploy 검토용`으로 미리보기 URL을 검토합니다.
- 배포 담당자는 Hosting의 출시 이력과 웹 요청 로그 접근 권한을 최소 인원으로 제한합니다.
- 학생 기록은 교사 PC나 Firebase에 모으지 않습니다. 수업 후 각 기기에서 앱의 초기화 기능을 사용하면 로컬 기록이 삭제됩니다.
- Firebase Console에서 Analytics 또는 다른 데이터 수집 제품을 임의로 추가하지 않습니다.
- 개인정보 처리방침과 Firebase의 데이터 처리 조건은 학기 시작 전 다시 확인합니다.

## 사고 대응

실수로 Firebase 데이터 제품이나 분석 도구를 연결했다면 즉시 배포를 중지하고 해당 제품의 수집을 끈 뒤, 관련 데이터와 로그 범위를 확인합니다. 학생 입력값이 전송된 정황이 있으면 학교의 개인정보 보호 책임자 절차에 따라 안내하고 조치합니다.
