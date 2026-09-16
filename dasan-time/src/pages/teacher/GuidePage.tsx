import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpenText, ClipboardCheck, GraduationCap, Printer, Save, ScrollText } from 'lucide-react';
import { useTeacher } from '../../app/TeacherContext';
import { updateClass } from '../../lib/db';
import { EmptyState, ErrorNotice, Loading } from '../../components/States';
import { DIRECTIONS, SEL_MAP, SESSION_GUIDES, STANDARDS } from '../../content/teacherGuide';
import { RUBRIC } from '../../content/lessons';

export default function GuidePage() {
  const { cls, loading } = useTeacher();
  const [stat, setStat] = useState({ text: '', source: '', period: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    setStat(cls?.statNote ?? { text: '', source: '', period: '' });
  }, [cls]);

  if (loading) return <Loading />;
  if (!cls) return <EmptyState title="학급을 먼저 골라 주세요" description="대시보드에서 학급을 만들어 주세요." />;

  async function saveStat(clear = false) {
    setError('');
    setNotice('');
    try {
      await updateClass(cls!.id, { statNote: clear || !stat.text.trim() ? null : stat });
      setNotice(clear ? '통계 카드를 숨겼어요.' : '통계 카드를 저장했어요. 1차시 도입 화면에 나와요.');
      if (clear) setStat({ text: '', source: '', period: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장하지 못했어요.');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold">
        <BookOpenText className="mr-2 inline h-6 w-6 text-primary" aria-hidden />
        수업 안내 자료
      </h1>

      {error && <ErrorNotice message={error} />}
      {notice && (
        <div className="alert alert-success rounded-2xl" role="status">
          <span>{notice}</span>
        </div>
      )}

      {/* 도입 통계 카드 설정 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">1차시 도입 통계 카드 (선택)</h2>
          <p className="text-sm opacity-70">
            청소년 스마트폰 이용 관련 통계를 도입 화면에 보여 주고 싶으실 때 직접 입력해 주세요.
            앱에는 어떤 수치도 미리 넣어 두지 않았습니다. 비워 두시면 카드가 나타나지 않습니다.
          </p>
          <input
            className="input input-bordered w-full rounded-2xl"
            placeholder="보여 줄 문장 (예: 청소년의 하루 평균 스마트폰 이용 시간은 ○시간입니다.)"
            aria-label="통계 문장"
            value={stat.text}
            onChange={(e) => setStat((s) => ({ ...s, text: e.target.value }))}
          />
          <div className="flex flex-wrap gap-2">
            <input
              className="input input-bordered grow rounded-2xl"
              placeholder="출처 (기관·조사 이름)"
              aria-label="통계 출처"
              value={stat.source}
              onChange={(e) => setStat((s) => ({ ...s, source: e.target.value }))}
            />
            <input
              className="input input-bordered w-48 rounded-2xl"
              placeholder="발표 시기 (예: 2025년)"
              aria-label="통계 발표 시기"
              value={stat.period}
              onChange={(e) => setStat((s) => ({ ...s, period: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary gap-2 rounded-2xl" onClick={() => void saveStat()}>
              <Save className="h-4 w-4" aria-hidden />
              저장
            </button>
            <button type="button" className="btn btn-ghost rounded-2xl" onClick={() => void saveStat(true)}>
              카드 숨기기
            </button>
          </div>
        </div>
      </section>

      {/* 차시별 지도 안내 */}
      {SESSION_GUIDES.map((g) => (
        <section key={g.key} className="card rounded-2xl bg-base-100 shadow-sm">
          <div className="card-body gap-3 p-4">
            <h2 className="card-title text-base">
              <GraduationCap className="h-5 w-5 text-primary" aria-hidden />
              {g.title}
              <span className="badge badge-ghost rounded-2xl">{g.minutes}</span>
            </h2>

            <Block title="수업 목표">
              <ul className="list-inside list-disc text-sm">
                {g.goals.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </Block>

            <Block title="수업 흐름">
              <table className="table table-sm">
                <tbody>
                  {g.flow.map((f) => (
                    <tr key={f.step}>
                      <th className="w-20">{f.step}</th>
                      <td className="w-20 opacity-70">{f.minutes}</td>
                      <td>{f.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Block>

            <Block title="발문 예시">
              <ul className="list-inside list-disc text-sm">
                {g.questions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </Block>

            {g.sourceNote.length > 0 && (
              <Block title="사료 해설 (역사 교과가 아니어도 괜찮습니다)">
                <ul className="list-inside list-disc text-sm">
                  {g.sourceNote.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </Block>
            )}

            <Block title="유의점">
              <ul className="list-inside list-disc text-sm">
                {g.cautions.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </Block>

            <p className="text-xs opacity-70">사회정서학습 연계: {g.sel}</p>
          </div>
        </section>
      ))}

      {/* 교육과정 연계표 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">
            <ScrollText className="h-5 w-5 text-secondary" aria-hidden />
            교육과정 연계표
          </h2>
          <p className="text-sm font-semibold">{STANDARDS.unit}</p>

          <Block title="성취기준">
            <ul className="text-sm">
              {STANDARDS.items.map((i) => (
                <li key={i.code}>
                  <b>{i.code}</b> {i.text}
                </li>
              ))}
            </ul>
          </Block>
          <Block title="내용 요소">
            <p className="text-sm">{STANDARDS.contents.join(' · ')}</p>
          </Block>
          <Block title="과정·기능">
            <ul className="list-inside list-disc text-sm">
              {STANDARDS.skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Block>
          <Block title="가치·태도">
            <ul className="list-inside list-disc text-sm">
              {STANDARDS.values.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Block>
          <Block title="교수·학습 방향 반영">
            <ul className="list-inside list-disc text-sm">
              {DIRECTIONS.teaching.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Block>
          <Block title="평가 방향 반영">
            <ul className="list-inside list-disc text-sm">
              {DIRECTIONS.assessment.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Block>
          <Block title="사회정서학습 연계">
            <table className="table table-sm">
              <tbody>
                {SEL_MAP.map((s) => (
                  <tr key={s.session}>
                    <th className="w-24">{s.session}</th>
                    <td>{s.sel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Block>
        </div>
      </section>

      {/* 평가 기준 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">
            <ClipboardCheck className="h-5 w-5 text-accent" aria-hidden />
            평가 기준 (학생에게도 미리 공개됩니다)
          </h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>기준</th>
                  <th>학생용 쉬운 말</th>
                  <th>관련 차시</th>
                  <th>평가 방법</th>
                </tr>
              </thead>
              <tbody>
                {RUBRIC.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold">{r.formal}</td>
                    <td>{r.easy}</td>
                    <td>{r.sessions}</td>
                    <td>{r.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 가정 안내문 */}
      <section className="card rounded-2xl bg-base-100 shadow-sm">
        <div className="card-body gap-3 p-4">
          <h2 className="card-title text-base">
            <Printer className="h-5 w-5 text-success" aria-hidden />
            가정 안내문 인쇄용 템플릿
          </h2>
          <p className="text-sm opacity-70">
            학교명과 교사명은 가입 정보로 자동으로 채워집니다.
          </p>
          <Link to={`/teacher/letter/${cls.id}`} className="btn btn-outline w-fit rounded-2xl">
            안내문 열기
          </Link>
        </div>
      </section>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-base-200 p-3">
      <p className="mb-1 font-bold">{title}</p>
      {children}
    </div>
  );
}
