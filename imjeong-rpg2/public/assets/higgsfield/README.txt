이 폴더는 힉스필드(Higgsfield) MCP 로 만든 삽화를 넣는 곳입니다. (제2탄)

넣을 수 있는 파일 — 모두 선택 사항입니다. 없어도 게임은 그대로 돌아갑니다.
  cover.jpg                 시작 화면 표지 (16:9)
  act-1.jpg ~ act-6.jpg     시대 전환 화면 (21:9)
  quest-<퀘스트 id>.jpg      임무 화면 삽화 (21:9) — 예: quest-q-name.jpg
  ending.jpg                감사 증서 화면 (21:9)
  sky-<장소 id>.jpg          1인칭 3D 화면의 하늘 파노라마 (2:1 등장방형)
                            장소 id: memorial · assembly · hafei · madang · chongqing · seoul

확장자는 jpg · webp · png 를 찾습니다 (하늘 파노라마는 jpg 만).
전체 주문서(파일 이름·비율·프롬프트)는  npm run assets:higgsfield  로 뽑습니다.

⚠ 지킬 것
  · 실존 인물의 얼굴을 만들지 마세요. 뒷모습·실루엣·장소·사물 위주로 만듭니다.
  · 생성 이미지는 「사료」가 아니라 「삽화」입니다. 게임 화면에도 그렇게 적혀 있습니다.
  · 폭력 장면, 시대에 없던 물건(자동차·전선·현대 간판)이 나오면 다시 만드세요.

자세한 절차: docs/HIGGSFIELD_MCP.md
