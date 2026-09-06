import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Item, ItemDraft, ItemType } from '../../types/schema';
import { ITEM_TYPES } from '../../constants';
import { useData } from '../../data/DataContext';
import { examLabel } from '../../lib/pdfLink';
import { downloadText, readFileText } from '../../lib/download';
import UnitMultiSelect from '../../components/UnitMultiSelect';

/** 검수 대상 문항(초안은 evidence·parseWarning 을 가질 수 있음) */
type WorkItem = Item & { evidence?: ItemDraft['evidence']; parseWarning?: string };

/**
 * 검수 화면 (/teacher/verify, 기능 13).
 * 서버 없이 동작: 초안 JSON 을 불러와(evidence 근거 표시) topic·unitIds·itemType 을 확정하고,
 * 배포용 items.json(evidence 제거)으로 내려받는다. → 교사가 저장소에 커밋.
 */
export default function VerifyPage() {
  const { examById } = useData();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loadedName, setLoadedName] = useState<string>('');
  const [index, setIndex] = useState(0);
  const [onlyPending, setOnlyPending] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(
    () => items.filter((it) => (onlyPending ? !it.verified : true)),
    [items, onlyPending],
  );
  const pendingCount = items.filter((it) => !it.verified).length;
  const current = visible[Math.min(index, Math.max(visible.length - 1, 0))];

  const loadFromFile = async (file: File) => {
    try {
      const parsed = JSON.parse(await readFileText(file));
      if (!Array.isArray(parsed)) throw new Error('배열이 아닙니다');
      setItems(parsed as WorkItem[]);
      setLoadedName(file.name);
      setIndex(0);
    } catch (e) {
      alert('JSON 을 읽을 수 없습니다: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const loadCurrentDeployed = async () => {
    const res = await fetch(`${import.meta.env.BASE_URL}data/items.json`);
    const parsed = (await res.json()) as WorkItem[];
    setItems(parsed);
    setLoadedName('public/data/items.json (배포본)');
    setIndex(0);
  };

  const patch = (p: Partial<WorkItem>) => {
    if (!current) return;
    setItems((prev) => prev.map((it) => (it.itemId === current.itemId ? { ...it, ...p } : it)));
  };

  const completeAndNext = () => {
    if (!current) return;
    setItems((prev) =>
      prev.map((it) =>
        it.itemId === current.itemId
          ? { ...it, verified: true, verifiedAt: new Date().toISOString() }
          : it,
      ),
    );
    setIndex((i) => i); // onlyPending 이면 목록이 줄어 자동으로 다음 대기 문항으로 이동
  };

  const toProductionItems = (): Item[] =>
    items.map(({ evidence: _evidence, parseWarning: _pw, ...rest }) => rest);

  const downloadDeploy = () =>
    downloadText('items.json', JSON.stringify(toProductionItems(), null, 2));
  const downloadReviewed = () =>
    downloadText('items.reviewed.json', JSON.stringify(items, null, 2));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900">문항 검수</h1>
          <p className="text-sm text-slate-500">
            초안(items.draft.json)을 불러와 주제·단원·유형을 확정한 뒤 배포용 items.json 으로 내려받으세요.
          </p>
        </div>
        <Link to="/teacher" className="text-sm text-blue-600 hover:underline">
          ← 교사용 홈
        </Link>
      </div>

      {/* 불러오기 / 내려받기 도구 */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-white p-3">
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && loadFromFile(e.target.files[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          초안 JSON 불러오기
        </button>
        <button
          type="button"
          onClick={loadCurrentDeployed}
          className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          현재 배포본 불러오기
        </button>
        <span className="text-xs text-slate-500">{loadedName || '불러온 파일 없음'}</span>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={downloadDeploy}
            disabled={items.length === 0}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            배포용 items.json 내려받기
          </button>
          <button
            type="button"
            onClick={downloadReviewed}
            disabled={items.length === 0}
            className="rounded-md border px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            검수본(근거 포함) 내려받기
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-white p-8 text-center text-slate-400">
          초안 또는 배포본 JSON 을 먼저 불러오세요.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-[1fr_320px]">
          {/* 검수 편집 영역 */}
          <div className="rounded-lg border bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={onlyPending}
                  onChange={(e) => {
                    setOnlyPending(e.target.checked);
                    setIndex(0);
                  }}
                  className="h-4 w-4 accent-blue-600"
                />
                검수 대기만 보기 (남은 {pendingCount}건)
              </label>
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  disabled={index <= 0}
                  className="rounded border px-2 py-1 disabled:opacity-40"
                >
                  이전
                </button>
                <span className="text-slate-500">
                  {visible.length === 0 ? 0 : Math.min(index, visible.length - 1) + 1} / {visible.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIndex((i) => Math.min(visible.length - 1, i + 1))}
                  disabled={index >= visible.length - 1}
                  className="rounded border px-2 py-1 disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            </div>

            {!current ? (
              <div className="py-10 text-center text-emerald-600">
                ✓ 검수 대기 문항이 없습니다.
              </div>
            ) : (
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold text-slate-700">
                    {examLabel(examById.get(current.examId)) || current.examId}
                  </span>
                  <span className="font-medium text-slate-600">{current.number}번</span>
                  <span className="text-xs text-slate-400">{current.itemId}</span>
                  {current.pdfPage && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                      PDF {current.pdfPage}쪽
                    </span>
                  )}
                  {current.verified ? (
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                      검수 완료
                    </span>
                  ) : (
                    <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-xs font-medium text-yellow-800">
                      검수 대기
                    </span>
                  )}
                </div>

                {current.parseWarning && (
                  <p className="mb-2 rounded bg-red-50 px-2 py-1 text-xs text-red-700">
                    ⚠ {current.parseWarning}
                  </p>
                )}

                {/* 근거(추출 텍스트) — 검수 화면에서만 표시. 저작권상 학생 화면·배포물에는 넣지 않음. */}
                {current.evidence?.extractedText && (
                  <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 p-2">
                    <div className="text-xs font-semibold text-slate-400">
                      추출 근거 (검수 전용 · 배포/학생 화면 미표시)
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">
                      {current.evidence.extractedText}
                    </p>
                    <div className="mt-1 text-[11px] text-slate-400">
                      출처 파일: {current.evidence.sourceFile}
                    </div>
                  </div>
                )}

                <label className="mb-1 block text-sm font-medium text-slate-700">주제(topic)</label>
                <textarea
                  value={current.topic ?? ''}
                  onChange={(e) => patch({ topic: e.target.value })}
                  rows={2}
                  placeholder="예: 대동법의 시행 배경과 결과 (교사가 직접 작성)"
                  className="mb-3 w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                />

                <label className="mb-1 block text-sm font-medium text-slate-700">유형(itemType)</label>
                <select
                  value={current.itemType ?? ''}
                  onChange={(e) => patch({ itemType: (e.target.value || null) as ItemType | null })}
                  className="mb-3 w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                >
                  <option value="">(선택 안 함)</option>
                  {ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <label className="mb-1 block text-sm font-medium text-slate-700">
                  키워드(쉼표로 구분)
                </label>
                <input
                  value={current.keywords.join(', ')}
                  onChange={(e) =>
                    patch({
                      keywords: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="대동법, 공납, 선혜청"
                  className="mb-3 w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                />

                <label className="mb-1 block text-sm font-medium text-slate-700">비고(note)</label>
                <input
                  value={current.note}
                  onChange={(e) => patch({ note: e.target.value })}
                  className="mb-4 w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                />

                <div className="flex gap-2">
                  {!current.verified ? (
                    <button
                      type="button"
                      onClick={completeAndNext}
                      disabled={!(current.topic || '').trim() || current.unitIds.length === 0}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                      title="topic 과 단원(unitIds)을 입력해야 검수 완료할 수 있습니다."
                    >
                      검수 완료 → 다음
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => patch({ verified: false, verifiedAt: null })}
                      className="rounded-md border border-yellow-400 px-4 py-2 text-sm font-semibold text-yellow-700 hover:bg-yellow-50"
                    >
                      검수 취소
                    </button>
                  )}
                </div>
                {(!(current.topic || '').trim() || current.unitIds.length === 0) && (
                  <p className="mt-2 text-xs text-slate-400">
                    검수 완료하려면 주제와 단원을 최소 1개 지정하세요.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 단원 지정 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              단원(unitIds) {current ? `· ${current.unitIds.length}개 선택` : ''}
            </label>
            {current ? (
              <UnitMultiSelect value={current.unitIds} onChange={(ids) => patch({ unitIds: ids })} />
            ) : (
              <div className="rounded-md border p-3 text-sm text-slate-400">문항을 선택하세요.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
