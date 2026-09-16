import { useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  IdCard,
  Images,
  ImageDown,
  Lock,
  NotebookPen,
  Printer,
  Star,
  Vote,
} from 'lucide-react';
import { useData } from '../../app/DataContext';
import { meetsRequirements, useActivity } from '../../lib/useActivity';
import ActivityShell from '../../components/ActivityShell';
import AutoSaveField from '../../components/AutoSaveField';
import PassCard from '../../components/PassCard';
import RubricCard from '../../components/RubricCard';
import StepNav from '../../components/StepNav';
import ThreeColumnSheet from '../../components/ThreeColumnSheet';
import { EmptyState, Loading } from '../../components/States';
import { downloadElementAsPng, safeFileName } from '../../lib/pdf';
import { galleryAlias } from '../../lib/code';
import {
  DECO_HINT,
  DECO_LINKS,
  PASS_COLORS,
  PASS_FIELDS,
  PASS_RULE_HINT,
  PASS_STICKERS,
  PEER_VOTE,
  S3_REFLECT_FIELDS,
  SELF_EVAL_ITEMS,
  UI_TEXT,
  type PassColorId,
} from '../../content/lessons';
import type { GalleryItem, PassCardData } from '../../lib/types';

const STEPS = ['활동5 출입증', '활동6 갤러리', '자기 평가'];

export default function Session3() {
  const [step, setStep] = useState(0);
  const { cls, loading } = useData();

  if (loading || !cls) return <Loading />;
  if (cls.sessions.s3 === 'locked') {
    return (
      <div className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body items-center text-center">
          <Lock className="h-10 w-10 opacity-50" aria-hidden />
          <p className="text-lg font-bold">{UI_TEXT.locked}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="badge badge-accent rounded-2xl">3차시</p>
        <h1 className="mt-2 text-2xl font-extrabold">나만의 다산초당 출입증 만들기</h1>
        <p className="mt-1 opacity-80">
          내가 지킬 수 있는 규칙을 정해서, 출입증 카드로 만들고 친구들과 나눠요.
        </p>
      </header>

      <RubricCard sessionKey="s3" />
      <StepNav steps={STEPS} current={step} onChange={setStep} color="accent" />

      {step === 0 && <Activity5 />}
      {step === 1 && <Activity6 />}
      {step === 2 && <SelfEval />}
    </div>
  );
}

/* ---------------------- 활동 5. 출입증 도안 ---------------------- */

function Activity5() {
  const draft = useActivity('s3_a5');
  const { api, cls, submissions, displayName } = useData();
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const values = draft.values as Partial<PassCardData> & { hideFromGallery?: boolean };

  // 1차시 활동 1에서 가장 오래 쓴 앱을 끌어와 도움말에 보여 준다.
  const a1 = submissions.s1_a1?.data as { apps?: { name: string }[] } | undefined;
  const topApp = a1?.apps?.find((a) => a?.name?.trim())?.name ?? '';

  const card: PassCardData = {
    app: values.app ?? '',
    time: values.time ?? '',
    alt: values.alt ?? '',
    pledge: values.pledge ?? '',
    color: (values.color as PassColorId) ?? 'pink',
    sticker: values.sticker ?? PASS_STICKERS[0],
    revised: values.revised,
    revisedNote: values.revisedNote,
  };

  const canSubmit = meetsRequirements(
    draft.values,
    PASS_FIELDS.map((f) => ({ key: f.id, minLength: f.minLength })),
  );

  // 제출한 뒤에는 갤러리에도 올려 준다. (본인이 '올리지 않기'를 고르면 감춘다)
  const hidden = values.hideFromGallery === true;
  useEffect(() => {
    if (!api || draft.status !== 'submitted' || !canSubmit) return;
    const alias = galleryAlias(api.uid, PEER_VOTE.aliasPrefix);
    void api.saveGalleryItem(card, !hidden, alias);
    // card 안의 값이 바뀔 때마다 갤러리도 최신으로 맞춘다.
  }, [api, draft.status, canSubmit, hidden, card.app, card.time, card.alt, card.pledge, card.color, card.sticker]);

  async function savePng() {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      await downloadElementAsPng(cardRef.current, safeFileName(`${displayName}_다산초당출입증`));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ActivityShell
      title="활동 5 · 출입증 도안"
      icon={<IdCard className="h-5 w-5 text-accent" aria-hidden />}
      intro="네 칸을 채우면, 아래 카드가 바로 만들어져요."
      draft={draft}
      canSubmit={canSubmit}
      footer={
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 font-bold">출입증 미리보기</p>
            <PassCard
              ref={cardRef}
              card={card}
              ownerLabel={`${displayName} · ${cls?.name ?? ''}`}
              commonTime={cls?.commonTime ?? undefined}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-accent gap-2 rounded-2xl"
              disabled={busy}
              onClick={() => void savePng()}
            >
              {busy ? (
                <span className="loading loading-spinner loading-sm" aria-hidden />
              ) : (
                <ImageDown className="h-4 w-4" aria-hidden />
              )}
              PNG로 저장
            </button>
            {DECO_LINKS.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="btn btn-outline gap-2 rounded-2xl"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                {link.label}
              </a>
            ))}
            <button
              type="button"
              className="btn btn-outline gap-2 rounded-2xl"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" aria-hidden />
              종이 출입증 인쇄하기
            </button>
          </div>
          <p className="text-sm opacity-70">{DECO_HINT}</p>

          <label className="label cursor-pointer justify-start gap-3 rounded-2xl bg-base-200 px-4">
            <input
              type="checkbox"
              className="checkbox"
              checked={hidden}
              disabled={draft.locked}
              onChange={(e) => draft.setValue('hideFromGallery', e.target.checked)}
            />
            <span className="label-text">갤러리에 올리지 않기</span>
          </label>

          {/* 종이 출입증(같은 규격 빈 템플릿) — 인쇄할 때만 보인다. */}
          <PaperTemplate />
        </div>
      }
    >
      <p className="rounded-2xl bg-accent/10 p-4 font-semibold">{PASS_RULE_HINT}</p>

      <ThreeColumnSheet
        rows={PASS_FIELDS.map((f) => ({
          id: f.id,
          label: f.label,
          help:
            f.id === 'app' && topApp
              ? `${f.help} (1차시에 적은 앱: ${topApp})`
              : f.help,
          field: (
            <AutoSaveField
              label={f.label}
              example={f.example}
              value={(values[f.id] as string) ?? ''}
              onChange={(v) => draft.setValue(f.id, v)}
              minLength={f.minLength}
              required
              rows={f.id === 'pledge' ? 3 : 2}
              disabled={draft.locked}
            />
          ),
        }))}
      />

      <fieldset className="rounded-2xl bg-base-200 p-4">
        <legend className="px-1 font-bold">카드 색 고르기</legend>
        <div className="flex flex-wrap gap-2">
          {PASS_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`btn h-auto min-h-11 gap-2 rounded-2xl ${
                card.color === c.id ? 'btn-accent' : 'btn-outline'
              }`}
              aria-pressed={card.color === c.id}
              disabled={draft.locked}
              onClick={() => draft.setValue('color', c.id)}
            >
              <span
                className="inline-block h-4 w-4 rounded-full border"
                style={{ background: c.bg, borderColor: c.border }}
                aria-hidden
              />
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl bg-base-200 p-4">
        <legend className="px-1 font-bold">이모지 스티커 1개</legend>
        <div className="flex flex-wrap gap-2">
          {PASS_STICKERS.map((s) => (
            <button
              key={s}
              type="button"
              className={`btn h-12 min-h-12 w-12 rounded-2xl p-0 text-2xl ${
                card.sticker === s ? 'btn-accent' : 'btn-outline'
              }`}
              aria-label={`스티커 ${s}`}
              aria-pressed={card.sticker === s}
              disabled={draft.locked}
              onClick={() => draft.setValue('sticker', s)}
            >
              {s}
            </button>
          ))}
        </div>
      </fieldset>
    </ActivityShell>
  );
}

/** 기기 사용이 어려운 학생을 위한 같은 규격 빈 템플릿 (인쇄 전용) */
function PaperTemplate() {
  return (
    <div className="hidden print:block">
      <div className="mx-auto w-full max-w-md rounded-2xl border-4 border-base-300 p-5">
        <p className="text-sm font-bold">나만의 다산초당 출입증</p>
        <p className="mt-1 text-xs">이름: ____________________</p>
        <div className="mt-4 space-y-5 text-sm">
          {PASS_FIELDS.map((f) => (
            <div key={f.id}>
              <p className="font-bold">{f.label}</p>
              <p className="mt-1 border-b border-dashed border-base-300 pb-5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------- 활동 6. 갤러리 워크와 동료 평가 ------------------- */

function Activity6() {
  const draft = useActivity('s3_a6');
  const { api, cls, displayName } = useData();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const values = draft.values as { picks?: string[]; reason?: string };
  const picks = values.picks ?? [];

  useEffect(() => {
    if (!api) return;
    return api.watchGallery(setItems);
  }, [api]);

  // 내 카드는 고를 수 없다.
  const others = items.filter((i) => i.id !== api?.uid);
  const voteClosed = Boolean(cls?.voteClosed);

  const canSubmit =
    picks.length === 2 && meetsRequirements(draft.values, [{ key: 'reason', minLength: 5 }]);

  function toggle(id: string) {
    if (draft.locked || voteClosed) return;
    if (picks.includes(id)) {
      draft.setValue('picks', picks.filter((p) => p !== id));
    } else if (picks.length < 2) {
      draft.setValue('picks', [...picks, id]);
    }
  }

  // 투표가 마감되면 많이 뽑힌 카드를 알아볼 수 있게 표시한다.
  const [tally, setTally] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!api || !voteClosed || api.mode !== 'firestore') return;
    // 학생 화면에서는 내 표만 볼 수 있으므로, 마감 뒤 결과는 선생님이 화면으로 보여 준다.
    setTally({});
  }, [api, voteClosed]);

  return (
    <ActivityShell
      title="활동 6 · 갤러리 워크와 동료 평가"
      icon={<Images className="h-5 w-5 text-accent" aria-hidden />}
      intro="친구들의 출입증을 둘러봐요. 이름 대신 별칭으로 보여요."
      draft={draft}
      canSubmit={canSubmit && !voteClosed}
    >
      <div className="alert rounded-2xl border border-accent/40 bg-accent/10" role="note">
        <Vote className="h-5 w-5 shrink-0 text-accent" aria-hidden />
        <span className="text-sm font-semibold">{PEER_VOTE.guide}</span>
      </div>

      {voteClosed && (
        <div className="alert alert-info rounded-2xl" role="status">
          <span>투표가 마감되었어요. 결과는 선생님이 화면으로 보여 주실 거예요.</span>
        </div>
      )}

      {others.length === 0 ? (
        <EmptyState
          title="아직 올라온 출입증이 없어요"
          description="친구들이 활동 5를 제출하면 여기에 카드가 나타나요. 잠시 뒤에 다시 와 볼까요?"
          icon={<Images className="h-10 w-10 opacity-40" aria-hidden />}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {others.map((item) => {
            const picked = picks.includes(item.id);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`w-full rounded-2xl border-4 p-1 text-left transition ${
                    picked ? 'border-accent' : 'border-transparent'
                  }`}
                  aria-pressed={picked}
                  disabled={draft.locked || voteClosed || (!picked && picks.length >= 2)}
                  onClick={() => toggle(item.id)}
                >
                  <PassCard card={item.card} ownerLabel={item.alias} />
                  <p className="mt-2 text-center text-sm font-bold">
                    {picked ? '✓ 골랐어요' : '이 다짐 고르기'}
                    {tally[item.id] ? ` · ${tally[item.id]}표` : ''}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <AutoSaveField
        label={PEER_VOTE.reasonLabel}
        example={PEER_VOTE.reasonExample}
        value={values.reason ?? ''}
        onChange={(v) => draft.setValue('reason', v)}
        minLength={5}
        required
        rows={2}
        disabled={draft.locked || voteClosed}
      />

      <button
        type="button"
        className="btn btn-accent rounded-2xl"
        disabled={!canSubmit || voteClosed}
        onClick={() => void api?.saveVote(picks, values.reason ?? '')}
      >
        투표 보내기
      </button>
      <p className="text-xs opacity-60">
        {displayName}님이 누구를 골랐는지는 친구들에게 보이지 않아요.
      </p>
    </ActivityShell>
  );
}

/* --------------------- 3차시 자기 평가 + 성찰일지 --------------------- */

function SelfEval() {
  const draft = useActivity('s3_self');
  const values = draft.values as Record<string, string | number>;

  const canSubmit =
    SELF_EVAL_ITEMS.every((i) => Number(values[i.id] ?? 0) > 0) &&
    meetsRequirements(
      draft.values,
      S3_REFLECT_FIELDS.map((f) => ({ key: f.id, minLength: 5 })),
    );

  return (
    <ActivityShell
      title="3차시 자기 평가와 성찰일지"
      icon={<NotebookPen className="h-5 w-5 text-accent" aria-hidden />}
      intro="별을 눌러 스스로 평가해 봐요. 정답은 없어요. 솔직한 게 제일 좋아요."
      draft={draft}
      canSubmit={canSubmit}
    >
      <fieldset className="flex flex-col gap-3 rounded-2xl bg-base-200 p-4">
        <legend className="px-1 font-bold">자기 평가</legend>
        {SELF_EVAL_ITEMS.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center justify-between gap-2">
            <span className="grow text-sm font-semibold">{item.label}</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((n) => {
                const on = Number(values[item.id] ?? 0) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    className={`btn btn-sm h-11 min-h-11 w-11 rounded-2xl p-0 ${
                      on ? 'btn-accent' : 'btn-outline'
                    }`}
                    aria-label={`${item.label} 별 ${n}개`}
                    aria-pressed={on}
                    disabled={draft.locked}
                    onClick={() => draft.setValue(item.id, n)}
                  >
                    <Star className={`h-4 w-4 ${on ? 'fill-current' : ''}`} aria-hidden />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </fieldset>

      {S3_REFLECT_FIELDS.map((f) => (
        <AutoSaveField
          key={f.id}
          label={f.label}
          example={f.example}
          value={(values[f.id] as string) ?? ''}
          onChange={(v) => draft.setValue(f.id, v)}
          minLength={5}
          required
          rows={2}
          disabled={draft.locked}
        />
      ))}
    </ActivityShell>
  );
}
