import { useEffect, useState } from 'react';
import { Building2, Info } from 'lucide-react';
import SectionTitle from '../components/SectionTitle';
import WebAppCard from '../components/WebAppCard';
import { loadWebApps } from '../lib/webapps';
import { PARENT_WEBAPPS, TEACHER_WEBAPPS } from '../data/webapps';

export default function WebApps() {
  const [apps, setApps] = useState({ teacher: TEACHER_WEBAPPS, parent: PARENT_WEBAPPS });

  useEffect(() => {
    let alive = true;
    loadWebApps().then((rows) => { if (alive) setApps(rows); });
    return () => { alive = false; };
  }, []);

  return (
    <div className="page">
      <SectionTitle
        eyebrow="Web apps"
        title="선생님들이 개발한 바이브 코딩 웹앱"
        lead="역사 수업에 바로 쓸 수 있도록 연구팀 선생님들이 직접 만든 웹앱입니다. [QR 코드] 버튼을 누르면 화면 전면에 QR 이 떠서 학생들이 바로 스캔할 수 있습니다."
      />

      <div className="guest-note">
        <Info />
        <span>
          <strong>교실 화면이나 빔프로젝터에 그대로 띄워 주세요</strong>
          <small>QR 오버레이가 열려 있는 동안에는 화면이 꺼지지 않도록 처리했습니다(지원 브라우저 한정).</small>
        </span>
      </div>

      <div className="appgrid">
        {apps.teacher.map((app) => <WebAppCard key={app.id} app={app} />)}
      </div>

      <h3 className="subhead"><Building2 className="mr-2 inline h-5 w-5 text-primary" aria-hidden="true" />본원 연구회</h3>
      <p className="lead mb-6">역사연구팀이 스핀오프한 본원, 에듀테크 교사 연구회의 공식 홈페이지입니다.</p>
      <div className="appgrid">
        {apps.parent.map((app) => <WebAppCard key={app.id} app={app} />)}
      </div>
    </div>
  );
}
