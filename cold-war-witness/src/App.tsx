import { APP_TITLE } from './config';

/**
 * Phase 1 뼈대. 실제 화면(입장·챕터·교사 대시보드)은 Phase 3~4 에서 채운다.
 */
export default function App() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <p className="font-mono text-sm tracking-widest text-stamp">기밀 · CLASSIFIED</p>
      <h1 className="mt-2 font-mono text-3xl font-bold text-ink">{APP_TITLE}</h1>
      <p className="mt-4 text-ink/80">개발 중입니다. (Phase 1: 프로젝트 뼈대)</p>
    </main>
  );
}
