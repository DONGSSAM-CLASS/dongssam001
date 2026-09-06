import { COPYRIGHT_FOOTER } from './constants';

/**
 * 1단계 골격 화면.
 * 실제 기능(단원 트리, 히트맵, 검색 등)은 이후 단계에서 추가한다.
 */
export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white px-4 py-3">
        <h1 className="text-lg font-bold">한국사 수능 기출 단원 연동</h1>
        <p className="text-sm text-slate-500">
          2022 개정 교육과정 연계 · 학습용 메타데이터
        </p>
      </header>

      <main className="flex-1 p-4">
        <p className="text-slate-600">프로젝트 골격 준비 완료 (1단계).</p>
      </main>

      <footer className="border-t bg-white px-4 py-3 text-xs text-slate-500">
        {COPYRIGHT_FOOTER}
      </footer>
    </div>
  );
}
