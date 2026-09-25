/**
 * 1차시 · 우리 모둠 — 모둠 고르기, 역할 고르기(강점), 모둠 이름·약속, 사건 파일 고르기
 * K-SEL [9정서01-01] 나의 특성 인식 · [9정서02-02] 공동체에서 나의 역할
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FolderOpen, Handshake, TriangleAlert, UserRoundCheck, UsersRound } from 'lucide-react';
import { Layout } from '../../../components/Layout';
import { Button, Loading, Modal, Notice, friendlyError } from '../../../components/ui';
import { ActivityHeader, ActivityLocked, Section, SharedText } from '../../../components/project';
import { onRadioKeyDown, radioTabIndex } from '../../../components/radioKeys';
import { PrincipleIcon } from '../../../components/icons';
import { StudentBadge } from '../StudentHome';
import { useReadyStudent } from '../../../app/StudentContext';
import { useGroups } from '../../../app/useGroups';
import { CHAPTERS } from '../../../data/scenarios';
import { getPrinciple } from '../../../data/principles';
import { MAX_GROUP_MEMBERS, PLEDGE_STARTERS, ROLES } from '../../../data/project';
import { joinGroup, setMyRoles, updateGroup } from '../../../lib/db';
import { groupLabel, isActivityOpen, membersOf, missingRoles } from '../../../lib/project';
import type { ChapterId, RoleId } from '../../../types/content';
import type { GroupRecord } from '../../../types/db';

/** 한 사람이 맡을 수 있는 역할 수 */
const MAX_MY_ROLES = 2;

export default function TeamPage() {
  const { student, cls, session, group } = useReadyStudent();
  const { groups } = useGroups(session.classId);
  const nav = useNavigate();
  const [moveTo, setMoveTo] = useState<GroupRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isActivityOpen('team', cls.session)) {
    return (
      <Layout right={<StudentBadge />}>
        <ActivityLocked activity="team" />
      </Layout>
    );
  }

  const me = { number: student.number, nickname: student.nickname };
  const visible = (groups ?? []).filter((g) => g.no <= cls.groupCount);

  const join = async (to: number) => {
    setBusy(true);
    setError(null);
    try {
      await joinGroup(session.classId, session.studentId, me, student.groupNo, to);
      setMoveTo(null);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout right={<StudentBadge />}>
      <ActivityHeader icon={UsersRound} activity="team">
        모둠을 고르고, 나의 강점에 맞는 역할을 맡아요. 모둠 이름과 약속, 탐구할 사건 파일도 함께 정해요.
      </ActivityHeader>

      {error && (
        <Notice tone="error" className="mb-4">
          {error}
        </Notice>
      )}

      <div className="flex flex-col gap-5">
        <Section title="① 모둠 고르기" icon={UsersRound}>
          {cls.groupCount === 0 ? (
            <Notice tone="info">선생님이 아직 모둠을 만들지 않았어요. 잠시 기다려 주세요.</Notice>
          ) : !groups ? (
            <Loading label="모둠을 불러오는 중이에요…" />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {visible.map((g) => {
                const list = membersOf(g.members);
                const mine = g.no === student.groupNo;
                const full = list.length >= MAX_GROUP_MEMBERS && !mine;
                return (
                  <li
                    key={g.id}
                    className={`flex flex-col gap-2 rounded-box border-2 p-3 ${mine ? 'border-primary-content bg-primary/40' : 'border-base-300 bg-white'}`}
                  >
                    <p className="font-bold">
                      {groupLabel(g)} <span className="font-normal text-ink-soft">({list.length}/{MAX_GROUP_MEMBERS}명)</span>
                    </p>
                    <p className="min-h-6 text-[15px] text-ink-soft">
                      {list.length ? list.map((m) => `${m.number}번 ${m.nickname}`).join(', ') : '아직 아무도 없어요'}
                    </p>
                    {mine ? (
                      <span className="inline-flex items-center gap-1 font-bold text-declass">
                        <UserRoundCheck className="h-5 w-5" aria-hidden="true" />
                        우리 모둠
                      </span>
                    ) : (
                      <Button
                        variant="secondary"
                        disabled={busy || full}
                        onClick={() => (student.groupNo > 0 ? setMoveTo(g) : void join(g.no))}
                      >
                        {full ? '자리가 없어요' : student.groupNo > 0 ? '이 모둠으로 옮기기' : '이 모둠 고르기'}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        {group && <MyGroup group={group} me={me} />}

        {group && (
          <div className="flex flex-wrap gap-2">
            {isActivityOpen('explore', cls.session) ? (
              <Button onClick={() => nav('/play/explore')}>
                사건 파일 탐구하러 가기
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            ) : (
              <p className="text-ink-soft">다음 차시에는 고른 사건 파일을 직접 체험하고 기획서를 써요.</p>
            )}
          </div>
        )}
      </div>

      <Modal open={!!moveTo} onClose={() => setMoveTo(null)} title="모둠을 옮길까요?">
        <p>
          {moveTo && groupLabel(moveTo)}(으)로 옮겨요. 지금 모둠에서 고른 역할은 지워지고, 새 모둠에서 다시 골라요.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setMoveTo(null)}>
            취소
          </Button>
          <Button disabled={busy} onClick={() => moveTo && void join(moveTo.no)}>
            옮기기
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}

function MyGroup({ group, me }: { group: GroupRecord; me: { number: number; nickname: string } }) {
  const { session } = useReadyStudent();
  const [error, setError] = useState<string | null>(null);
  const myRoles = group.members[String(me.number)]?.roles ?? [];
  const list = membersOf(group.members);
  const missing = missingRoles(group.members);
  const save = (fields: Record<string, unknown>) => updateGroup(session.classId, group.no, fields);

  const toggleRole = async (id: RoleId) => {
    setError(null);
    const next = myRoles.includes(id) ? myRoles.filter((r) => r !== id) : [...myRoles, id];
    try {
      await setMyRoles(session.classId, group.no, me, next);
    } catch (e) {
      setError(friendlyError(e));
    }
  };

  const setCase = async (id: ChapterId) => {
    setError(null);
    try {
      await save({ caseId: id });
    } catch (e) {
      setError(friendlyError(e));
    }
  };
  const caseIds = CHAPTERS.map((c) => c.id);

  return (
    <>
      {error && <Notice tone="error">{error}</Notice>}

      <Section title="② 내 역할 고르기" icon={UserRoundCheck}>
        <p className="text-[16px]">
          내가 <strong>잘하는 것</strong>과 <strong>해 보고 싶은 것</strong>을 떠올려 보세요. 한 사람이 역할을 {MAX_MY_ROLES}개까지 맡을 수 있어요.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((r) => {
            const on = myRoles.includes(r.id);
            const takenBy = list.filter((m) => m.roles.includes(r.id) && m.number !== me.number);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  disabled={!on && myRoles.length >= MAX_MY_ROLES}
                  onClick={() => void toggleRole(r.id)}
                  className={`flex h-full w-full flex-col gap-1.5 rounded-box border-2 p-3 text-left transition-colors disabled:opacity-60 ${
                    on ? 'border-primary-content bg-primary/50' : 'border-base-300 bg-white hover:bg-base-200'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2 font-bold">
                    {r.name}
                    {on && <span className="rounded-full bg-primary-content px-2 text-[14px] text-white">내 역할</span>}
                  </span>
                  <ul className="list-disc pl-5 text-[15px]">
                    {r.tasks.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <span className="text-[14px] text-ink-soft">이런 친구에게 잘 맞아요: {r.goodFor}</span>
                  <span className="flex flex-wrap items-center gap-1 text-[14px]">
                    이어지는 원칙:
                    {r.principleIds.map((id) => (
                      <span key={id} className="inline-flex items-center gap-1 rounded-full bg-base-200 px-2">
                        <PrincipleIcon id={id} className="h-3.5 w-3.5" />
                        {getPrinciple(id).name}
                      </span>
                    ))}
                  </span>
                  {takenBy.length > 0 && (
                    <span className="text-[14px] text-ink-soft">함께 맡은 친구: {takenBy.map((m) => m.nickname).join(', ')}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {missing.length > 0 ? (
          <p className="flex items-start gap-1.5 text-[15px] font-bold text-[#8a4b00]">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            아직 아무도 맡지 않은 역할: {missing.map((id) => ROLES.find((r) => r.id === id)!.name).join(', ')}
          </p>
        ) : (
          <p className="text-[15px] font-bold text-declass">다섯 가지 역할이 모두 채워졌어요!</p>
        )}
        <table className="w-full text-[15px]">
          <caption className="sr-only">우리 모둠 역할 분담표</caption>
          <thead>
            <tr className="border-b border-base-300 text-left">
              <th className="py-1">모둠원</th>
              <th className="py-1">역할</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.number} className="border-b border-base-200">
                <td className="py-1">
                  {m.number}번 {m.nickname}
                </td>
                <td className="py-1">{m.roles.length ? m.roles.map((id) => ROLES.find((r) => r.id === id)!.name).join(', ') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="③ 모둠 이름과 약속" icon={Handshake}>
        <SharedText
          label="모둠 이름"
          value={group.name}
          maxLength={12}
          rows={1}
          onSave={(t) => save({ name: t })}
        />
        <SharedText
          label="모둠 약속"
          hint="함께 지킬 약속을 두세 가지 적어요. 모두가 동의하는 약속으로 정해요."
          value={group.pledge}
          maxLength={200}
          rows={3}
          starters={PLEDGE_STARTERS}
          onSave={(t) => save({ pledge: t })}
        />
      </Section>

      <Section title="④ 탐구할 사건 파일" icon={FolderOpen}>
        <p className="text-[16px]">2차시에 모둠원 모두가 이 사건 속 시민이 되어 체험하고, 여기서 찾은 근거로 콘텐츠를 기획해요.</p>
        <div
          role="radiogroup"
          aria-label="사건 파일"
          className="grid gap-3 sm:grid-cols-3"
          onKeyDown={(e) => onRadioKeyDown(e, caseIds, group.caseId, (v) => void setCase(v))}
        >
          {CHAPTERS.map((c, i) => {
            const on = group.caseId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={radioTabIndex(group.caseId, c.id, i)}
                onClick={() => void setCase(c.id)}
                data-chapter={c.theme}
                className={`flex flex-col gap-1 rounded-box border-2 p-3 text-left ${
                  on ? 'border-ch-900 bg-ch-100' : 'border-base-300 bg-white hover:bg-base-200'
                }`}
              >
                <span className="text-[14px] text-ch-600">
                  {c.period} · {c.place}
                </span>
                <span className="typewriter text-[18px] font-bold text-ch-900">「{c.title}」</span>
                <span className="text-[14px]">원칙: {c.principleIds.map((id) => getPrinciple(id).name).join(', ')}</span>
                {on && <span className="font-bold text-ch-900">우리 모둠 사건</span>}
              </button>
            );
          })}
        </div>
      </Section>
    </>
  );
}
