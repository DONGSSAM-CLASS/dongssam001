import { curriculum } from '../../data/curriculum.js';
import { factcheck } from '../../data/factcheck.js';
import { setLastScreen } from '../state.js';
import { createUtilityBar, setupTermTooltips } from '../ui.js';

export function render(app) {
  setLastScreen('#/teacher');

  const sessionRows = curriculum.mapping.map(m => `
    <tr>
      <td style="padding:var(--space-2);border-bottom:1px solid var(--stone-200);">
        ${m.session}차시
      </td>
      <td style="padding:var(--space-2);border-bottom:1px solid var(--stone-200);">
        ${m.modules.join(', ')}
      </td>
      <td style="padding:var(--space-2);border-bottom:1px solid var(--stone-200);font-size:var(--font-size-sm);">
        ${m.history.join(', ')}
      </td>
      <td style="padding:var(--space-2);border-bottom:1px solid var(--stone-200);font-size:var(--font-size-sm);">
        ${m.ksel.join(', ')}
      </td>
    </tr>
  `).join('');

  const historyRows = curriculum.history.map(s => `
    <div class="card" style="margin-bottom:var(--space-3);padding:var(--space-3);">
      <p style="font-weight:600;color:var(--athens);">${s.code}</p>
      <p style="font-size:var(--font-size-sm);margin-top:var(--space-1);">${s.text}</p>
      <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin-top:var(--space-1);">${s.explanation}</p>
    </div>
  `).join('');

  const kselRows = curriculum.ksel.map(s => `
    <div class="card" style="margin-bottom:var(--space-3);padding:var(--space-3);">
      <p style="font-weight:600;color:var(--olive);">${s.code}</p>
      <p style="font-size:var(--font-size-sm);margin-top:var(--space-1);">${s.text}</p>
    </div>
  `).join('');

  const factGrades = { '확정': 0, '이견': 0 };
  factcheck.forEach(f => {
    if (factGrades[f.grade] !== undefined) factGrades[f.grade]++;
  });

  const dissentItems = factcheck.filter(f => f.dissent);

  app.innerHTML = `
    <div class="screen" id="screen-teacher">
      <h1 class="screen-title">교사용 안내</h1>
      <p class="screen-subtitle">수업 운영과 교육과정 연계 정보</p>

      <details class="card" style="margin-bottom:var(--space-4);padding:var(--space-4);">
        <summary style="font-weight:600;cursor:pointer;">수업 개요</summary>
        <div style="margin-top:var(--space-3);">
          <p>이 자료는 중학교 2학년 역사 수업용 디지털 활동지입니다.</p>
          <p style="margin-top:var(--space-2);">
            펠로폰네소스 전쟁을 소재로, 역사 탐구 방법과 사회정서학습(K-SEL)을 결합했습니다.
          </p>
          <p style="margin-top:var(--space-2);">총 3차시로 구성되어 있습니다.</p>
        </div>
      </details>

      <details class="card" style="margin-bottom:var(--space-4);padding:var(--space-4);">
        <summary style="font-weight:600;cursor:pointer;">차시별 활동과 성취기준</summary>
        <div style="margin-top:var(--space-3);overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:var(--font-size-sm);">
            <thead>
              <tr style="background:var(--stone-100);">
                <th style="padding:var(--space-2);text-align:left;">차시</th>
                <th style="padding:var(--space-2);text-align:left;">활동</th>
                <th style="padding:var(--space-2);text-align:left;">역사</th>
                <th style="padding:var(--space-2);text-align:left;">K-SEL</th>
              </tr>
            </thead>
            <tbody>${sessionRows}</tbody>
          </table>
        </div>
      </details>

      <details class="card" style="margin-bottom:var(--space-4);padding:var(--space-4);">
        <summary style="font-weight:600;cursor:pointer;">역사과 성취기준 상세</summary>
        <div style="margin-top:var(--space-3);">${historyRows}</div>
      </details>

      <details class="card" style="margin-bottom:var(--space-4);padding:var(--space-4);">
        <summary style="font-weight:600;cursor:pointer;">K-SEL 성취기준 상세</summary>
        <div style="margin-top:var(--space-3);">${kselRows}</div>
      </details>

      <details class="card" style="margin-bottom:var(--space-4);padding:var(--space-4);">
        <summary style="font-weight:600;cursor:pointer;">사실 검증 요약 (${factcheck.length}건)</summary>
        <div style="margin-top:var(--space-3);">
          <p style="margin-bottom:var(--space-3);">
            확정: ${factGrades['확정']}건 · 이견: ${factGrades['이견']}건
          </p>
          ${dissentItems.length > 0 ? `
            <h3 style="font-size:var(--font-size-sm);margin-bottom:var(--space-2);color:var(--gold);">
              이견이 있는 항목
            </h3>
            ${dissentItems.map(f => `
              <div style="margin-bottom:var(--space-3);padding:var(--space-2);background:var(--stone-100);border-radius:var(--radius);">
                <p style="font-size:var(--font-size-sm);font-weight:600;">${f.id}: ${f.statement}</p>
                <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin-top:var(--space-1);">${f.dissent}</p>
              </div>
            `).join('')}
          ` : ''}
          <p style="font-size:var(--font-size-sm);margin-top:var(--space-3);">
            <a href="#/factcheck" style="color:var(--athens);">전체 팩트체크 목록 보기</a>
          </p>
        </div>
      </details>

      <details class="card" style="margin-bottom:var(--space-4);padding:var(--space-4);">
        <summary style="font-weight:600;cursor:pointer;">운영 안내</summary>
        <div style="margin-top:var(--space-3);">
          <ul style="font-size:var(--font-size-sm);line-height:1.8;padding-left:var(--space-4);">
            <li>모든 데이터는 학생 기기의 localStorage에만 저장됩니다.</li>
            <li>외부 서버로 전송되는 정보가 없습니다.</li>
            <li>이름, 학번 등 개인식별정보를 수집하지 않습니다.</li>
            <li>닉네임은 익명으로 자동 생성됩니다.</li>
            <li>D5(밀로스) 결과 제시 후 자동으로 호흡 활동이 나타납니다.</li>
            <li>"잠시 멈추기" 버튼은 화면 오른쪽 위에 항상 있습니다.</li>
            <li>투키디데스의 연설·대화 장면은 재구성이라는 점을 학생들에게 안내해 주세요.</li>
          </ul>
        </div>
      </details>

      <details class="card" style="margin-bottom:var(--space-4);padding:var(--space-4);">
        <summary style="font-weight:600;cursor:pointer;">글쓰기 원칙</summary>
        <div style="margin-top:var(--space-3);">
          <ul style="font-size:var(--font-size-sm);line-height:1.8;padding-left:var(--space-4);">
            <li>한 문장 45자 이내, 한 문단 3문장 이내</li>
            <li>한 화면에서 학생이 읽는 글자 600자 이하</li>
            <li>숫자는 추정치임을 표시 ("약", "쯤")</li>
            <li>투키디데스 연설은 "재구성"임을 밝힘</li>
            <li>지어낸 인용문 없음</li>
            <li>관점 인물은 가상임을 명시</li>
          </ul>
        </div>
      </details>

      <div style="text-align:center;margin-top:var(--space-6);">
        <a href="#/" class="btn btn--secondary">시작 화면으로</a>
      </div>
    </div>
  `;
  app.appendChild(createUtilityBar());
  setupTermTooltips(app);
}
