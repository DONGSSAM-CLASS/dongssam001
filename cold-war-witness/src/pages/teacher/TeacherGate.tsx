import { useState, type ReactNode } from 'react';
import { Layout } from '../../components/Layout';
import { Button, Loading, Notice, friendlyError } from '../../components/ui';
import { useAuth } from '../../app/AuthContext';
import { clearSession, loadSession } from '../../lib/session';

/** 교사(Google 로그인)만 들어올 수 있는 화면 */
export function TeacherGate({ children }: { children: ReactNode }) {
  const { loading, isTeacher, user, signInTeacher } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading)
    return (
      <Layout wide>
        <Loading />
      </Layout>
    );
  if (isTeacher) return <>{children}</>;

  const studentHere = user?.isAnonymous && loadSession();
  return (
    <Layout>
      <div className="dossier flex flex-col gap-4 p-6">
        <h1 className="typewriter text-2xl font-bold">선생님 로그인</h1>
        <p>학급을 만들고, 챕터를 열고, 학생들의 진행 상황과 성찰을 볼 수 있어요.</p>
        {studentHere && (
          <Notice tone="warn">
            이 기기에서는 지금 <strong>학생</strong>으로 들어와 있어요. 선생님으로 로그인하면 학생 입장이 풀려요. (학생 기록은 지워지지
            않고, 학급 코드·번호·PIN으로 다시 들어올 수 있어요.)
          </Notice>
        )}
        {error && <Notice tone="error">{error}</Notice>}
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await signInTeacher();
              clearSession();
            } catch (e) {
              setError(friendlyError(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? '로그인 중…' : 'Google 계정으로 로그인'}
        </Button>
        <p className="text-[15px] text-ink-soft">
          선생님 계정 정보는 학급을 구분하는 데에만 쓰고, 학생에게 보이지 않아요.
        </p>
      </div>
    </Layout>
  );
}

export function TeacherMenu() {
  const { user, signOut } = useAuth();
  return (
    <span className="flex items-center gap-2 text-[15px]">
      <span className="hidden max-w-48 truncate sm:inline">{user?.email}</span>
      <button type="button" className="min-h-10 rounded-md border border-line bg-white/70 px-3 hover:bg-white" onClick={() => void signOut()}>
        로그아웃
      </button>
    </span>
  );
}
