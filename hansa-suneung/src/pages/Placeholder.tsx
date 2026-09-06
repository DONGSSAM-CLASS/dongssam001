/** 이후 단계에서 구현될 화면의 임시 자리표시자. */
export default function Placeholder({ title }: { title: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-lg border border-dashed bg-white text-slate-400">
      {title} — 준비 중
    </div>
  );
}
