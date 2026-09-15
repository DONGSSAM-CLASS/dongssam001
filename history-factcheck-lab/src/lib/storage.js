/**
 * 학습 진행 상황 저장.
 *
 * - 저장 위치는 이 기기의 localStorage 뿐이다. 서버로 보내지 않는다.
 * - 다른 기기로 옮길 때는 진행 상황 JSON을 Base64로 인코딩한 '이어받기 코드'를 쓴다.
 * - 백엔드가 없으므로 6자리 숫자만으로는 내용을 복원할 수 없다. 6자리 '확인 번호'는
 *   코드를 제대로 옮겨 적었는지 대조하는 체크섬이며, 실제 데이터는 긴 코드 쪽에 들어 있다.
 *   이 점은 화면에도 그대로 안내한다.
 */

const KEY = 'hfl.progress.v1';

export function emptyProgress() {
  return { version: 1, name: '', updatedAt: null, cases: {} };
}

export function loadProgress() {
  try {
    const raw = globalThis.localStorage.getItem(KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1 || typeof parsed.cases !== 'object') {
      return emptyProgress();
    }
    return { ...emptyProgress(), ...parsed };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress) {
  try {
    globalThis.localStorage.setItem(KEY, JSON.stringify({ ...progress, updatedAt: Date.now() }));
    return true;
  } catch {
    // 저장 공간이 막힌 기기에서도 앱 자체는 계속 쓸 수 있어야 한다.
    return false;
  }
}

export function clearProgress() {
  try {
    globalThis.localStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}

/* ---------- 이어받기 코드 ---------- */

// 한글이 섞인 JSON도 안전하게 Base64로 바꾸기 위해 UTF-8 바이트를 거친다.
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return globalThis.btoa(binary);
}

function base64ToUtf8(b64) {
  const binary = globalThis.atob(b64);
  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** 문자열에서 6자리 확인 번호를 만든다(FNV-1a 해시 기반). */
export function checksum6(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return String(hash % 1000000).padStart(6, '0');
}

/** 진행 상황 → { code, verifyNumber } */
export function exportCode(progress) {
  const json = JSON.stringify({ ...progress, version: 1 });
  const code = utf8ToBase64(json);
  return { code, verifyNumber: checksum6(code) };
}

/**
 * 이어받기 코드 → 진행 상황.
 * 성공하면 { ok: true, progress, verifyNumber }, 실패하면 { ok: false, message }.
 */
export function importCode(rawCode) {
  const code = (rawCode ?? '').replace(/\s+/g, '');
  if (!code) return { ok: false, message: '이어받기 코드를 붙여넣어 주세요.' };
  if (/^\d{6}$/.test(code)) {
    return {
      ok: false,
      message:
        '6자리 확인 번호만으로는 복원할 수 없습니다. 확인 번호는 코드를 제대로 옮겼는지 대조하는 번호이고, 실제 내용은 긴 코드 쪽에 들어 있습니다.',
    };
  }
  try {
    const parsed = JSON.parse(base64ToUtf8(code));
    if (!parsed || parsed.version !== 1 || typeof parsed.cases !== 'object') {
      return { ok: false, message: '이 앱에서 만든 코드가 아닌 것 같습니다.' };
    }
    return {
      ok: true,
      progress: { ...emptyProgress(), ...parsed },
      verifyNumber: checksum6(code),
    };
  } catch {
    return { ok: false, message: '코드를 읽지 못했습니다. 중간에 빠진 글자가 없는지 확인해 주세요.' };
  }
}
