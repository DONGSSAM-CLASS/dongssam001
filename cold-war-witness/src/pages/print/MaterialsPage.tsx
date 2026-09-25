/**
 * 수업 자료 인쇄 페이지 — 브라우저 인쇄(Ctrl+P)로 A4 인쇄 또는 PDF 저장.
 * 모든 문장은 src/data/lessonMaterials.ts · curriculum.ts · scenarios.ts · facts.ts 에서 가져온다.
 */
import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '../../components/ui';
import { MotionToggle } from '../../components/Layout';
import { LESSON_PLANS, TEACHER_GUIDE, WORKSHEETS } from '../../data/lessonMaterials';
import { getChapter } from '../../data/scenarios';
import { getPrinciple } from '../../data/principles';
import { FACTS } from '../../data/facts';
import {
  FINALE_CURRICULUM,
  HISTORY_DOC,
  HISTORY_QUOTES,
  HISTORY_STANDARDS,
  KSEL_COMPETENCIES,
  KSEL_DOC,
  KSEL_QUOTES,
  KSEL_STANDARDS,
  getKselCompetency,
  getKselStandard,
} from '../../data/curriculum';
import { APP_TITLE } from '../../config';
import type { CurriculumLink, LessonPlan, Worksheet } from '../../types/content';

type DocKey = `plan${1 | 2 | 3}` | `sheet${1 | 2 | 3}` | 'guide' | 'curriculum' | 'all';

const DOCS: [DocKey, string][] = [
  ['plan1', '1차시 과정안'],
  ['plan2', '2차시 과정안'],
  ['plan3', '3차시 과정안'],
  ['sheet1', '1차시 활동지'],
  ['sheet2', '2차시 활동지'],
  ['sheet3', '3차시 활동지'],
  ['guide', '교사용 가이드'],
  ['curriculum', '교육과정 연계표'],
  ['all', '전체'],
];

export default function MaterialsPage() {
  const [doc, setDoc] = useState<DocKey>('plan1');
  const show = (k: DocKey) => doc === 'all' || doc === k;
  return (
    <div className="min-h-screen bg-base-200 print:bg-white">
      <div className="no-print sticky top-0 z-10 border-b border-base-300 bg-base-100/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-2">
          <Link to="/teacher" className="link inline-flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            선생님 화면
          </Link>
          <label className="ml-2 flex items-center gap-2">
            <span className="font-bold">자료</span>
            <select value={doc} onChange={(e) => setDoc(e.target.value as DocKey)} className="select h-11 border-2 border-base-300 bg-white">
              {DOCS.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={() => window.print()}>
            <Printer className="h-5 w-5" aria-hidden="true" />
            인쇄 / PDF로 저장
          </Button>
          <span className="text-[14px] text-ink-soft">인쇄 창에서 ‘PDF로 저장’을 고르면 파일로 저장돼요. (용지 A4)</span>
          <span className="ml-auto">
            <MotionToggle />
          </span>
        </div>
      </div>
      <div className="mx-auto flex max-w-[210mm] flex-col gap-6 py-6 print:max-w-none print:gap-0 print:py-0">
        {LESSON_PLANS.map((p) => show(`plan${p.session}` as DocKey) && <PlanPrint key={p.session} plan={p} />)}
        {WORKSHEETS.map((w) => show(`sheet${w.session}` as DocKey) && <SheetPrint key={w.session} sheet={w} />)}
        {show('guide') && <GuidePrint />}
        {show('curriculum') && <CurriculumPrint />}
      </div>
    </div>
  );
}

function Page({ children }: { children: ReactNode }) {
  return (
    <section className="print-page bg-white px-[14mm] py-[14mm] text-[14px] leading-relaxed text-ink shadow-lg print:px-0 print:py-0 print:shadow-none">
      {children}
    </section>
  );
}

const th = 'border border-ink bg-[#efe8d8] px-2 py-1 text-left align-top font-bold';
const td = 'border border-ink px-2 py-1 align-top';

function LinkTable({ link }: { link: CurriculumLink }) {
  return (
    <table className="avoid-break mt-2 w-full border-collapse">
      <tbody>
        <tr>
          <th className={`${th} w-28`}>역사 성취기준</th>
          <td className={td}>
            {link.history.standards.map((c) => (
              <div key={c}>
                <strong>{c}</strong> {HISTORY_STANDARDS.find((s) => s.code === c)?.text}
              </div>
            ))}
          </td>
        </tr>
        <tr>
          <th className={th}>역사 내용 요소</th>
          <td className={td}>
            지식·이해: {link.history.knowledge.join(', ')}
            <br />
            과정·기능: {link.history.skills.join(', ')}
            <br />
            가치·태도: {link.history.values.join(', ')}
          </td>
        </tr>
        <tr>
          <th className={th}>K-SEL 역량</th>
          <td className={td}>
            {link.ksel.competencies.map((id) => getKselCompetency(id).name).join(' · ')} / 영역: {link.ksel.domains.join(', ')}
          </td>
        </tr>
        <tr>
          <th className={th}>K-SEL 성취기준</th>
          <td className={td}>
            {link.ksel.standards.map((c) => (
              <div key={c}>
                <strong>{c}</strong> {getKselStandard(c).text}
              </div>
            ))}
          </td>
        </tr>
        <tr>
          <th className={th}>K-SEL 내용 요소</th>
          <td className={td}>
            지식·이해: {link.ksel.knowledge.join(', ')}
            <br />
            과정·기능: {link.ksel.skills.join(', ')}
            <br />
            가치·태도: {link.ksel.values.join(', ')}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function PlanPrint({ plan }: { plan: LessonPlan }) {
  const ch = getChapter(plan.chapter);
  return (
    <Page>
      <p className="text-[12px] text-ink-soft">
        {APP_TITLE} · 교수·학습 과정안 · 중학교 역사① {HISTORY_DOC.area}
      </p>
      <h1 className="typewriter mt-1 text-[20px] font-bold">
        {plan.session}차시 — {plan.title}
      </h1>
      <table className="mt-2 w-full border-collapse">
        <tbody>
          <tr>
            <th className={`${th} w-28`}>학습 목표</th>
            <td className={td}>
              <ol className="list-decimal pl-5">
                {plan.objectives.map((o) => (
                  <li key={o}>{o}</li>
                ))}
              </ol>
            </td>
          </tr>
          <tr>
            <th className={th}>AI 윤리원칙</th>
            <td className={td}>{plan.principleIds.map((id) => `${getPrinciple(id).icon} ${getPrinciple(id).name}`).join(' · ')}</td>
          </tr>
          <tr>
            <th className={th}>앱 챕터</th>
            <td className={td}>
              CHAPTER {ch.no} 「{ch.title}」 ({ch.period}, {ch.place}) — 인물: {ch.character.name}({ch.character.role}, 가상 인물)
            </td>
          </tr>
          <tr>
            <th className={th}>준비물</th>
            <td className={td}>{plan.materials.join(', ')}</td>
          </tr>
        </tbody>
      </table>
      <LinkTable link={plan.curriculum} />
      <table className="mt-3 w-full border-collapse">
        <thead>
          <tr>
            <th className={`${th} w-16`}>단계</th>
            <th className={th}>교사 활동</th>
            <th className={th}>학생 활동</th>
            <th className={`${th} w-44`}>앱 · 유의점</th>
          </tr>
        </thead>
        <tbody>
          {plan.steps.map((s) => (
            <tr key={s.stage} className="avoid-break">
              <td className={`${td} font-bold`}>
                {s.stage}
                <br />({s.minutes}분)
              </td>
              <td className={td}>
                <ul className="list-disc pl-4">
                  {s.teacher.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </td>
              <td className={td}>
                <ul className="list-disc pl-4">
                  {s.student.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </td>
              <td className={td}>
                {s.app && <p className="font-bold">[앱] {s.app}</p>}
                {s.notes && (
                  <ul className="mt-1 list-disc pl-4">
                    {s.notes.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="avoid-break mt-3">
        <p className="font-bold">평가</p>
        <ul className="list-disc pl-5">
          {plan.assessment.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </div>
    </Page>
  );
}

function Lines({ n }: { n: number }) {
  return (
    <div aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="h-8 border-b border-dashed border-ink-soft" />
      ))}
    </div>
  );
}

function SheetPrint({ sheet }: { sheet: Worksheet }) {
  const ch = getChapter(sheet.chapter);
  return (
    <Page>
      <div className="flex items-end justify-between gap-4 border-b-2 border-ink pb-2">
        <div>
          <p className="text-[12px] text-ink-soft">{APP_TITLE}</p>
          <h1 className="typewriter text-[20px] font-bold">{sheet.title}</h1>
        </div>
        <p className="shrink-0 text-[14px]">2학년 ___반 ___번 이름: ____________</p>
      </div>
      <p className="mt-1 text-[12px] text-ink-soft">
        나는 CHAPTER {ch.no}에서 {ch.character.role} ‘{ch.character.name}’(가상 인물)이 됩니다.
      </p>
      {sheet.sections.map((sec) => (
        <div key={sec.heading} className="avoid-break mt-4">
          <h2 className="font-bold">{sec.heading}</h2>
          {sec.instruction && <p className="text-[13px] text-ink-soft">{sec.instruction}</p>}
          {sec.type === 'emotionTable' && (
            <table className="mt-1 w-full border-collapse">
              <thead>
                <tr>
                  <th className={`${th} w-44`}>장면</th>
                  {(sec.columns ?? ['고른 감정', '그 까닭']).map((c, i) => (
                    <th key={c} className={`${th} ${i === 0 ? 'w-28' : ''}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ch.scenes.map((s) => (
                  <tr key={s.id}>
                    <td className={`${td} h-10`}>
                      {s.no}. {s.title}
                    </td>
                    {(sec.columns ?? ['', '']).map((c) => (
                      <td key={c} className={td} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {sec.type === 'appReflection' &&
            ch.reflection.questions.map((q, i) => (
              <div key={q.id} className="mt-2">
                <p>
                  질문 {i + 1}. {q.text}
                </p>
                <Lines n={sec.lines ?? 3} />
              </div>
            ))}
          {sec.type === 'questions' &&
            sec.items?.map((q) => (
              <div key={q} className="mt-2">
                <p>• {q}</p>
                <Lines n={sec.lines ?? 2} />
              </div>
            ))}
          {sec.type === 'lines' && <Lines n={sec.lines ?? 4} />}
          {sec.type === 'checklist' && (
            <ul className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
              {sec.items?.map((it) => (
                <li key={it}>☐ {it}</li>
              ))}
            </ul>
          )}
          {sec.type === 'selfAssessment' && (
            <table className="mt-1 w-full border-collapse">
              <tbody>
                {sec.items?.map((it) => (
                  <tr key={it}>
                    <td className={td}>{it}</td>
                    <td className={`${td} w-28 text-center text-[18px] tracking-widest`}>☆☆☆</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
      <p className="mt-4 text-[11px] text-ink-soft">※ 앱의 인물은 실제 역사적 상황을 바탕으로 만든 가상 인물입니다.</p>
    </Page>
  );
}

function GuidePrint() {
  return (
    <Page>
      <p className="text-[12px] text-ink-soft">{APP_TITLE}</p>
      <h1 className="typewriter text-[20px] font-bold">{TEACHER_GUIDE.title}</h1>
      {TEACHER_GUIDE.sections.map((sec, idx) => (
        <div key={sec.heading} className="mt-4">
          <h2 className="border-b border-ink font-bold">{sec.heading}</h2>
          {sec.paragraphs?.map((p) => (
            <p key={p} className="mt-1">
              {p}
            </p>
          ))}
          {sec.bullets && (
            <ul className="mt-1 list-disc pl-5">
              {sec.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          {sec.qa && (
            <table className="mt-1 w-full border-collapse">
              <thead>
                <tr>
                  <th className={th}>발문</th>
                  <th className={th}>예상 학생 반응</th>
                  <th className={th}>지도 팁</th>
                </tr>
              </thead>
              <tbody>
                {sec.qa.map((q) => (
                  <tr key={q.prompt} className="avoid-break">
                    <td className={td}>{q.prompt}</td>
                    <td className={td}>
                      {q.responses.map((r) => (
                        <div key={r}>{r}</div>
                      ))}
                    </td>
                    <td className={td}>{q.tip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {/* 마지막 절: 역사 사실 출처 목록 (facts.ts 에서 자동) */}
          {idx === TEACHER_GUIDE.sections.length - 1 && (
            <table className="mt-1 w-full border-collapse text-[12px]">
              <thead>
                <tr>
                  <th className={th}>챕터</th>
                  <th className={th}>사실 카드</th>
                  <th className={th}>출처</th>
                </tr>
              </thead>
              <tbody>
                {FACTS.map((f) => (
                  <tr key={f.id} className="avoid-break">
                    <td className={`${td} whitespace-nowrap`}>CH{f.chapter.slice(2)}</td>
                    <td className={td}>
                      <strong>{f.title}</strong>
                      {f.dateLabel ? ` (${f.dateLabel})` : ''} — {f.body}
                    </td>
                    <td className={`${td} break-all`}>
                      {f.source.org}
                      {f.source.url && (
                        <>
                          <br />
                          {f.source.url}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </Page>
  );
}

function CurriculumPrint() {
  return (
    <Page>
      <p className="text-[12px] text-ink-soft">{APP_TITLE}</p>
      <h1 className="typewriter text-[20px] font-bold">교육과정 연계표</h1>
      <p className="text-[12px] text-ink-soft">
        출처: ① {HISTORY_DOC.title} ② 「{KSEL_DOC.title}」({KSEL_DOC.reportNo}, {KSEL_DOC.publisher}, {KSEL_DOC.year})
      </p>
      <h2 className="mt-3 font-bold">K-SEL 4대 사회정서역량 (중학교 목표)</h2>
      <table className="mt-1 w-full border-collapse">
        <tbody>
          {KSEL_COMPETENCIES.map((c) => (
            <tr key={c.id}>
              <th className={`${th} w-28`}>{c.name}</th>
              <td className={td}>{c.middleSchoolGoal}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="mt-3 font-bold">K-SEL 중학교 성취기준</h2>
      <table className="mt-1 w-full border-collapse">
        <tbody>
          {KSEL_STANDARDS.map((s) => (
            <tr key={s.code}>
              <th className={`${th} w-28`}>{s.code}</th>
              <td className={td}>
                ({s.domain}) {s.text}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {[1, 2, 3].map((no) => (
        <div key={no} className="mt-3">
          <h2 className="font-bold">
            {no}차시 · CHAPTER {no} 「{getChapter(`ch${no}` as 'ch1').title}」
          </h2>
          <LinkTable link={getChapter(`ch${no}` as 'ch1').curriculum} />
        </div>
      ))}
      <div className="mt-3">
        <h2 className="font-bold">3차시 후반 · 나의 AI 윤리 실천 선언문</h2>
        <LinkTable link={FINALE_CURRICULUM} />
      </div>
      <h2 className="mt-4 font-bold">설계 근거 — 교육과정 원문과 이 앱의 반영</h2>
      <table className="mt-1 w-full border-collapse text-[12px]">
        <thead>
          <tr>
            <th className={th}>문서 · 위치</th>
            <th className={th}>원문</th>
            <th className={th}>이 앱에서</th>
          </tr>
        </thead>
        <tbody>
          {[...HISTORY_QUOTES.map((q) => ({ ...q, doc: '역사' })), ...KSEL_QUOTES.map((q) => ({ ...q, doc: 'K-SEL' }))].map((q) => (
            <tr key={q.text} className="avoid-break">
              <td className={`${td} w-36`}>
                {q.doc} · {q.where}
              </td>
              <td className={td}>{q.text}</td>
              <td className={`${td} w-48`}>{q.applied}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Page>
  );
}
