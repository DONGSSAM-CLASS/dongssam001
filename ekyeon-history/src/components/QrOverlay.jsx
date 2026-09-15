import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { Check, Copy, ExternalLink, X } from 'lucide-react';

// 교실 화면·빔프로젝터에 전면 송출하는 QR 오버레이입니다.
// QR 은 qrcode 패키지로 캔버스에 직접 그립니다(외부 QR 이미지 API 호출 없음).
const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export default function QrOverlay({ title, url, onClose }) {
  const canvasRef = useRef(null);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const wakeLockRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [drawError, setDrawError] = useState('');

  // QR 그리기 — 화면 짧은 변의 약 65%(최소 280px)를 표시 크기로 씁니다.
  // 캔버스는 실제 화면 폭에 맞춰 정사각형으로 직접 지정합니다(가로 360px 대응).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const availableWidth = () => {
      const dialog = dialogRef.current;
      if (!dialog) return window.innerWidth - 80;
      const dialogStyle = window.getComputedStyle(dialog);
      const frame = canvas.parentElement;
      const frameStyle = frame ? window.getComputedStyle(frame) : null;
      const pad = (style, side) => (style ? parseFloat(style[`padding${side}`]) || 0 : 0);
      return (
        dialog.clientWidth
        - pad(dialogStyle, 'Left') - pad(dialogStyle, 'Right')
        - pad(frameStyle, 'Left') - pad(frameStyle, 'Right')
      );
    };

    const draw = async () => {
      const shortSide = Math.min(window.innerWidth, window.innerHeight);
      const wanted = Math.max(280, Math.round(shortSide * 0.65));
      const display = Math.max(200, Math.min(wanted, Math.floor(availableWidth())));
      try {
        await QRCode.toCanvas(canvas, url, {
          width: Math.min(display * 2, 1400), // 고해상도 화면 대비 2배로 그립니다
          margin: 2,
          errorCorrectionLevel: 'M',
          color: { dark: '#000000', light: '#ffffff' },
        });
        canvas.style.width = `${display}px`;
        canvas.style.height = `${display}px`;
      } catch {
        setDrawError('QR 코드를 그리지 못했습니다. 아래 주소를 직접 입력해 주세요.');
      }
    };

    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [url]);

  // 본문 스크롤 잠금
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  // 화면 꺼짐 방지 — 미지원 브라우저에서도 오류가 나지 않게 처리합니다.
  useEffect(() => {
    let released = false;
    (async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        }
      } catch {
        // 지원하지 않거나 거부된 경우 조용히 넘어갑니다.
      }
    })();
    return () => {
      released = true;
      try { wakeLockRef.current?.release?.(); } catch { /* 무시 */ }
      wakeLockRef.current = null;
      void released;
    };
  }, []);

  // 열릴 때 닫기 버튼으로 포커스 이동, 닫힐 때 원래 위치로 복귀
  useEffect(() => {
    const opener = document.activeElement;
    closeRef.current?.focus();
    return () => { if (opener instanceof HTMLElement) opener.focus(); };
  }, []);

  // Esc 닫기 + 포커스 트랩
  const onKeyDown = useCallback((event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
      return;
    }
    if (event.key !== 'Tab') return;
    const nodes = dialogRef.current?.querySelectorAll(FOCUSABLE);
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // 클립보드 API 를 쓸 수 없는 환경 대비
      const field = document.createElement('textarea');
      field.value = url;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      try { document.execCommand('copy'); } catch { /* 무시 */ }
      document.body.removeChild(field);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div
      className="qr-overlay"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      onKeyDown={onKeyDown}
      role="presentation"
    >
      <div
        className="qr-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`${title} QR 코드`}
        ref={dialogRef}
      >
        <div className="qr-dialog__frame">
          <canvas ref={canvasRef} aria-label={`${title} 접속 QR 코드`} role="img" />
        </div>
        {drawError && <p className="error">{drawError}</p>}
        <h2>{title}</h2>
        <p className="qr-dialog__url">{url}</p>
        <div className="qr-dialog__actions">
          <button className="btn btn--solid" type="button" onClick={copy}>
            {copied ? <Check /> : <Copy />}{copied ? '복사했습니다' : '주소 복사'}
          </button>
          <a className="btn btn--ghost" href={url} target="_blank" rel="noreferrer noopener">
            <ExternalLink />바로가기
          </a>
          <button className="btn btn--ghost" type="button" onClick={onClose} ref={closeRef}>
            <X />닫기
          </button>
        </div>
        <p className="qr-dialog__hint">배경을 누르거나 Esc 키를 눌러도 닫힙니다.</p>
      </div>
    </div>,
    document.body
  );
}
