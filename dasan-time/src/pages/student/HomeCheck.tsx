import { useState } from 'react';
import { Award, CalendarCheck, HeartHandshake, Lock, PenLine } from 'lucide-react';
import { useData } from '../../app/DataContext';
import { meetsRequirements, useActivity } from '../../lib/useActivity';
import ActivityShell from '../../components/ActivityShell';
import AutoSaveField from '../../components/AutoSaveField';
import RubricCard from '../../components/RubricCard';
import StepNav from '../../components/StepNav';
import ReadAloudButton from '../../components/ReadAloudButton';
import { Loading } from '../../components/States';
import { HOME_OBSTACLES, HOME_TEXT, UI_TEXT, WEEKDAYS, type ActivityId } from '../../content/lessons';

const WEEK_IDS: ActivityId[] = ['home_w1', 'home_w2', 'home_w3', 'home_w4'];
const STEPS = ['1주차', '2주차', '3주차', '4주차'];

export default function HomeCheck() {
  const [week, setWeek] = useState(0);
  const { cls, submissions, loading } = useData();

  if (loading || !cls) return <Loading />;
  if (cls.sessions.home === 'locked') {
    return (
      <div className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body items-center text-center">
          <Lock className="h-10 w-10 opacity-50" aria-hidden />
          <p className="text-lg font-bold">
            3차시를 제출하면 4주 실천이 열려요. 선생님이 열어 주실 때까지 기다려 볼까요?
          </p>
        </div>
      </div>
    );
  }

  const allDone = WEEK_IDS.every((id) => submissions[id]?.status === 'submitted');

  return (
    <div className="flex flex-col gap-5">
      <header>
        <p className="badge badge-success rounded-2xl">4주 실천</p>
        <h1 className="mt-2 text-2xl font-extrabold">나만의 다산초당 4주 자기점검</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="rounded-2xl bg-success/15 px-4 py-2 text-sm font-bold">
            {HOME_TEXT.encourage}
          </p>
          <ReadAloudButton text={HOME_TEXT.encourage} />
        </div>
      </header>

      <RubricCard sessionKey="home" />

      {allDone && (
        <section className="card rounded-2xl border-2 border-success bg-success/10 shadow-sm">
          <div className="card-body items-center gap-2 p-6 text-center">
            <Award className="h-14 w-14 text-success" aria-hidden />
            <p className="text-xl font-extrabold">{HOME_TEXT.badgeTitle}</p>
            <p className="text-sm opacity-80">{HOME_TEXT.badgeBody}</p>
          </div>
        </section>
      )}

      <StepNav steps={STEPS} current={week} onChange={setWeek} color="success" />
      <WeekCard key={WEEK_IDS[week]} activityId={WEEK_IDS[week]} weekNo={week + 1} />
    </div>
  );
}

function WeekCard({ activityId, weekNo }: { activityId: ActivityId; weekNo: number }) {
  const draft = useActivity(activityId);
  const values = draft.values as {
    days?: boolean[];
    obstacle?: string;
    obstacleNote?: string;
    ruleEdit?: string;
    praise?: string;
    guardian?: string;
  };
  const days = values.days ?? WEEKDAYS.map(() => false);
  const keptCount = days.filter(Boolean).length;

  const canSubmit =
    Boolean(values.obstacle) && meetsRequirements(draft.values, [{ key: 'praise', minLength: 3 }]);

  function toggleDay(index: number) {
    if (draft.locked) return;
    draft.setValue(
      'days',
      days.map((d, i) => (i === index ? !d : d)),
    );
  }

  return (
    <ActivityShell
      title={`${weekNo}주차 자기점검`}
      icon={<CalendarCheck className="h-5 w-5 text-success" aria-hidden />}
      intro="이번 주는 어땠나요? 지킨 날도, 못 지킨 날도 그대로 적어 봐요."
      draft={draft}
      canSubmit={canSubmit}
    >
      <fieldset className="rounded-2xl bg-base-200 p-4">
        <legend className="px-1 font-bold">운영 시간을 지킨 날</legend>
        <div className="flex flex-wrap justify-center gap-2">
          {WEEKDAYS.map((label, i) => (
            <button
              key={label}
              type="button"
              className={`btn h-14 min-h-14 w-14 rounded-2xl p-0 text-base ${
                days[i] ? 'btn-success' : 'btn-outline'
              }`}
              aria-pressed={days[i]}
              aria-label={`${label}요일 ${days[i] ? '지켰어요' : '아직이에요'}`}
              disabled={draft.locked}
              onClick={() => toggleDay(i)}
            >
              {days[i] ? `${label} ✓` : label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-sm font-semibold">
          이번 주에 {keptCount}일 지켰어요.
        </p>
      </fieldset>

      <fieldset className="rounded-2xl bg-base-200 p-4">
        <legend className="px-1 font-bold">가장 지키기 어려웠던 상황</legend>
        <div className="flex flex-wrap gap-2">
          {HOME_OBSTACLES.map((o) => (
            <button
              key={o}
              type="button"
              className={`btn btn-sm h-auto min-h-11 rounded-2xl ${
                values.obstacle === o ? 'btn-success' : 'btn-outline'
              }`}
              aria-pressed={values.obstacle === o}
              disabled={draft.locked}
              onClick={() => draft.setValue('obstacle', o)}
            >
              {o}
            </button>
          ))}
        </div>
        <input
          className="input input-bordered mt-3 w-full rounded-2xl"
          placeholder="한 줄 메모 (안 적어도 괜찮아요)"
          aria-label="어려웠던 상황 한 줄 메모"
          value={values.obstacleNote ?? ''}
          disabled={draft.locked}
          onChange={(e) => draft.setValue('obstacleNote', e.target.value)}
        />
      </fieldset>

      <AutoSaveField
        label={HOME_TEXT.ruleEditLabel}
        help={HOME_TEXT.ruleEditHelp}
        example="저녁 8시는 학원 때문에 어려워서, 밤 9시~10시로 바꿀래요."
        value={values.ruleEdit ?? ''}
        onChange={(v) => draft.setValue('ruleEdit', v)}
        rows={2}
        disabled={draft.locked}
      />
      {values.ruleEdit?.trim() && (
        <p className="flex items-center gap-2 rounded-2xl bg-warning/20 p-3 text-sm">
          <PenLine className="h-4 w-4 shrink-0" aria-hidden />
          바꾼 규칙은 출입증 카드에 ‘수정됨’ 표시와 함께 보여요.
        </p>
      )}

      <AutoSaveField
        label={HOME_TEXT.praiseLabel}
        example={HOME_TEXT.praiseExample}
        value={values.praise ?? ''}
        onChange={(v) => draft.setValue('praise', v)}
        minLength={3}
        required
        rows={2}
        disabled={draft.locked}
      />

      <div className="rounded-2xl bg-base-200 p-4">
        <p className="flex items-center gap-2 font-bold">
          <HeartHandshake className="h-5 w-5 text-success" aria-hidden />
          {HOME_TEXT.guardianLabel}
        </p>
        <p className="mt-1 mb-2 text-sm opacity-75">{HOME_TEXT.guardianHelp}</p>
        <input
          className="input input-bordered w-full rounded-2xl"
          placeholder="예) 스스로 정한 규칙을 지키려는 모습이 대견해요."
          aria-label="보호자 응원 한 줄"
          value={values.guardian ?? ''}
          disabled={draft.locked}
          onChange={(e) => draft.setValue('guardian', e.target.value)}
        />
        <p className="mt-1 text-xs opacity-60">보호자 성함은 적지 않아요.</p>
      </div>

      {draft.locked && <p className="text-sm opacity-70">{UI_TEXT.editLocked}</p>}
    </ActivityShell>
  );
}
