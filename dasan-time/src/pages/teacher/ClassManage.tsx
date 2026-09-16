import { useState } from 'react';
import { KeyRound, RefreshCw, UserMinus, UserRoundCog, Users } from 'lucide-react';
import { useTeacher } from '../../app/TeacherContext';
import {
  claimNumber,
  reissueClassCode,
  releaseNumber,
  setJoinOpen,
  transferSubmissions,
  updateStudent,
} from '../../lib/db';
import { EmptyState, ErrorNotice, Loading } from '../../components/States';

const GROUPS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function ClassManage() {
  const { cls, students, loading } = useTeacher();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reconnect, setReconnect] = useState<{ fromUid: string; name: string } | null>(null);
  const [toUid, setToUid] = useState('');

  if (loading) return <Loading />;
  if (!cls) {
    return (
      <EmptyState
        title="학급을 먼저 골라 주세요"
        description="대시보드에서 학급을 만들면 이 화면을 쓸 수 있어요."
      />
    );
  }

  async function run(fn: () => Promise<unknown>, done: string) {
    setError('');
    setNotice('');
    try {
      await fn();
      setNotice(done);
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리하지 못했어요.');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">학급 관리</h1>

      {error && <ErrorNotice message={error} />}
      {notice && (
        <div className="alert alert-success rounded-2xl" role="status">
          <span>{notice}</span>
        </div>
      )}

      {/* 학급 코드 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">
            <KeyRound className="h-5 w-5 text-primary" aria-hidden />
            학급 코드
          </h2>
          <p className="font-mono text-4xl font-extrabold tracking-[0.3em]">{cls.code}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline gap-2 rounded-2xl"
              onClick={() =>
                void run(async () => {
                  await reissueClassCode(cls);
                }, '새 학급 코드를 만들었어요. 학생들에게 새 코드를 알려 주세요.')
              }
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              코드 재발급
            </button>
            <button
              type="button"
              className="btn btn-outline rounded-2xl"
              onClick={() => void run(() => setJoinOpen(cls.code, true), '학생 가입을 열었어요.')}
            >
              가입 열기
            </button>
            <button
              type="button"
              className="btn btn-outline rounded-2xl"
              onClick={() => void run(() => setJoinOpen(cls.code, false), '학생 가입을 잠갔어요.')}
            >
              가입 잠그기
            </button>
          </div>
          <p className="text-sm opacity-70">
            코드를 재발급하면 이전 코드로는 가입할 수 없어요. 이미 가입한 학생은 그대로 쓸 수 있어요.
          </p>
        </div>
      </section>

      {/* 학생 명단 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">
            <Users className="h-5 w-5 text-primary" aria-hidden />
            학생 명단 ({students.length}명)
          </h2>
          {students.length === 0 ? (
            <EmptyState
              title="아직 가입한 학생이 없어요"
              description={`학생들에게 학급 코드 ${cls.code} 를 알려 주세요.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>번호</th>
                    <th>이름</th>
                    <th>아이디</th>
                    <th>모둠</th>
                    <th>가입일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((st) => (
                    <tr key={st.uid} className={st.active ? '' : 'opacity-50'}>
                      <td>
                        <input
                          className="input input-bordered input-sm w-20 rounded-2xl"
                          type="number"
                          aria-label={`${st.name} 번호`}
                          defaultValue={st.number}
                          onBlur={(e) => {
                            const next = Number(e.target.value);
                            if (next === st.number) return;
                            void run(async () => {
                              // 번호 자리도 함께 옮겨 준다.
                              await claimNumber(cls.id, next, st.uid);
                              await releaseNumber(cls.id, st.number);
                              await updateStudent(cls.id, st.uid, { number: next });
                            }, '번호를 바꿨어요.');
                          }}
                        />
                      </td>
                      <td>
                        <input
                          className="input input-bordered input-sm w-28 rounded-2xl"
                          aria-label={`${st.name} 이름`}
                          defaultValue={st.name}
                          onBlur={(e) =>
                            void run(
                              () => updateStudent(cls.id, st.uid, { name: e.target.value }),
                              '이름을 바꿨어요.',
                            )
                          }
                        />
                      </td>
                      <td className="font-mono text-sm">{st.loginId}</td>
                      <td>
                        {/* 모둠 편성 — 선택으로 배정한다. */}
                        <select
                          className="select select-bordered select-sm rounded-2xl"
                          aria-label={`${st.name} 모둠`}
                          value={st.group ?? ''}
                          onChange={(e) =>
                            void run(
                              () =>
                                updateStudent(cls.id, st.uid, {
                                  group: e.target.value ? Number(e.target.value) : null,
                                }),
                              '모둠을 배정했어요.',
                            )
                          }
                        >
                          <option value="">미배정</option>
                          {GROUPS.map((g) => (
                            <option key={g} value={g}>
                              {g}모둠
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-sm opacity-70">
                        {st.joinedAt ? new Date(st.joinedAt).toLocaleDateString('ko-KR') : '—'}
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs gap-1 rounded-2xl"
                            onClick={() =>
                              void run(async () => {
                                await updateStudent(cls.id, st.uid, { active: !st.active });
                                // 내보낸 자리는 다른 학생이 쓸 수 있게 비워 준다.
                                if (st.active) await releaseNumber(cls.id, st.number);
                                else await claimNumber(cls.id, st.number, st.uid).catch(() => undefined);
                              }, st.active ? '학급에서 내보냈어요.' : '다시 들어오게 했어요.')
                            }
                          >
                            <UserMinus className="h-3.5 w-3.5" aria-hidden />
                            {st.active ? '내보내기' : '되돌리기'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-xs gap-1 rounded-2xl"
                            onClick={() => {
                              setReconnect({ fromUid: st.uid, name: st.name });
                              setToUid('');
                            }}
                          >
                            <UserRoundCog className="h-3.5 w-3.5" aria-hidden />
                            기록 옮기기
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* 모둠별 모아 보기 */}
      {students.length > 0 && (
        <section className="card rounded-2xl bg-base-100 shadow-sm">
          <div className="card-body gap-3 p-4">
            <h2 className="card-title text-base">모둠 편성 한눈에 보기</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {GROUPS.map((g) => {
                const members = students.filter((s) => s.group === g);
                return (
                  <div key={g} className="rounded-2xl bg-base-200 p-3">
                    <p className="font-bold">{g}모둠</p>
                    <ul className="mt-1 text-sm">
                      {members.length === 0 ? (
                        <li className="opacity-60">아직 없어요</li>
                      ) : (
                        members.map((m) => (
                          <li key={m.uid}>
                            {m.number}. {m.name}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 계정 재연결 */}
      {reconnect && (
        <dialog className="modal modal-open" aria-label="기록 옮기기">
          <div className="modal-box max-w-lg rounded-2xl">
            <h3 className="text-lg font-bold">{reconnect.name} 학생의 기록 옮기기</h3>
            <p className="mt-2 text-sm opacity-80">
              비밀번호를 잊은 학생은 새 아이디로 다시 가입하게 해 주세요. 그런 다음 아래에서 새 계정을
              고르면, 이전 기록이 새 계정으로 옮겨져요.
            </p>
            <select
              className="select select-bordered mt-4 w-full rounded-2xl"
              aria-label="새로 가입한 계정 고르기"
              value={toUid}
              onChange={(e) => setToUid(e.target.value)}
            >
              <option value="">새로 가입한 계정을 골라 주세요</option>
              {students
                .filter((s) => s.uid !== reconnect.fromUid)
                .map((s) => (
                  <option key={s.uid} value={s.uid}>
                    {s.number}. {s.name} ({s.loginId})
                  </option>
                ))}
            </select>
            <div className="modal-action">
              <button type="button" className="btn rounded-2xl" onClick={() => setReconnect(null)}>
                취소
              </button>
              <button
                type="button"
                className="btn btn-primary rounded-2xl"
                disabled={!toUid}
                onClick={() =>
                  void run(async () => {
                    await transferSubmissions(cls.id, reconnect.fromUid, toUid);
                    await updateStudent(cls.id, reconnect.fromUid, { active: false });
                    const old = students.find((s) => s.uid === reconnect.fromUid);
                    if (old) await releaseNumber(cls.id, old.number);
                    setReconnect(null);
                  }, '기록을 옮겼어요. 이전 계정은 내보내기 처리했어요.')
                }
              >
                옮기기
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
