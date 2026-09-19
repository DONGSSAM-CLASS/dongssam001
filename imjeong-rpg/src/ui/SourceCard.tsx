import { useState } from 'react';
import type { Level, SourceRef } from '../types';
import { GlossaryText } from './GlossaryText';

/**
 * 사료 카드 — 원문(발췌) · 수준별 해석 · APA 출처 · 검증 안내를 한 묶음으로 보여 준다.
 * 대사나 해설 밑에 붙여서, 학생이 "어디서 나온 이야기인지" 늘 확인할 수 있게 한다.
 */
export function SourceCard({ source, level }: { source: SourceRef; level: Level }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="source-card">
      <button className="source-head" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="source-kind">{source.kind}</span>
        <span className="source-title">{source.title}</span>
        <span aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="source-body">
          <div className="source-original">{source.original}</div>
          <div className="source-interp">
            <GlossaryText>{source.interpretation[level]}</GlossaryText>
          </div>
          <div className="source-cite">출처 · {source.citationApa}</div>
          {source.note && <div className="source-note">※ {source.note}</div>}
        </div>
      )}
    </div>
  );
}
