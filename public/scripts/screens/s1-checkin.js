import { getState, updateState, markScreenCompleted, setLastScreen } from '../state.js';
import { navigate } from '../router.js';
import { createUtilityBar, showToast } from '../ui.js';

const EMOTIONS = ['평온', '설렘', '불안', '지루함', '화남', '슬픔', '기대', '모르겠음'];

export function render(app) {
  setLastScreen('#/checkin');
  const state = getState();
  const saved = state.checkin;

  app.innerHTML = `
    <div class="screen" id="screen-checkin">
      <h1 class="screen-title">마음 열기</h1>
      <p class="screen-subtitle">1차시 — 수업을 시작하기 전에</p>

      <section id="breathing-section" style="text-align:center;margin:var(--space-8) 0;">
        <p style="margin-bottom:var(--space-4);">
          잠시 숨을 고르며 마음을 가다듬어 봅시다.
        </p>
        <div id="breath-circle" style="
          width:100px;height:100px;border-radius:50%;
          background:var(--olive-light);margin:var(--space-6) auto;
          animation: breathe 14s ease-in-out 3;
        "></div>
        <p style="color:var(--ink-500);font-size:var(--font-size-sm);" aria-live="polite">
          원이 커질 때 들이쉬고, 줄어들 때 내쉬세요.
        </p>
        <button class="btn btn--ghost btn--sm" id="btn-skip-breath" style="margin-top:var(--space-4);">
          건너뛰기
        </button>
      </section>

      <section id="emotion-section" style="display:none;">
        <h2 style="margin-bottom:var(--space-4);">지금 기분은 어떤가요?</h2>
        <p style="font-size:var(--font-size-sm);color:var(--ink-500);margin-bottom:var(--space-3);">
          1~2개를 골라 주세요.
        </p>
        <div class="chip-group" id="emotion-chips" role="group" aria-label="감정 선택"></div>

        <div class="slider-container" style="margin-top:var(--space-6);">
          <label for="energy-slider" style="font-weight:600;">에너지 수준</label>
          <input type="range" id="energy-slider" min="0" max="10" value="5" aria-label="에너지 수준 0에서 10">
          <div class="slider-labels">
            <span>0 (매우 낮음)</span>
            <span id="energy-value">5</span>
            <span>10 (매우 높음)</span>
          </div>
        </div>

        <button class="btn btn--primary btn--block" id="btn-checkin-next" style="margin-top:var(--space-6);" disabled>
          다음으로
        </button>
      </section>

      <section id="notice-section" style="display:none;margin-top:var(--space-6);">
        <div class="card card--olive" style="text-align:center;">
          <p>이 수업은 전쟁을 다룹니다.</p>
          <p style="margin-top:var(--space-2);">
            마음이 불편해지면 언제든 오른쪽 위의<br>
            <strong>[잠시 멈추기]</strong> 버튼을 눌러도 좋습니다.
          </p>
          <button class="btn btn--olive" id="btn-to-sources" style="margin-top:var(--space-4);">
            사료 탐구실로 가기
          </button>
        </div>
      </section>
    </div>
  `;
  app.appendChild(createUtilityBar());

  const selectedEmotions = saved ? [...saved.emotions] : [];
  const breathSection = document.getElementById('breathing-section');
  const emotionSection = document.getElementById('emotion-section');
  const noticeSection = document.getElementById('notice-section');
  const skipBtn = document.getElementById('btn-skip-breath');
  const nextBtn = document.getElementById('btn-checkin-next');
  const slider = document.getElementById('energy-slider');
  const energyVal = document.getElementById('energy-value');
  const chips = document.getElementById('emotion-chips');

  if (saved) {
    breathSection.style.display = 'none';
    emotionSection.style.display = 'none';
    noticeSection.style.display = '';
  }

  function showEmotionSection() {
    breathSection.style.display = 'none';
    emotionSection.style.display = '';
  }

  skipBtn.addEventListener('click', showEmotionSection);

  const breathCircle = document.getElementById('breath-circle');
  breathCircle.addEventListener('animationend', showEmotionSection);

  EMOTIONS.forEach(em => {
    const chip = document.createElement('button');
    chip.className = 'chip' + (selectedEmotions.includes(em) ? ' chip--selected' : '');
    chip.textContent = em;
    chip.setAttribute('role', 'checkbox');
    chip.setAttribute('aria-checked', selectedEmotions.includes(em) ? 'true' : 'false');
    chip.addEventListener('click', () => {
      const idx = selectedEmotions.indexOf(em);
      if (idx >= 0) {
        selectedEmotions.splice(idx, 1);
        chip.classList.remove('chip--selected');
        chip.setAttribute('aria-checked', 'false');
      } else {
        if (selectedEmotions.length >= 2) {
          showToast('최대 2개까지 고를 수 있습니다.');
          return;
        }
        selectedEmotions.push(em);
        chip.classList.add('chip--selected');
        chip.setAttribute('aria-checked', 'true');
      }
      nextBtn.disabled = selectedEmotions.length === 0;
    });
    chips.appendChild(chip);
  });

  if (saved) {
    slider.value = saved.energy;
    energyVal.textContent = saved.energy;
  }

  slider.addEventListener('input', () => {
    energyVal.textContent = slider.value;
  });

  nextBtn.disabled = selectedEmotions.length === 0;

  nextBtn.addEventListener('click', () => {
    updateState(s => {
      s.checkin = {
        emotions: [...selectedEmotions],
        energy: parseInt(slider.value, 10)
      };
    });
    markScreenCompleted('s1');
    emotionSection.style.display = 'none';
    noticeSection.style.display = '';
  });

  const toSourcesBtn = document.getElementById('btn-to-sources');
  toSourcesBtn.addEventListener('click', () => {
    navigate('#/sources');
  });
}
