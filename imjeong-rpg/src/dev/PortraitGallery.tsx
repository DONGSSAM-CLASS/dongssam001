import { figures } from '../data/figures';
import { portraitDataUrl } from '../ui/portrait';

const GARMENT_LABEL: Record<string, string> = {
  durumagi: '두루마기',
  'hanbok-woman': '여성 한복',
  suit: '양복',
  uniform: '광복군 군복',
  changshan: '장삼(長衫)',
  student: '학생복',
};

const HEADWEAR_LABEL: Record<string, string> = {
  none: '',
  gat: '갓',
  fedora: '중절모',
  'military-cap': '군모',
  tanggeon: '탕건',
};

/**
 * 초상 갤러리 — 개발·검수용 화면.
 * 주소 끝에 `?portraits` 를 붙이면 열린다. 34명의 차림새를 한눈에 대조한다.
 */
export default function PortraitGallery() {
  const list = Object.values(figures);
  return (
    <div className="gallery">
      <h1 className="gallery-title">인물 차림새 검수 · {list.length}명</h1>
      <p className="gallery-note">
        널리 알려진 사진에서 확인되는 옷·머리·안경·수염만 옮겼습니다. 얼굴은 양식화했으며
        실존 인물의 초상이 아닙니다.
      </p>
      <div className="gallery-grid">
        {list.map((figure) => {
          const app = figure.appearance;
          const tags = [
            GARMENT_LABEL[app.garment],
            HEADWEAR_LABEL[app.headwear],
            app.glasses ? '안경' : '',
            app.facialHair === 'mustache'
              ? '콧수염'
              : app.facialHair === 'beard'
                ? '턱수염'
                : app.facialHair === 'long-beard'
                  ? '긴 수염'
                  : '',
          ].filter(Boolean);
          return (
            <figure className="gallery-card" key={figure.id}>
              <img src={portraitDataUrl(figure)} alt={`${figure.name} 초상`} />
              <figcaption>
                <strong>
                  {figure.name}
                  {figure.hanja ? `(${figure.hanja})` : ''}
                </strong>
                <span className="gallery-tags">{tags.join(' · ')}</span>
                <span className="gallery-src">{app.note}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
