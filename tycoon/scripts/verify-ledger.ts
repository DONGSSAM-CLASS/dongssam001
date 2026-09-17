/**
 * 원장 무결성 점검 — "모든 계정 잔액의 합 == 0" 이 지켜지는지 확인합니다.
 * 이 값이 0 이 아니면 어딘가에서 코인이 생기거나 사라진 것입니다.
 *
 *   npx tsx scripts/verify-ledger.ts <classId>
 */
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8180';
initializeApp({ projectId: process.env.GCLOUD_PROJECT ?? 'demo-tycoon' });
const db = getFirestore();

const classId = process.argv[2] ?? 'demo-class';

const accounts = await db.collection(`classes/${classId}/accounts`).get();
let sum = 0;
for (const doc of accounts.docs) {
  const balance = doc.data().balance as number;
  sum += balance;
  console.log(`${doc.id.padEnd(12)} ${balance.toLocaleString('ko-KR').padStart(12)}코인`);
}
console.log('─'.repeat(30));
console.log(`합계 ${sum.toLocaleString('ko-KR')}코인  (0 이어야 정상)`);
console.log(`통화량 ${(-(accounts.docs.find((d) => d.id === 'MINT')?.data().balance ?? 0)).toLocaleString('ko-KR')}코인`);
process.exit(sum === 0 ? 0 : 1);
