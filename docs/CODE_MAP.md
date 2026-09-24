# CODE_MAP — `superstar-kart.html` 구조

줄 번호는 커밋 `1469540` 기준의 대략적인 위치입니다. 함수 이름으로 검색하세요.

## HTML/CSS (1~330줄)
- `#gl` 메인 WebGL 캔버스, `#fx` 속도선 오버레이, `#boostVig` 부스터 비네트
- 화면 섹션: `#scrTitle` → `#scrChar` → `#scrKart` → `#scrLoad` → `#hud`(레이스) → `#scrResult`, 일시정지 `#pauseOv`
- 3D 미리보기 무대: `#charStage`, `#kartStage` (미리보기 캔버스 `#pvHost`를 두 무대 사이에서 옮겨 붙임)

## JS 모듈 (330줄~)

| 구역 | 주요 함수 / 상수 | 역할 |
|---|---|---|
| 데이터 | `CHARS`, `KARTS`, `TRACKS`, `DIFFS`, `ITEMS`, `TIPS` | 캐릭터 능력치·필살기·의상 색, 카트 보정치·좌석 위치, 트랙 제어점·하늘 설정, 난이도 계수 |
| 렌더러 | `renderer`, `composer`, `bloom`, `sun`, `hemi` | ACES 톤매핑, PCF 소프트 그림자, 블룸 |
| 하늘 | `skyMaterial`, `applySky`, `focusSun` | 그라데이션 하늘 셰이더, 하늘로 PMREM 환경맵 생성, 그림자 카메라가 플레이어를 따라감 |
| 텍스처 | `ctex`, `T_` (asphalt, curb, sand, pave, granite, roofTile, dancheong, lattice, frond, waterN, taeguk, fleur …), `numberTex`, `nameTagTex` | 전부 CanvasTexture로 생성. **실사풍 교체 시 여기부터 이미지 파일로 바꾸면 됨** |
| 헬퍼 | `S`, `smat`, `texMat`, `rbox`, `rod`, `limb`, `tube`, `sideExtrude`, `taperX`, `disposeTree`, `mergeInPlace` | 머티리얼 캐시, 지오메트리 헬퍼, 메시 병합 |
| 트랙 | `buildTrackData`, `nearestIdx`, `lateralAt`, `atTrack`, `headingAt`, `findLowCurv` | CatmullRom 닫힌 곡선 → 900개 샘플, 곡률, 구간별 벽 한계(`limits`) |
| 월드 공통 | `buildWorld`, `ribbonGeo`, `buildGantry`, `setLamps`, `makeStand`, `buildPadsAndSigns` | 도로·연석·갓길 리본, 출발 신호등 갠트리, 관중석, 가속 발판, 코너 표지판 |
| 선셋 비치 | `buildBeach`, `makePalm`, `makeRock`, `makeIsland`, `waterMat`, `buildBarriers`, `addClouds` | 모래·바다·섬 7기·등대·야자수 26·파라솔·오두막·돛단배·방호벽 |
| 경복궁 | `buildPalace`, `roofGeo`, `koreanRoof`, `makeHall`, `makeGate`, `makePine`, `palaceMats` | 박석 마당, 기와 담장, 전각 4기, 광화문(트랙 통과), 경회루 연못, 소나무 20 |
| 캐릭터 | `buildHead`, `buildDriver` | 2등신 머리(눈·눈썹·입·볼터치), 머리 모양, 모자, 의상, 핸들 잡은 팔 |
| 카트 | `buildKartBody`, `makeWheel`, `makeFlame`, `kartMats`, `buildRacerModel` | 5종 차체, 휠, 부스터 불꽃, 깃발, 이름표·기절 별·무적 실드·나비·다 빈치 날개 |
| 이펙트 | `initParticles`, `spawnP`, `burst`, `initSkid`, `addSkid` | 스프라이트 파티클 풀, 스키드 마크 InstancedMesh |
| 오디오 | `auInit`, `sfx`, `bgmTick`, `auEngine` | 엔진음·드리프트음·효과음·배경음악 합성 |
| 입력 | `steerInput`, `brakeInput`, `driftInput`, `setupTouch` | 키보드 + 터치 조이스틱/버튼 |
| 화면 | `showScreen`, `initPreview`, `refreshPreview`, `renderPreview`, `makePortraits`, `buildCharUI`, `buildKartUI` | 메뉴, 3D 미리보기, 3D로 렌더한 초상화 |
| 타이틀 | `ensureShowcase`, `updateTitle` | 실제 트랙 위 카트를 카메라가 도는 타이틀 배경 |
| 레이스 | `makeKart`, `buildRace`, `startLoading`, `beginRace`, `endRace` | 8인 그리드, 아이템 박스 5곳×3레인 |
| AI·물리 | `aiControl`, `stepKart`, `giveBoost`, `updateTrackPos`, `collisions` | 러버밴딩, 드리프트 미끄러짐(`moveAng`), 미니/대형 터보, 벽 처리, 랩 계산 |
| 아이템·필살기 | `rollItem`, `useItem`, `spawnProj`, `spawnHazard`, `updateProjs`, `hitKart`, `pickups`, `useUlt` | 유물 4종, 가속 발판, 캐릭터별 필살기 10종 |
| 비주얼 | `updateKartVisual`, `updateCamera`, `animWorld`, `waveFlag` | 차체 기울기·바퀴·조향·운전자 애니메이션, 추적 카메라, 흔들림 |
| HUD | `updateHUD`, `drawMinimapBase`, `drawMinimap`, `toast`, `bigText`, `drawSpeedLines` | 순위·랩·타이머·미니맵·순위표·토스트 |
| 결과 | `buildPodium`, `updatePodium`, `showResults` | 3D 시상대 + 색종이 |
| 루프 | `updateGame`, `renderRace`(백미러 scissor 렌더), `loop` | requestAnimationFrame + delta time |

## 에셋 교체 지점 (실사풍 작업 시)

| 교체 대상 | 현재 코드 | 교체 방법 |
|---|---|---|
| 캐릭터 3D 모델 | `buildDriver(ch, kd)` | GLB가 있으면 로드한 모델을 반환, 없으면 기존 코드 실행 |
| 카트 3D 모델 | `buildKartBody(kid, ch)` | 같은 방식. 반환 형식 `{ g, wheels:[{spin,R}], fronts:[mount], flames:[] }` 유지 |
| 초상화 | `makePortraits()` → `PORTRAIT[id]` | `assets/ui/portraits/<id>.png`가 있으면 그 경로 사용 |
| 도로·지형 텍스처 | `T_.asphalt`, `T_.sand`, `T_.pave`, `T_.roofTile`, `T_.dancheong` … | `TextureLoader`로 불러오되 실패 시 CanvasTexture |
| 아이템 아이콘 | HUD의 이모지 (`ITEMS[x].emoji`) | `<img>` 아이콘으로 교체 (이모지는 대체 텍스트로 유지) |
