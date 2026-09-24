import { useEffect, useState } from 'react';

/**
 * 시네마틱 이미지 — 있으면 쓰고, 없으면 조용히 사라진다.
 *
 * 이 게임의 3D 화면은 외부 파일 없이 코드로만 만들어진다. 여기에 더해
 * 힉스필드(Higgsfield) MCP 같은 도구로 만든 장면 이미지를
 * `public/assets/higgsfield/` 에 넣어 두면 인트로와 임무 화면에 자동으로 얹힌다.
 *
 * 파일이 없어도 게임은 그대로 돌아간다 — 학교에서 이미지를 못 만들어도
 * 수업에 지장이 없어야 하기 때문이다.
 *
 * 넣는 방법은 docs/HIGGSFIELD_MCP.md 참고.
 */
export function CinematicImage({
  name,
  alt,
  className,
  caption,
}: {
  /** 확장자를 뺀 파일 이름 (예: 'cover', 'quest-q-founding') */
  name: string;
  alt: string;
  className?: string;
  caption?: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // jpg → webp → png 순으로 찾아본다.
    const candidates = ['jpg', 'webp', 'png'].map(
      (ext) => `${import.meta.env.BASE_URL}assets/higgsfield/${name}.${ext}`,
    );
    const tryNext = (index: number) => {
      if (cancelled || index >= candidates.length) return;
      const image = new Image();
      image.onload = () => {
        if (!cancelled) setSrc(candidates[index]);
      };
      image.onerror = () => tryNext(index + 1);
      image.src = candidates[index];
    };
    tryNext(0);
    return () => {
      cancelled = true;
    };
  }, [name]);

  if (!src) return null;
  return (
    <figure className={`cinematic ${className ?? ''}`}>
      <img src={src} alt={alt} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
