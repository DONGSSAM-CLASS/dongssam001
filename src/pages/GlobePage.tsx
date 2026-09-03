import { Link } from 'react-router-dom';
import { GlobeCanvas } from '@/components/globe/GlobeCanvas';
import { Timeline } from '@/components/timeline/Timeline';
import { DetailPanel } from '@/components/panels/DetailPanel';
import { ComparePanel } from '@/components/panels/ComparePanel';
import { LayerPanel } from '@/components/panels/LayerPanel';
import { ListView } from '@/components/panels/ListView';
import { SearchBox } from '@/components/panels/SearchBox';
import { useGlobeStore } from '@/store/globeStore';

/** 지구본 탐색 화면 (공통) — 2단계: 자유 탐색 모드 */
export default function GlobePage() {
  const listMode = useGlobeStore((s) => s.listMode);
  return (
    <div className="relative h-full w-full overflow-hidden">
      {listMode ? <ListView /> : <GlobeCanvas />}

      {/* 오버레이 UI */}
      <div className="pointer-events-none absolute inset-0 z-[60] flex flex-col p-3 gap-2">
        <header className="pointer-events-auto flex items-center gap-3">
          <Link to="/" className="text-lg font-bold">🌏 History Globe</Link>
          <span className="text-xs text-slate-400 hidden sm:inline">자유 탐색 모드</span>
          <div className="ml-auto"><SearchBox /></div>
        </header>
        <div className="flex flex-1 min-h-0 items-start justify-between gap-2">
          <LayerPanel />
          <DetailPanel />
        </div>
        <div className="pointer-events-auto flex flex-col gap-2">
          <ComparePanel />
          <Timeline />
        </div>
      </div>
    </div>
  );
}
