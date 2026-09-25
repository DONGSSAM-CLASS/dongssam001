import { PrincipleIcon } from './icons';
import type { Principle } from '../types/content';

/**
 * 원칙 원문 살펴보기 — 「대한민국 인공지능 윤리원칙」의 원칙 문장, 세부 항목, ‘이용자’ 역할 (원문 그대로)
 */
export function PrincipleDetail({ principle, open = false }: { principle: Principle; open?: boolean }) {
  return (
    <details className="dossier p-4" open={open}>
      <summary className="flex cursor-pointer items-center gap-2 text-[17px] font-bold">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white" style={{ backgroundColor: principle.color }}>
          <PrincipleIcon id={principle.id} className="h-5 w-5" />
        </span>
        {principle.name}
        <span className="text-[14px] font-normal text-ink-soft">{principle.english}</span>
      </summary>
      <div className="mt-3 flex flex-col gap-3 text-[16px]">
        <blockquote className="border-l-4 pl-3" style={{ borderColor: principle.color }}>
          {principle.official.map((o) => (
            <p key={o}>{o}</p>
          ))}
        </blockquote>
        <ul className="flex flex-col gap-2">
          {principle.aspects.map((a) => (
            <li key={a.tag} className="rounded-box bg-base-200 p-3">
              <p className="font-bold">
                [{a.tag}] <span className="font-normal">{a.statement}</span>
              </p>
              <p className="mt-1 text-[15px] font-bold text-ink-soft">AI 이용자인 우리가 할 일</p>
              <ul className="list-disc pl-5 text-[15px]">
                {a.userRole.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}
