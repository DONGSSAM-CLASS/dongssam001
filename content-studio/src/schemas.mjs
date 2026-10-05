// Claude 구조화 출력(Structured Outputs)으로 받을 데이터 모양.
// 렌더러(render.mjs)와 데모 데이터(sample.mjs)도 이 모양을 그대로 따른다.
import { z } from 'zod';

export const ProductSchema = z.object({
  title: z.string().describe('상품 제목 (검색에 걸리도록 핵심 키워드 포함, 40자 이내)'),
  subtitle: z.string().describe('한 줄 부제'),
  audience: z.string().describe('대상 (예: 중학교 2학년 역사 수업 / 학부모 가정학습)'),
  curriculumLink: z.string().describe('관련 2022 개정 교육과정 단원·성취기준을 일반적인 표현으로 (코드 번호를 지어내지 말 것)'),
  learningGoals: z.array(z.string()).describe('학습 목표 3~4개'),
  sections: z
    .array(
      z.object({
        heading: z.string(),
        paragraphs: z.array(z.string()).describe('직접 쓴 설명 문단. 교과서 문장 복제 금지'),
        keyTerms: z.array(z.string()).describe('이 절의 핵심 용어'),
      }),
    )
    .describe('개념 정리 본문 3~5개 절'),
  activities: z
    .array(
      z.object({
        title: z.string(),
        minutes: z.number().int(),
        instructions: z.string(),
      }),
    )
    .describe('수업·가정학습 활동 2~3개'),
  questions: z
    .array(
      z.object({
        kind: z.enum(['객관식', '단답형', '서술형']),
        prompt: z.string(),
        choices: z.array(z.string()).describe('객관식이면 보기 5개, 아니면 빈 배열'),
        answer: z.string(),
        explanation: z.string(),
      }),
    )
    .describe('평가 문항'),
  teacherNotes: z.array(z.string()).describe('지도 시 유의점·흔한 오개념·확장 아이디어'),
  factCheck: z
    .array(
      z.object({
        claim: z.string().describe('판매 전 사람이 반드시 확인해야 할 연도·수치·인용·해석'),
        howToVerify: z.string().describe('확인할 수 있는 공공 자료 이름(국사편찬위원회 등)과 방법'),
      }),
    )
    .describe('사실 검증 목록'),
});

export const MarketingSchema = z.object({
  listings: z
    .array(
      z.object({
        platform: z.string(),
        title: z.string(),
        shortDescription: z.string().describe('목록에 보이는 한두 줄 소개'),
        longDescription: z.string().describe('상세 페이지 본문. 구성품·대상·활용법·미리보기 안내 포함, 과장 금지'),
        tags: z.array(z.string()),
        suggestedPriceKRW: z.number().int(),
        priceRationale: z.string(),
      }),
    )
    .describe('판매처별 상품 등록 문구'),
  blogPost: z.object({
    title: z.string(),
    metaDescription: z.string(),
    keywords: z.array(z.string()),
    bodyMarkdown: z.string().describe('검색 유입용 무료 글. 자료 일부를 실제로 유용하게 공개하고 끝에 판매 페이지 안내'),
    callToAction: z.string(),
  }),
  sns: z
    .array(
      z.object({
        channel: z.string(),
        text: z.string(),
        hashtags: z.array(z.string()),
      }),
    )
    .describe('인스타그램·스레드·밴드 등 홍보 글'),
  shortsScript: z.object({
    hook: z.string().describe('첫 3초 문장'),
    scenes: z.array(
      z.object({
        seconds: z.number().int(),
        narration: z.string(),
        onScreenText: z.string(),
      }),
    ),
    cta: z.string(),
  }),
});
