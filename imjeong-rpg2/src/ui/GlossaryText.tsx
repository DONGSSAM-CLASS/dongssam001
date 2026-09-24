import { Fragment, useState, type ReactNode } from 'react';
import { glossaryTerms, type GlossaryEntry } from '../data/glossary';

/**
 * 본문에 낱말 풀이를 자동으로 달아 준다.
 *
 * 중1이 읽다가 「조계」·「준승」 같은 말에서 막히면 그 순간 게임이 끝난다.
 * 본문을 훑어 아는 낱말이 나오면 점선 밑줄을 긋고, 누르면 뜻을 띄운다.
 * 원문(사료) 발췌에는 적용하지 않는다 — 원문은 원문 그대로 보여 줘야 하기 때문이다.
 */
export function GlossaryText({ children }: { children: string }) {
  const [open, setOpen] = useState<GlossaryEntry | null>(null);
  return (
    <>
      {annotate(children, (hit, key) => (
        <button
          key={key}
          type="button"
          className="glossary-word"
          onClick={(event) => {
            event.stopPropagation();
            setOpen((current) => (current === hit.entry ? null : hit.entry));
          }}
        >
          {hit.label}
        </button>
      ))}
      {open && (
        <span className="glossary-pop" role="note">
          <strong>
            {open.term}
            {open.hanja ? ` (${open.hanja})` : ''}
          </strong>
          {open.meaning}
          <button className="btn small ghost" onClick={() => setOpen(null)}>
            닫기
          </button>
        </span>
      )}
    </>
  );
}

interface Hit {
  entry: GlossaryEntry;
  label: string;
}

/**
 * 문자열을 훑어 낱말을 찾아 낸다.
 * 한 낱말은 한 문단에서 **처음 나올 때만** 표시한다 — 밑줄이 도배되면 오히려 읽기 힘들다.
 */
function annotate(
  text: string,
  render: (hit: Hit, key: string) => ReactNode,
): ReactNode[] {
  const used = new Set<string>();
  const nodes: ReactNode[] = [];
  let buffer = '';
  let i = 0;
  let keyIndex = 0;

  while (i < text.length) {
    let matched: { key: string; entry: GlossaryEntry } | null = null;
    for (const candidate of glossaryTerms) {
      if (used.has(candidate.entry.term)) continue;
      if (text.startsWith(candidate.key, i)) {
        matched = candidate;
        break;
      }
    }
    if (matched) {
      if (buffer) {
        nodes.push(<Fragment key={`t${keyIndex++}`}>{buffer}</Fragment>);
        buffer = '';
      }
      used.add(matched.entry.term);
      nodes.push(render({ entry: matched.entry, label: matched.key }, `g${keyIndex++}`));
      i += matched.key.length;
    } else {
      buffer += text[i];
      i += 1;
    }
  }
  if (buffer) nodes.push(<Fragment key={`t${keyIndex++}`}>{buffer}</Fragment>);
  return nodes;
}
