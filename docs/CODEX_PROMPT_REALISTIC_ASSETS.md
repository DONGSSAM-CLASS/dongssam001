# Codex 작업 지시서 — SUPERSTAR KART 실사풍 에셋 교체

> 아래 "복사해서 붙여넣기" 블록 전체를 Codex에 그대로 입력하세요.
> 저장소 루트에 `AGENTS.md`가 있으므로 Codex가 자동으로 함께 읽습니다.

---

## 복사해서 붙여넣기

```text
너는 이 저장소의 웹 3D 카트 레이싱 게임 "SUPERSTAR KART"(superstar-kart.html)를 이어서 개발한다.
목표: 지금 코드로 만든 캐릭터·카트·환경을 "실제 카트라이더 같은" 고품질 실사풍(stylized-realistic) 에셋으로 교체한다.
2D 이미지는 GPT Image(gpt-image-2)로 만들고, 3D 모델은 그 이미지를 기준으로 만든다.

## 0단계 — 파악 (코드 수정 전)
1. AGENTS.md, docs/SPEC_ORIGINAL.md, docs/CODE_MAP.md, docs/GPT_IMAGE_PROMPTS.md를 읽는다.
2. `cd tests && npm install && npx playwright install chromium && node e2e.mjs desktop && node e2e.mjs mobile`를 실행해 현재 PASS를 확인한다.
3. screenshots/ 폴더의 현재 화면을 보고, 무엇을 교체할지 목록을 만든다.

## 1단계 — 에셋 로더와 폴백 (게임 동작은 그대로)
1. 단일 HTML을 유지하되 외부 에셋 폴더 `assets/`를 쓴다. 에셋 경로 목록은 `assets/prompts.json`의 `file` 필드를 따른다.
2. `assets/manifest.json`을 만들고 실제로 존재하는 파일만 적는다 (portraits, items, ults, textures, liveries, models).
3. 로딩 화면(startLoading)의 단계에 "에셋 불러오는 중..."을 추가하고 THREE.TextureLoader, GLTFLoader(+ DRACOLoader 또는 MeshoptDecoder)로 병렬 로드한다. 진행률을 기존 프로그레스 바에 반영한다.
4. 모든 로드는 실패해도 에러 없이 기존 절차적 생성으로 대체한다. manifest가 없거나 file://로 열어 fetch가 막혀도 지금처럼 동작해야 한다.
5. README와 AGENTS.md에 로컬 서버 실행법(`npx http-server . -p 8080 -c-1`)을 적는다.

## 2단계 — GPT Image로 2D 에셋 생성
1. `cd tools && npm install`, 환경 변수 OPENAI_API_KEY를 확인한다 (키는 절대 커밋하지 않는다).
2. 먼저 `node generate-images.mjs --dry`로 목록을 확인하고, 캐릭터 초상화(`--only char_`)부터 만든다.
   - 스크립트는 같은 캐릭터의 portrait가 있으면 fullbody/turnaround/driving을 만들 때 참조 이미지로 넣어 얼굴과 의상을 맞춘다.
   - 모델 이름·파라미터가 API와 다르면 스크립트를 고친다 (IMAGE_MODEL 환경 변수로도 바꿀 수 있다).
3. 결과를 직접 확인하고 품질 기준에 못 미치면 프롬프트를 고쳐 다시 만든다.
   - 역사 고증: 익선관·곤룡포(세종), 두정갑·투구·상모(이순신), 쪽머리·비녀(신사임당), 1919년 흰 저고리·검은 치마와 태극기(유관순) 등이 docs/GPT_IMAGE_PROMPTS.md와 일치하는지 확인한다.
   - 10명의 그림체·조명·비율이 한 게임처럼 통일돼야 한다.
   - 텍스처는 이음새 없이 반복돼야 한다 (타일 2×2로 붙여 보고 확인).
   - 기존 게임의 캐릭터·로고를 베낀 결과는 버린다.
4. 게임용으로 가공한다: 투명 여백 잘라내기, 초상화 512px·아이콘 256px·텍스처 1024px로 줄이기, WebP(투명은 PNG 또는 WebP alpha)로 압축. 원본은 assets/ref/에 남긴다.

## 3단계 — 2D 에셋 적용
- 초상화: makePortraits() 결과 대신 assets/ui/portraits/<id>.(png|webp)를 선택 카드·로딩·순위표·결과표에 쓴다.
- 유물 아이콘 4종, 필살기 아이콘 10종: HUD 아이템 슬롯·토스트·⚡ 버튼에 이미지로 표시 (이모지는 alt 텍스트로 유지).
- 로고, 코스 카드(beach/palace), 메뉴 배경을 적용한다.
- 텍스처: T_.asphalt, T_.curb, T_.sand, T_.grass, T_.pave, T_.granite, T_.roofTile, T_.dancheong, T_.lattice, T_.bark, T_.frond, T_.pineBark를 이미지 텍스처로 교체한다. 도로의 흰 차선·중앙 점선은 계속 코드로 덧그린다. colorSpace=SRGBColorSpace, anisotropy, repeat 값을 기존과 맞춘다.
- 카트 도장: assets/textures/livery/<id>.png를 kartMats(ch).paint의 map으로 쓰고 clearcoat는 유지한다.

## 4단계 — 실사풍 3D 모델 (가장 큰 작업)
GPT Image는 2D만 만든다. 3D 모델은 turnaround/ortho 시트를 입력으로 이미지→3D 도구(예: Meshy, Tripo, Hunyuan3D, Rodin 등)나 Blender로 만든다.
어떤 도구를 쓸지는 사용자에게 먼저 확인하고, 도구를 쓸 수 없으면 절차적 모델의 형태·머티리얼 품질을 올리는 방향으로 대신 진행한다.

모델 규격:
- 형식 glTF 2.0 바이너리(.glb), Draco 또는 meshopt 압축, PBR(metallic-roughness) 텍스처 최대 1024px.
- 좌표: +Z가 앞, +Y가 위, 1유닛 = 1m, 원점은 차량 바닥 중앙.
- 카트: 길이 3.0~4.0, 폭 1.7~2.4. 삼각형 15k 이하. 노드 이름 wheel_FL, wheel_FR, wheel_RL, wheel_RR(회전축 X, 각 바퀴 중심이 원점), steer_FL/steer_FR(앞바퀴 조향 피벗), exhaust_*(부스터 불꽃 위치 빈 노드), seat(운전자 위치 빈 노드), paint(캐릭터 색을 입힐 차체 머티리얼 이름).
- 운전자: 키 약 1.5(2등신), 삼각형 12k 이하. 노드 이름 head(좌우 회전 피벗), arms(핸들 조향 피벗), torso. 앉은 자세로 모델링하거나 앉은 자세 포즈를 적용한다.
- 저장 위치: assets/models/karts/<kartId>.glb, assets/models/drivers/<charId>.glb.
- 전체 에셋 합계 25MB 이하 목표 (모바일 로딩 시간 고려).

코드 연결:
- buildKartBody(kid, ch)와 buildDriver(ch, kd)가 GLB가 로드돼 있으면 SkeletonUtils.clone으로 복제해 쓰고, 없으면 기존 코드로 만든다.
- buildKartBody의 반환 형식 { g, wheels:[{spin,R}], fronts:[mount], flames:[] }와 buildDriver의 userData.head/arms/torso를 그대로 유지해 updateKartVisual·미리보기·시상대가 수정 없이 동작하게 한다.
- 이름표 높이(KARTS[].tag)와 좌석(seat), 핸들(wheel) 위치를 모델에 맞게 조정한다.
- GLB 머티리얼은 envMap 반사가 보이도록 MeshStandard/Physical로 두고 castShadow를 켠다.

## 5단계 — 환경 실사화 (선택, 시간 남으면)
- 경복궁: 전각·광화문·경회루를 GLB로 교체하거나, 지금의 곡선 기와지붕 지오메트리에 생성한 텍스처(기와·단청·창살·석재)를 입힌다.
- 선셋 비치: 야자수·파라솔·등대를 GLB 또는 텍스처로 개선한다.
- 성능: 모바일에서 30fps 이상을 목표로, 정적 메시는 기존 mergeInPlace로 합치고 반복 오브젝트는 InstancedMesh를 쓴다.

## 바꾸면 안 되는 것
- docs/SPEC_ORIGINAL.md의 게임 규칙: 캐릭터 10명과 필살기, 유물 4종, 난이도 3단계 계수, 3랩, 8인, HUD 구성, 키 조작, 한국어 UI.
- 물리·AI·아이템 로직 (stepKart, aiControl, useItem, useUlt …). 외형만 바꾼다.

## 완료 기준 (전부 확인하고 보고)
1. tests/e2e.mjs desktop·mobile 모두 PASS, 콘솔 에러 0.
2. 에셋 폴더를 지워도 게임이 기존 절차적 모델로 끝까지 동작한다.
3. 로컬 서버로 열면 초상화·아이콘·텍스처·(가능하면) GLB 모델이 적용된다.
4. 선택 화면·레이스·결과 화면의 전후 비교 스크린샷을 tests/out/에 남기고 보고서에 첨부한다.
5. 어떤 이미지가 몇 번 재생성됐는지, 어떤 모델이 아직 절차적 폴백인지 목록으로 보고한다.
6. API 키·개인 정보가 커밋에 들어가지 않았다.
```

---

## 참고: 단계별로 나눠서 시킬 때

한 번에 너무 크면 Codex에 이렇게 나눠서 요청하세요.

1. "0~1단계만 해 줘. 에셋 로더와 폴백까지 만들고 테스트 통과를 확인해."
2. "2단계: 캐릭터 초상화 10장만 먼저 생성해서 보여 줘."
3. "3단계: 생성된 2D 에셋을 전부 게임에 적용해."
4. "4단계: 카트 1종(레이싱 카트)과 캐릭터 1명(세종대왕)만 GLB로 시범 적용해."
5. 결과를 보고 나머지로 확장.
