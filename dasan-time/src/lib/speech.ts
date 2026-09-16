/**
 * 긴 안내문을 소리로 읽어 주는 기능 (Web Speech API).
 * 글을 읽기 어려워하는 학생도 혼자 따라올 수 있게 돕는다.
 */
export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string, onEnd?: () => void) {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ko-KR';
  utter.rate = 0.95; // 조금 느리게 읽어 준다.
  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
}
