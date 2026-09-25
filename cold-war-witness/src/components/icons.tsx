/**
 * 원칙·가치·감정 아이콘 (lucide-react). 글자 데이터(src/data)의 이모지는 인쇄물·인증서 이미지에만 쓰고,
 * 화면에서는 이 아이콘을 쓴다.
 */
import {
  BadgeCheck,
  ClipboardCheck,
  Eye,
  Gem,
  HandHeart,
  LockKeyhole,
  Scale,
  ShieldCheck,
  Sprout,
  UsersRound,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react';
import type { PrincipleId, ValueId } from '../types/content';

export const PRINCIPLE_ICON: Record<PrincipleId, LucideIcon> = {
  humanCentric: HandHeart,
  privacy: LockKeyhole,
  fairness: Scale,
  accountability: ClipboardCheck,
  safety: ShieldCheck,
  reliability: BadgeCheck,
  transparency: Eye,
};

export const VALUE_ICON: Record<ValueId, LucideIcon> = {
  dignity: Gem,
  commonGood: UsersRound,
  sustainability: Sprout,
};

export function PrincipleIcon({ id, ...props }: { id: PrincipleId } & LucideProps) {
  const Icon = PRINCIPLE_ICON[id];
  return <Icon aria-hidden="true" {...props} />;
}

export function ValueIcon({ id, ...props }: { id: ValueId } & LucideProps) {
  const Icon = VALUE_ICON[id];
  return <Icon aria-hidden="true" {...props} />;
}
