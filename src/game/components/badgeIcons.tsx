import { Compass, Flag, Users, ScrollText, Radio, Plane, Sunrise, Award, type LucideIcon } from 'lucide-react';

/** 챕터 배지 아이콘 이름 → lucide 아이콘 */
const MAP: Record<string, LucideIcon> = {
  compass: Compass,
  flag: Flag,
  users: Users,
  'scroll-text': ScrollText,
  radio: Radio,
  plane: Plane,
  sunrise: Sunrise,
};

export function BadgeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name] ?? Award;
  return <Icon className={className} aria-hidden />;
}
