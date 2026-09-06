import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import QRCode from 'qrcode';
import { useData } from '../../data/DataContext';
import { flattenUnits, unitPath } from '../../lib/units';

/**
 * 필터 상태 공유 (기능 11).
 * 현재 필터(단원·학년도)를 URL 쿼리로 인코딩하고, 오프라인 QR 라이브러리(qrcode, 번들 포함)로
 * QR 코드를 생성한다. 외부 API 를 호출하지 않는다.
 */
export default function SharePage() {
  const { curriculum, unitById, schoolYears } = useData();
  const [unit, setUnit] = useState('');
  const [year, setYear] = useState('');
  const [dataUrl, setDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const leaves = useMemo(
    () => flattenUnits(curriculum.units).filter((f) => !f.unit.children?.length),
    [curriculum],
  );

  const shareUrl = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin + import.meta.env.BASE_URL : '/';
    const params = new URLSearchParams();
    if (unit) params.set('unit', unit);
    if (year) params.set('year', year);
    const qs = params.toString();
    return `${origin}${qs ? '?' + qs : ''}`;
  }, [unit, year]);

  useEffect(() => {
    QRCode.toDataURL(shareUrl, { width: 240, margin: 1 })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, [shareUrl]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 무시 */
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">필터 공유 (QR)</h1>
          <p className="text-sm text-slate-500">
            단원·학년도 필터를 링크와 QR 코드로 공유합니다. QR은 오프라인으로 생성되어 외부 서버를 쓰지 않습니다.
          </p>
        </div>
        <Link to="/teacher" className="text-sm text-blue-600 hover:underline">← 교사용 홈</Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_260px]">
        <div className="space-y-3 rounded-lg border bg-white p-4">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">단원</span>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-md border px-2 py-1.5"
            >
              <option value="">(전체)</option>
              {leaves.map((f) => (
                <option key={f.unit.id} value={f.unit.id}>
                  {unitPath(unitById, f.unit.id)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-500">학년도</span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-md border px-2 py-1.5"
            >
              <option value="">(전체)</option>
              {schoolYears
                .slice()
                .sort((a, b) => b - a)
                .map((y) => (
                  <option key={y} value={y}>
                    {y}학년도
                  </option>
                ))}
            </select>
          </label>

          <div>
            <span className="mb-1 block text-sm text-slate-500">공유 링크</span>
            <div className="flex gap-2">
              <input readOnly value={shareUrl} className="w-full rounded-md border bg-slate-50 px-2 py-1.5 text-sm" />
              <button onClick={copy} className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                {copied ? '복사됨' : '복사'}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border bg-white p-4">
          {dataUrl ? (
            <img src={dataUrl} alt="공유 QR 코드" width={240} height={240} />
          ) : (
            <div className="flex h-[240px] w-[240px] items-center justify-center text-sm text-slate-400">
              QR 생성 중…
            </div>
          )}
          <p className="mt-2 text-xs text-slate-400">학생이 휴대폰으로 스캔</p>
        </div>
      </div>
    </div>
  );
}
