import type { ReactNode } from 'react';
import { GlobeCanvas } from '@/components/globe/GlobeCanvas';
import { Timeline } from '@/components/timeline/Timeline';
import { DetailPanel } from '@/components/panels/DetailPanel';
import { ComparePanel } from '@/components/panels/ComparePanel';
import { LayerPanel } from '@/components/panels/LayerPanel';
import { ListView } from '@/components/panels/ListView';
import { SearchBox } from '@/components/panels/SearchBox';
import { useGlobeStore } from '@/store/globeStore';

interface Props {
  /** 헤더 왼쪽(제목·모드 표시) */
  header: ReactNode;
  /** 왼쪽 레이어 패널 아래에 붙는 도구 패널(학생 도구 등) */
  leftExtra?: ReactNode;
  /** 오른쪽 상세 패널 위에 붙는 패널(미션 등) */
  rightExtra?: ReactNode;
  hideCompare?: boolean;
}

/** 지구본 + 공통 UI 레이아웃. 자유/학생/교사 화면이 공유한다. */
export function GlobeWorkspace({ header, leftExtra, rightExtra, hideCompare }: Props) {
  const listMode = useGlobeStore((s) => s.listMode);
  return (
    <div className="relative h-full w-full overflow-hidden">
      {listMode ? <ListView /> : <GlobeCanvas />}
      <div className="pointer-events-none absolute inset-0 z-[60] flex flex-col p-3 gap-2">
        <header className="pointer-events-auto flex items-center gap-3 flex-wrap">
          {header}
          <div className="ml-auto"><SearchBox /></div>
        </header>
        <div className="flex flex-1 min-h-0 items-start justify-between gap-2">
          {/* 좌우 패널은 화면을 넘어가면 각자 스크롤한다(작은 태블릿에서 내용이 잘리지 않도록) */}
          <div className="flex flex-col gap-2 min-h-0 max-h-full overflow-y-auto pointer-events-auto">
            <LayerPanel />
            {leftExtra}
          </div>
          <div className="flex flex-col gap-2 items-end min-h-0 max-h-full overflow-y-auto pointer-events-auto">
            {rightExtra}
            <DetailPanel />
          </div>
        </div>
        <div className="pointer-events-auto flex flex-col gap-2">
          {!hideCompare && <ComparePanel />}
          <Timeline />
        </div>
      </div>
    </div>
  );
}
