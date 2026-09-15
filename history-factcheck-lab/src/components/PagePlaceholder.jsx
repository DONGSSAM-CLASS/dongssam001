/**
 * Phase 1 뼈대용 안내 블록.
 * 각 화면이 어떤 Phase에서 채워지는지 명시해 둔다.
 */
export default function PagePlaceholder({ title, phase, curriculum, children }) {
  return (
    <section className="card-file">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">{title}</h1>
        <span className="stamp">{phase}에서 구현</span>
      </div>
      {curriculum ? (
        <p className="mb-3 text-sm text-ink-soft">
          <span className="font-bold">교육과정 근거:</span> {curriculum}
        </p>
      ) : null}
      <div className="leading-reading">{children}</div>
    </section>
  );
}
