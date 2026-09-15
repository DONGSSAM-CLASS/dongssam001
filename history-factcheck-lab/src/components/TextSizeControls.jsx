import { useEffect, useState } from 'react';

// 글자 크기 3단계 (본문 16px 이상 유지)
const SIZES = [
  { key: 'small', label: '작게', value: '16px' },
  { key: 'medium', label: '보통', value: '17px' },
  { key: 'large', label: '크게', value: '19px' },
];

const STORAGE_KEY = 'hfl.textSize';

export default function TextSizeControls() {
  const [sizeKey, setSizeKey] = useState('medium');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && SIZES.some((s) => s.key === saved)) setSizeKey(saved);
    } catch {
      // 사생활 보호 모드 등에서 접근이 막혀도 기본값으로 동작한다.
    }
  }, []);

  useEffect(() => {
    const size = SIZES.find((s) => s.key === sizeKey) ?? SIZES[1];
    document.documentElement.style.setProperty('--app-font-size', size.value);
    try {
      window.localStorage.setItem(STORAGE_KEY, sizeKey);
    } catch {
      // 저장 실패는 무시한다.
    }
  }, [sizeKey]);

  return (
    <div className="flex items-center gap-1" role="group" aria-label="글자 크기 조절">
      {SIZES.map((size) => (
        <button
          key={size.key}
          type="button"
          onClick={() => setSizeKey(size.key)}
          aria-pressed={sizeKey === size.key}
          className={[
            'rounded-sm border px-2 py-1 text-xs transition-colors duration-150',
            sizeKey === size.key
              ? 'border-kraft-light bg-kraft-light text-ink'
              : 'border-kraft-light/40 text-kraft-light/85 hover:bg-ink-soft',
          ].join(' ')}
        >
          {size.label}
        </button>
      ))}
    </div>
  );
}
