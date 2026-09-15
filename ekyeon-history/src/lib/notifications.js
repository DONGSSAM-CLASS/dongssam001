const NOTIFICATION_WEBHOOK_URL = import.meta.env.VITE_NOTIFICATION_WEBHOOK_URL || '';

// Google Apps Script 웹 앱으로 협업 요청 알림을 보냅니다.
// 주소가 설정되지 않았으면 조용히 건너뜁니다(메일·복사 경로는 그대로 동작).
export async function notifyCollabRequest(request) {
  if (!NOTIFICATION_WEBHOOK_URL) return false;
  try {
    await fetch(NOTIFICATION_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        source: 'ekyeon-history-web',
        ...request,
        submittedAt: new Date().toISOString(),
      }),
    });
    return true;
  } catch (error) {
    console.error('협업 요청 알림을 보내지 못했습니다.', error);
    return false;
  }
}
