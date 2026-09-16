import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import { getClassById } from '../lib/db';
import { Loading } from '../components/States';
import { APP, HOME_TEXT, PASS_RULE_HINT } from '../content/lessons';
import type { ClassDoc } from '../lib/types';

/**
 * 가정 안내문 (A4 인쇄용).
 * 학교명·교사명은 선생님이 가입할 때 넣은 값으로 자동으로 채운다.
 */
export default function ParentLetter() {
  const { classId } = useParams<{ classId: string }>();
  const [cls, setCls] = useState<ClassDoc | null>(null);

  useEffect(() => {
    if (!classId) return;
    void getClassById(classId).then(setCls);
  }, [classId]);

  if (!cls) return <Loading />;

  return (
    <div className="min-h-screen bg-base-200 py-6">
      <div className="no-print mx-auto mb-4 flex max-w-[794px] justify-end px-4">
        <button type="button" className="btn btn-primary gap-2 rounded-2xl" onClick={() => window.print()}>
          <Printer className="h-4 w-4" aria-hidden />
          인쇄하기
        </button>
      </div>

      <div
        className="mx-auto w-[794px] max-w-full bg-white p-12 text-[14px] leading-8 text-[#2b2430]"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        <header className="border-b-4 border-[#e5a6c4] pb-4 text-center">
          <p className="text-sm font-bold text-[#a86a8c]">{cls.school}</p>
          <h1 className="mt-2 text-2xl font-extrabold">가정 안내문</h1>
          <p className="mt-1 text-base font-bold">「{APP.name}」 4주 실천 안내</p>
        </header>

        <p className="mt-6">보호자님께,</p>
        <p className="mt-2">
          안녕하세요. {cls.name} 담임 {cls.teacherName} 선생님입니다. 우리 반은 역사 수업에서
          정약용이 유배지에서 시간을 보낸 방법을 배우고, 그것을 바탕으로 학생 스스로 스마트폰 사용
          규칙을 정하는 활동을 했습니다.
        </p>

        <h2 className="mt-6 border-l-4 border-[#e5a6c4] pl-2 text-lg font-extrabold">활동의 취지</h2>
        <p className="mt-2">
          이 활동은 스마트폰을 못 쓰게 하는 것이 목적이 아닙니다. 학생이 <b>스스로 시간을 정하는
          경험</b>을 해 보는 것이 목적입니다. 학생들은 직접 “언제, 무엇을, 대신 무엇을 할지”를 정해
          ‘나만의 다산초당 출입증’을 만들었습니다.
        </p>
        <p className="mt-2 rounded-xl bg-[#fdf2d3] p-3">{PASS_RULE_HINT}</p>

        {cls.commonTime && (
          <>
            <h2 className="mt-6 border-l-4 border-[#e5a6c4] pl-2 text-lg font-extrabold">
              학급 공동 운영 시간
            </h2>
            <p className="mt-2">
              우리 반은 <b>매일 {cls.commonTime.start} ~ {cls.commonTime.end}</b> 를 함께 지키는
              시간으로 정했습니다. 이 시간에는 학생들끼리 서로 연락하지 않기로 약속했습니다.
            </p>
          </>
        )}

        <h2 className="mt-6 border-l-4 border-[#e5a6c4] pl-2 text-lg font-extrabold">
          보호자께 드리는 부탁
        </h2>
        <p className="mt-2">
          사용 시간을 감시하기보다 아이가 정한 규칙을 존중하고 응원해 주세요. 규칙을 지키지 못한
          날이 있어도 괜찮습니다. {HOME_TEXT.encourage}
        </p>
        <p className="mt-2">
          매주 자기점검표에 <b>보호자 응원 한 줄</b> 칸이 있습니다. 한 문장으로 격려해 주시면 큰
          힘이 됩니다. (보호자 성함은 적지 않습니다.)
        </p>

        <h2 className="mt-6 border-l-4 border-[#e5a6c4] pl-2 text-lg font-extrabold">개인정보 안내</h2>
        <p className="mt-2">
          이 활동에서는 학생의 이메일이나 전화번호를 받지 않습니다. 학생이 적은 사용 시간은
          <b> 본인과 담당 교사만</b> 볼 수 있으며, 친구들에게는 보이지 않습니다.
        </p>

        <p className="mt-10 text-right">
          {new Date().toLocaleDateString('ko-KR')}
          <br />
          {cls.school} {cls.name} 담임 {cls.teacherName} 드림
        </p>
      </div>
    </div>
  );
}
