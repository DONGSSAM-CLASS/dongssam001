import { RELIABILITY, SOURCE_KINDS } from '../lib/cases.js';

/** 신뢰도 배지 */
export function ReliabilityBadge({ level }) {
  const meta = RELIABILITY[level] ?? RELIABILITY.medium;
  return (
    <span className={`rounded-sm px-2 py-0.5 text-xs font-bold ${meta.className}`}>
      신뢰도 {meta.label}
    </span>
  );
}

/** 목록에 쓰는 압축 카드 */
export function SourceListItem({ source, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(source.id)}
      aria-current={active ? 'true' : undefined}
      className={[
        'w-full rounded-sm border p-3 text-left transition-colors duration-150',
        active
          ? 'border-ink bg-ink text-kraft-light'
          : 'border-kraft-dark bg-white/70 hover:bg-kraft-light',
      ].join(' ')}
    >
      <span className="block text-xs opacity-80">
        {source.id} · {SOURCE_KINDS[source.kind] ?? source.kind}
      </span>
      <span className="mt-1 block text-sm font-bold leading-snug">{source.title}</span>
      <span className="mt-1 block text-xs opacity-80">
        {source.author || '작성자 미상'} · {source.year || '연도 미상'}
      </span>
    </button>
  );
}

/** 사료 본문 뷰어 */
export default function SourceCard({ source, showOriginal = true }) {
  if (!source) {
    return (
      <div className="card-file text-ink-soft">
        <p>왼쪽 목록에서 사료를 하나 골라 보자.</p>
      </div>
    );
  }

  return (
    <article className="card-file">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-sm border border-ink px-2 py-0.5 text-xs font-bold">
          {SOURCE_KINDS[source.kind] ?? source.kind}
        </span>
        <ReliabilityBadge level={source.reliability} />
        {source.nonText ? (
          <span className="rounded-sm bg-ink-soft px-2 py-0.5 text-xs font-bold text-kraft-light">
            비문자 자료
          </span>
        ) : null}
        {source.synthetic ? (
          <span className="rounded-sm bg-alert px-2 py-0.5 text-xs font-bold text-white">
            수업용 가상 예시 · 실제 문서 아님
          </span>
        ) : null}
      </div>

      <h3 className="text-lg font-bold leading-snug">{source.title}</h3>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-ink-soft">
        <dt className="font-bold">만든 이</dt>
        <dd>{source.author || '미상'}</dd>
        <dt className="font-bold">만든 때</dt>
        <dd>{source.year || '미상'}</dd>
        <dt className="font-bold">실린 곳</dt>
        <dd>{source.site || '—'}</dd>
      </dl>

      {source.syntheticNote ? (
        <p className="mt-3 rounded-sm border border-alert/50 bg-alert/5 p-3 text-sm">
          {source.syntheticNote}
        </p>
      ) : null}

      {source.nonTextNote ? (
        <p className="mt-3 rounded-sm border border-ink-soft/40 bg-white/60 p-3 text-sm">
          <span className="font-bold">비문자 자료 읽기: </span>
          {source.nonTextNote}
        </p>
      ) : null}

      <div className="mt-4 border-l-4 border-kraft-dark pl-4">
        <p className="text-xs font-bold text-ink-soft">
          {source.excerptKind === 'quote' ? '자료 인용 (읽기 쉽게 옮김)' : '자료 내용 요약'}
        </p>
        <p className="mt-1 leading-reading">{source.excerpt}</p>
        {showOriginal && source.originalText ? (
          <p className="mt-2 text-sm text-ink-soft">
            <span className="font-bold">원문: </span>
            {source.originalText}
          </p>
        ) : null}
      </div>

      <div className="mt-4 rounded-sm bg-kraft-dark/25 p-3 text-sm">
        <p className="font-bold">이 자료를 얼마나 믿을 수 있나</p>
        <p className="mt-1 leading-reading">{source.reliabilityWhy}</p>
      </div>

      <div className="mt-4 text-sm">
        <p className="font-bold">출처 확인 메모</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>누가: {source.sourcingAnswer?.who}</li>
          <li>언제: {source.sourcingAnswer?.when}</li>
          <li>사건과의 거리: {source.sourcingAnswer?.distanceFromEvent}</li>
        </ul>
      </div>

      {source.url ? (
        <p className="mt-4 break-all text-sm">
          <span className="font-bold">원문 주소: </span>
          <a
            className="underline decoration-ink-soft underline-offset-2"
            href={source.url}
            target="_blank"
            rel="noreferrer"
          >
            {source.url}
          </a>
          {source.urlVerified ? (
            <span className="ml-2 rounded-sm bg-ink px-1.5 py-0.5 text-xs text-kraft-light">
              링크 확인됨
            </span>
          ) : (
            <span className="ml-2 rounded-sm border border-alert px-1.5 py-0.5 text-xs text-alert">
              링크 미확인
            </span>
          )}
        </p>
      ) : null}
    </article>
  );
}
