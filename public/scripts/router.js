const routes = {};
let currentCleanup = null;

export function registerRoute(path, handler) {
  routes[path] = handler;
}

export function navigate(hash) {
  if (!hash.startsWith('#/')) {
    hash = '#/' + hash;
  }
  window.location.hash = hash;
}

export function getCurrentRoute() {
  return window.location.hash || '#/';
}

function matchRoute(hash) {
  if (routes[hash]) return { handler: routes[hash], params: {} };

  for (const pattern of Object.keys(routes)) {
    const paramNames = [];
    const regexStr = pattern.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    const regex = new RegExp('^' + regexStr + '$');
    const match = hash.match(regex);
    if (match) {
      const params = {};
      paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      return { handler: routes[pattern], params };
    }
  }
  return null;
}

function handleRouteChange() {
  const hash = window.location.hash || '#/';
  const app = document.getElementById('app');
  if (!app) return;

  if (typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  const matched = matchRoute(hash);

  if (matched) {
    const result = matched.handler(app, matched.params);
    if (typeof result === 'function') {
      currentCleanup = result;
    }
  } else {
    app.innerHTML = `
      <div class="screen" style="text-align:center; padding-top: var(--space-16);">
        <h1>페이지를 찾을 수 없습니다</h1>
        <p style="margin: var(--space-4) auto;">
          <a href="#/">시작 화면으로 돌아가기</a>
        </p>
      </div>
    `;
  }
}

export function initRouter() {
  window.addEventListener('hashchange', handleRouteChange);
  handleRouteChange();
}
