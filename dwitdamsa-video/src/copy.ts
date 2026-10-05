// 뒷담사(史) EP — 세계 최초의 고객 불만 편지 (에아나시르 점토판)
// 모든 화면 문구와 타이밍을 한곳에 모아 둔다. 시간 단위는 초(내레이션 시작 기준 오프셋 포함).

export const FPS = 30;
export const NARRATION_OFFSET = 0.5; // 내레이션이 영상 시작 후 0.5초에 시작
export const DURATION = 29; // 전체 길이(초)

export const s = (sec: number) => Math.round(sec * FPS);

// 내레이션(4문장) — Higgsfield TTS(minimax, Hana) 결과를 faster-whisper로 측정한 타이밍
export const NARRATION = [
  "약 3,750년 전 메소포타미아의 우르.",
  "구리 상인 에아나시르가 불량 구리를 내밀었어요.",
  "화난 손님 난니는 점토판에 '날 뭘로 보는 거요!'라고 새겨 보냈죠.",
  "세계에서 가장 오래된 고객 불만 편지랍니다.",
];

// 자막(릴스 버전 하단) — [시작초, 끝초, 문구]
export const CAPTIONS: [number, number, string][] = [
  [0.5, 2.5, "약 3,750년 전"],
  [2.5, 4.6, "메소포타미아의 도시 우르"],
  [4.6, 6.9, "구리 상인 에아나시르가"],
  [6.9, 9.4, "불량 구리를 내밀었어요"],
  [9.7, 11.9, "화난 손님 난니는 점토판에"],
  [11.9, 14.0, "“날 뭘로 보는 거요!”"],
  [14.0, 15.9, "라고 새겨 보냈죠"],
  [16.0, 18.0, "세계에서 가장 오래된"],
  [18.0, 20.5, "고객 불만 편지랍니다"],
];

export const TEXT = {
  brandTop: "동쌤의",
  brand: "뒷담사(史)",
  titleThen: ["3", "7", "5", "0", "년", "전"],
  titleLater: ["3", "7", "5", "0", "년", "뒤"],
  badgeNow: ["오", "늘"],
  ur: "메소포타미아 · 우르",
  ziggurat: "지구라트",
  merchant: "구리 상인 에아나시르",
  dilmun: "딜문(지금의 바레인)에서 배로 들여온 구리",
  bad: "불량",
  merchantSays: "살 거면 사고, 아니면 가쇼!",
  messenger: "난니의 심부름꾼",
  nanni: "손님 난니",
  shout: "날 뭘로 보는 거요?!",
  tablet: "점토판 + 쐐기 문자",
  stylus: "갈대 펜으로 꾹꾹",
  oldest: "세계에서 가장 오래된 고객 불만 편지",
  guinness: "기네스 세계 기록",
  size: "실제 크기 11.6×5cm · 스마트폰보다 작아요",
  digTitle: "1920~30년대 우르 발굴 (레너드 울리)",
  digGossip: "에아나시르의 집에서 불만 편지가 여러 장 더 나왔다는 사실!",
  factHead: "뒷담사 팩트 체크",
  facts: [
    "기원전 1750년경 · 우르(오늘날 이라크 남부)",
    "아카드어 쐐기 문자 · 점토판 크기 11.6×5cm",
    "영국박물관 소장 (등록번호 131236)",
  ],
  textbookHead: "교과서 연결 · 메소포타미아 문명",
  textbookQuote:
    "수메르인은 … 점토판에 … 쐐기 문자로 왕의 업적, 신에 대한 제사, 교역 내용 등을 기록하였다.",
  question: "문자가 없었다면 난니는 어떻게 항의했을까?",
  outro: "다음 뒷담사도 기대해!",
};

export const ALL_TEXT = [
  ...Object.values(TEXT).flat(),
  ...CAPTIONS.map((c) => c[2]),
  ...NARRATION,
  "0123456789년전뒤·×()!?“”‘’'.,~",
].join("");
