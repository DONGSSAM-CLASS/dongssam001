// Claude API 호출. 자료 본문 → 판매·홍보 문구 순서로 두 번 부른다.
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { ProductSchema, MarketingSchema } from './schemas.mjs';
import { PRODUCT_SYSTEM, MARKETING_SYSTEM, productPrompt, marketingPrompt } from './prompts.mjs';

// 1M 토큰당 달러 (입력, 출력). 표에 없는 모델은 비용을 표시하지 않는다.
const PRICES = {
  'claude-opus-5-5': [4, 20],
  'claude-sonnet-5-5': [2, 10],
  'claude-haiku-4-5': [1, 5],
};

export function estimateCostUSD(model, usage) {
  const price = PRICES[model];
  if (!price) return null;
  const input =
    (usage.input_tokens ?? 0) +
    (usage.cache_creation_input_tokens ?? 0) * 1.25 +
    (usage.cache_read_input_tokens ?? 0) * 0.1;
  return (input * price[0] + (usage.output_tokens ?? 0) * price[1]) / 1_000_000;
}

async function ask(client, args) {
  try {
    return await askOnce(client, args);
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      throw new Error('API 키가 올바르지 않습니다. ANTHROPIC_API_KEY 환경 변수를 확인하세요.', { cause: err });
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new Error('요청 한도를 넘었습니다. 잠시 뒤 다시 실행하세요.', { cause: err });
    }
    throw err;
  }
}

async function askOnce(client, { model, effort, system, user, schema, label }) {
  const response = await client.beta.messages.parse({
    model,
    max_tokens: 16000,
    // 안전 분류기가 요청을 거절하면 서버가 권장 대체 모델로 다시 실행한다.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort, format: betaZodOutputFormat(schema) },
    system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
  });

  if (response.stop_reason === 'refusal') {
    const why = response.stop_details?.explanation ?? '사유 없음';
    throw new Error(`${label}: 모델이 요청을 거절했습니다 (${why}). 주제 표현을 바꿔 다시 시도하세요.`);
  }
  if (response.stop_reason === 'max_tokens') {
    throw new Error(`${label}: 출력이 길어 잘렸습니다. --questions 를 줄이거나 주제를 좁혀 주세요.`);
  }
  if (!response.parsed_output) {
    throw new Error(`${label}: 응답을 해석하지 못했습니다. 다시 실행해 주세요.`);
  }
  return { data: response.parsed_output, usage: response.usage, model: response.model };
}

export async function generateKit(options, log = () => {}) {
  const client = new Anthropic();
  const { model, effort } = options;

  log('  1/2 자료 본문 생성 중…');
  const product = await ask(client, {
    model,
    effort,
    system: PRODUCT_SYSTEM,
    user: productPrompt(options),
    schema: ProductSchema,
    label: '자료 본문',
  });

  log('  2/2 판매·홍보 문구 생성 중…');
  const marketing = await ask(client, {
    model,
    effort,
    system: MARKETING_SYSTEM,
    user: marketingPrompt({ product: product.data, platforms: options.platforms }),
    schema: MarketingSchema,
    label: '판매·홍보 문구',
  });

  const costs = [product, marketing].map((r) => estimateCostUSD(r.model, r.usage));
  const costUSD = costs.includes(null) ? null : costs[0] + costs[1];
  return { product: product.data, marketing: marketing.data, costUSD };
}
