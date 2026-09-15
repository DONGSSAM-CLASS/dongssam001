import { useEffect, useState } from 'react';
import { ExternalLink, FolderOpen, KeyRound, Lock, ShieldAlert } from 'lucide-react';
import SectionTitle from '../components/SectionTitle';
import { CONTACT_EMAIL, DEV_DRIVE_URL, DEV_SPACE_PASSCODE } from '../lib/constants';

// 세션 동안만 유지되는 통과 플래그 — 탭을 닫으면 해제됩니다.
const SESSION_KEY = 'ekyeon-history:dev-space-unlocked';

const readFlag = () => {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
};

export default function DevSpace() {
  const [unlocked, setUnlocked] = useState(readFlag);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!unlocked) return;
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* 저장이 막혀도 이번 화면에서는 열립니다 */ }
  }, [unlocked]);

  const submit = (event) => {
    event.preventDefault();
    if (passcode.trim() !== String(DEV_SPACE_PASSCODE)) {
      setError('비밀번호가 맞지 않습니다. 다시 입력해 주세요.');
      return;
    }
    setError('');
    setPasscode('');
    setUnlocked(true);
  };

  return (
    <div className="page">
      <SectionTitle
        eyebrow="Dev space"
        title="에크연 역사쌤들의 개발 공간"
        lead="연구팀이 함께 개발하고 있는 자료와 작업 파일을 모아 둔 공간입니다."
      />

      {unlocked ? (
        <div className="drive-cta">
          <span className="gate__icon mx-auto"><FolderOpen /></span>
          <h2>개발 공간 공유 드라이브</h2>
          <p>
            연구팀이 개발 중인 웹앱 소스, 수업 자료 초안, 회의 기록 등을 구글 드라이브 폴더에 모아 두었습니다.
            아래 버튼을 누르면 새 탭에서 폴더가 열립니다.
          </p>
          <div>
            <a className="btn btn--solid btn--lg" href={DEV_DRIVE_URL} target="_blank" rel="noreferrer noopener">
              <FolderOpen />구글 드라이브 폴더 열기<ExternalLink />
            </a>
          </div>
          <p className="hint m-0">
            폴더가 열리지 않으면 드라이브 접근 권한이 없는 계정으로 로그인되어 있을 수 있습니다.
            문의는 <a className="font-semibold text-primary" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> 으로 남겨 주세요.
          </p>
        </div>
      ) : (
        <form className="gate" onSubmit={submit}>
          <span className="gate__icon"><Lock /></span>
          <h2>비밀번호를 입력해 주세요</h2>
          <p>개발 공간은 연구팀 선생님들을 위한 공간입니다. 비밀번호 확인 후 공유 드라이브로 연결됩니다.</p>
          <label className="grid gap-2 text-sm font-semibold">
            <span className="flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" />개발 공간 비밀번호</span>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              aria-label="개발 공간 비밀번호"
              required
            />
          </label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn btn--solid btn--lg" type="submit">들어가기</button>
          <p className="gate__contact">
            비밀번호는 연구팀 안내 채널에서 확인하실 수 있습니다. 문의: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
        </form>
      )}

      <p className="disclaimer">
        <ShieldAlert className="mr-1 inline h-4 w-4" aria-hidden="true" />
        이 잠금은 프런트엔드 수준의 접근 제한입니다. 실제 보안은 구글 드라이브 폴더 자체의 공유 권한 설정이며,
        폴더에 접근할 수 있는 계정 범위를 드라이브에서 직접 관리해 주세요.
      </p>
    </div>
  );
}
