/**
 * 감정 체크 (K-SEL 자기인식) — 선택 전 "지금 이 인물의 마음은?"
 */
import type { EmotionOption } from '../types/content';

export const EMOTION_PROMPT = '지금 이 인물의 마음은?';

export const EMOTIONS: EmotionOption[] = [
  { id: 'anxious', emoji: '😟', label: '불안' },
  { id: 'afraid', emoji: '😨', label: '두려움' },
  { id: 'angry', emoji: '😠', label: '분노' },
  { id: 'hesitant', emoji: '🤔', label: '망설임' },
  { id: 'calm', emoji: '😌', label: '평온' },
];
