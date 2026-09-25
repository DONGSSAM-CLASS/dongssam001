/**
 * 한국어 조사 고르기: 앞말의 마지막 글자에 받침이 있으면 ‘을’, 없으면 ‘를’.
 * 한글로 끝나지 않으면(영어·숫자 등) ‘을(를)’ 로 둔다.
 */
export function eulReul(word: string): string {
  const w = word.trim();
  const last = w.charCodeAt(w.length - 1);
  if (last >= 0xac00 && last <= 0xd7a3) return (last - 0xac00) % 28 === 0 ? '를' : '을';
  return '을(를)';
}

/** 선언문 문장 */
export function declarationSentence(d: { keep: string; era: string; lesson: string }): string {
  return `나는 AI를 사용할 때 ${d.keep}${eulReul(d.keep)} 지키겠습니다. 왜냐하면 냉전 시대의 ${d.era}에서 ${d.lesson}${eulReul(d.lesson)} 배웠기 때문입니다.`;
}
