import { registerRoute, initRouter } from './router.js?design-1';
import { loadState } from './state.js';
import { createPauseButton } from './ui.js?design-1';
import { glossaryMap } from '../data/glossary.js';

import { render as renderIntro } from './screens/s0-intro.js?design-1';
import { render as renderCheckin } from './screens/s1-checkin.js';
import { render as renderSources } from './screens/s2-sources.js';
import { render as renderCompare } from './screens/s3-compare.js';
import { render as renderDecision } from './screens/s4-decision.js';
import { render as renderTrajectory } from './screens/s5-trajectory.js';
import { render as renderPerspective } from './screens/s6-perspective.js';
import { render as renderBias } from './screens/s7-bias.js';
import { render as renderDeclaration } from './screens/s8-declaration.js';
import { render as renderTeacher } from './screens/s9-teacher.js';
import { render as renderGlossary } from './screens/s10-glossary.js';
import { render as renderFactcheck } from './screens/s11-factcheck.js';

function boot() {
  window.__glossaryData = glossaryMap;

  loadState();

  registerRoute('#/', renderIntro);
  registerRoute('#/checkin', renderCheckin);
  registerRoute('#/sources', renderSources);
  registerRoute('#/compare', renderCompare);
  registerRoute('#/decision/:nodeId', renderDecision);
  registerRoute('#/trajectory', renderTrajectory);
  registerRoute('#/perspective', renderPerspective);
  registerRoute('#/bias', renderBias);
  registerRoute('#/declaration', renderDeclaration);
  registerRoute('#/teacher', renderTeacher);
  registerRoute('#/glossary', renderGlossary);
  registerRoute('#/factcheck', renderFactcheck);

  initRouter();

  const state = loadState();
  if (state && state.nickname) {
    createPauseButton();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
