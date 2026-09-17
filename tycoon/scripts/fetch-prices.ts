/**
 * 시세 수집 스크립트 — Cloud Scheduler 대체(8단계 준비).
 *
 * Firebase Spark(무료) 요금제에는 Cloud Functions 도 Scheduler 도 없습니다.
 * 그래서 GitHub Actions 가 정해진 시각에 이 스크립트를 실행하고,
 * 서비스 계정으로 Firestore 의 stockPrices 캐시를 갱신합니다.
 * 브라우저는 이 캐시만 읽습니다(요구사항 5-8 의 구조와 동일).
 *
 * 필요한 환경변수
 *   FIREBASE_SERVICE_ACCOUNT  서비스 계정 JSON 문자열 (GitHub Secrets)
 *   TYCOON_CLASS_ID           시세를 쓸 학급 ID (종목 목록을 읽어 옵니다)
 *
 * 시세 제공자는 어댑터로 분리되어 있어 교체할 수 있습니다.
 * 기본은 Yahoo Finance chart 엔드포인트이며, 실패하면 교사가 종가를 직접
 * 입력하는 화면으로 넘어갑니다(마지막 성공 시각을 함께 기록합니다).
 */
import { cert, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

interface Quote {
  ticker: string;
  name: string;
  price: number;        // 현지 통화 기준 현재가
  currency: string;     // 'KRW' | 'USD' ...
  daily: { t: number; c: number }[];
}

export interface PriceAdapter {
  readonly id: string;
  fetchQuote(ticker: string): Promise<Quote>;
  fetchFxToKrw(currency: string): Promise<number>;
}

/** 기본 어댑터 — Yahoo Finance chart. 키가 필요 없지만 비공식 엔드포인트입니다. */
export const yahooAdapter: PriceAdapter = {
  id: 'yahoo',
  async fetchQuote(ticker) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1mo&interval=1d`;
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 classroom-tycoon' } });
    if (!res.ok) throw new Error(`시세를 받지 못했습니다 (${ticker}): HTTP ${res.status}`);
    const json = (await res.json()) as {
      chart: { result: { meta: Record<string, unknown>; timestamp: number[]; indicators: { quote: { close: (number | null)[] }[] } }[] };
    };
    const result = json.chart?.result?.[0];
    if (!result) throw new Error(`시세 응답이 비어 있습니다 (${ticker})`);

    const closes = result.indicators.quote[0].close;
    const daily = (result.timestamp ?? [])
      .map((t, i) => ({ t, c: closes[i] }))
      .filter((d): d is { t: number; c: number } => typeof d.c === 'number');

    return {
      ticker,
      name: String(result.meta.shortName ?? ticker),
      price: Number(result.meta.regularMarketPrice ?? daily.at(-1)?.c ?? 0),
      currency: String(result.meta.currency ?? 'KRW'),
      daily,
    };
  },
  async fetchFxToKrw(currency) {
    if (currency === 'KRW') return 1;
    const quote = await this.fetchQuote(`${currency}KRW=X`);
    return quote.price;
  },
};

/** 실제 가격(원) → 교실 코인 가격. 환산비율은 대통령이 설정합니다(기본 1코인 = 1,000원). */
export function toCoinPrice(krw: number, ratio: number): number {
  return Math.max(1, Math.round(krw / ratio));
}

async function main() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT 환경변수가 없습니다.');
  const classId = process.env.TYCOON_CLASS_ID;
  if (!classId) throw new Error('TYCOON_CLASS_ID 환경변수가 없습니다.');

  const credential = cert(JSON.parse(raw));
  initializeApp({ credential });
  const db = getFirestore();

  const settings = await db.doc(`classes/${classId}/settings/stock`).get();
  const ratio = (settings.data()?.coinRatio as number) ?? 1000;

  const stocks = await db.collection(`classes/${classId}/stocks`).where('enabled', '==', true).get();
  if (stocks.empty) {
    console.log('거래 가능 종목이 없습니다. 대통령 콘솔에서 종목을 먼저 등록하세요.');
    return;
  }

  const adapter = yahooAdapter;
  let ok = 0;

  for (const stock of stocks.docs) {
    const ticker = stock.id;
    try {
      const quote = await adapter.fetchQuote(ticker);
      const fx = await adapter.fetchFxToKrw(quote.currency);
      const krw = Math.round(quote.price * fx);
      const perTickerRatio = (stock.data().rateOverride as number | undefined) ?? ratio;

      await db.doc(`stockPrices/${ticker}`).set(
        {
          ticker,
          name: quote.name,
          price: quote.price,
          currency: quote.currency,
          fxRate: fx,
          krw,
          coin: toCoinPrice(krw, perTickerRatio),
          daily: quote.daily.slice(-30),
          source: adapter.id,
          updatedAt: FieldValue.serverTimestamp(),
          lastSuccessAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      ok += 1;
      console.log(`${ticker} ${krw.toLocaleString('ko-KR')}원 → ${toCoinPrice(krw, perTickerRatio)}코인`);
    } catch (error) {
      // 실패해도 마지막 성공 가격은 남겨 둡니다.
      // 30분 넘게 갱신되지 않으면 앱이 해당 종목 거래를 자동으로 멈춥니다.
      console.error(`${ticker} 실패:`, error instanceof Error ? error.message : error);
      await db.doc(`stockPrices/${ticker}`).set(
        { lastErrorAt: FieldValue.serverTimestamp(), lastError: String(error) },
        { merge: true },
      );
    }
  }

  console.log(`${ok}/${stocks.size}개 종목을 갱신했습니다.`);
  if (ok === 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
