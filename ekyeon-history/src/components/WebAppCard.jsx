import { useState } from 'react';
import { ExternalLink, QrCode, Sparkles } from 'lucide-react';
import QrOverlay from './QrOverlay';

export default function WebAppCard({ app }) {
  const [qrOpen, setQrOpen] = useState(false);

  return (
    <article className="appcard">
      <span className="appcard__icon"><Sparkles /></span>
      <h3>{app.title}</h3>
      <p>{app.description}</p>
      <p className="appcard__url">{app.url}</p>
      <div className="appcard__actions">
        <a className="btn btn--sm btn--solid" href={app.url} target="_blank" rel="noreferrer noopener">
          <ExternalLink />바로가기
        </a>
        <button className="btn btn--sm btn--ghost" type="button" onClick={() => setQrOpen(true)}>
          <QrCode />QR 코드
        </button>
      </div>
      {qrOpen && <QrOverlay title={app.title} url={app.url} onClose={() => setQrOpen(false)} />}
    </article>
  );
}
