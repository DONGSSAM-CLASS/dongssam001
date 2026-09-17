// 앱 전체가 공유하는 타입. 화면·스크립트·테스트가 모두 이 파일을 봅니다.

/** 권한은 조직 이름이 아니라 이 고정 키에 붙습니다(요구사항 4-1). */
export type RoleKey =
  | 'PRESIDENT'         // 대통령 — 담임교사
  | 'PRIME_MINISTER'    // 국무총리 — 학급회장 A
  | 'SPEAKER'           // 국회의장 — 학급회장 B
  | 'FINANCE_MINISTER'  // 기획재정부 장관
  | 'MINISTER'          // 각 부처 장관
  | 'CITIZEN';          // 국민

export const ROLE_LABELS: Record<RoleKey, string> = {
  PRESIDENT: '대통령',
  PRIME_MINISTER: '국무총리',
  SPEAKER: '국회의장',
  FINANCE_MINISTER: '기획재정부 장관',
  MINISTER: '장관',
  CITIZEN: '국민',
};

/** 역할별 테마 색(디자인 가이드 10번). */
export const ROLE_THEME: Record<RoleKey, string> = {
  PRESIDENT: 'bg-navy-600 text-white',
  PRIME_MINISTER: 'bg-violet-600 text-white',
  SPEAKER: 'bg-violet-600 text-white',
  FINANCE_MINISTER: 'bg-emerald-600 text-white',
  MINISTER: 'bg-emerald-600 text-white',
  CITIZEN: 'bg-sky-500 text-white',
};

/** 코인이 오갈 수 있는 계정. 모든 잔액은 여기에만 저장됩니다. */
export type AccountId =
  | 'MINT'           // 발행·소각 상대 계정. 잔액이 음수이며 -잔액 = 통화량
  | 'TREASURY'       // 국고
  | 'BANK_DEPOSIT'   // 은행 예금 (6단계)
  | 'BANK_LOAN'      // 은행 대출 (6단계)
  | 'ESCROW'         // 경매 입찰 잠금 (5단계)
  | string;          // 'S07' 처럼 학생 지갑

export interface AccountDoc {
  type: 'SYSTEM' | 'STUDENT';
  ownerNumber: string | null;
  balance: number;       // 정수 코인
  lastTxId: string | null;
  updatedAt: unknown;
}

export type TxType =
  | 'MINT' | 'BURN'
  | 'PAYROLL' | 'TAX' | 'CLAWBACK'
  | 'MERIT' | 'PENALTY'
  | 'SUBSIDY' | 'FEE' | 'AUCTION'
  | 'DEPOSIT_INTEREST'
  | 'ADJUST';

export const TX_LABELS: Record<TxType, string> = {
  MINT: '국고 발행',
  BURN: '국고 소각',
  PAYROLL: '월급',
  TAX: '소득세',
  CLAWBACK: '급여 회수',
  MERIT: '상점',
  PENALTY: '벌점',
  SUBSIDY: '지원금',
  FEE: '수수료',
  AUCTION: '청약 대금',
  DEPOSIT_INTEREST: '예금 이자',
  ADJUST: '수동 조정',
};

export interface TransactionDoc {
  type: TxType;
  fromAccount: AccountId;
  toAccount: AccountId;
  amount: number;
  reason: string;
  actorUid: string;
  refDoc?: string | null;
  payrollMonth?: string | null;
  createdAt: unknown;
}

export interface ClassDoc {
  name: string;
  teacherId: string;
  classCode: string;         // 표시용 대문자 6자리
  authPrefix: string;        // 학생 가상 이메일용 소문자 접두어(고정)
  allowNegativeBalance: boolean;
  createdAt: unknown;
}

/** 같은 학급 구성원이 볼 수 있는 공개 명단. 비밀값은 넣지 않습니다. */
export interface StudentDoc {
  number: string;            // '07' 처럼 0 을 채운 2자리 문자열
  name: string;
  roles: RoleKey[];
  ministryId: string | null;
  creditScore: number;
  debts: number;
  uid: string | null;        // 첫 로그인 때 학생 본인이 한 번만 연결
  claimedAt?: unknown;
}

/** 교사만 읽는 비밀값. */
export interface RosterDoc {
  number: string;
  name: string;
  pin: string;
  authGeneration: number;    // PIN 초기화 때마다 +1
  updatedAt: unknown;
}

export interface MemberDoc {
  number: string;
  roles: RoleKey[];
}

export interface MinistryDoc {
  name: string;
  officialName2026: string;
  positionTitle: string;     // '장관' / '청장' 등 교사가 바꿀 수 있음
  roleKey: RoleKey;
  salary: number;
  duty: string;
  capacity: number;
  order: number;
}

export interface EconomySettings {
  taxMode: 'flat' | 'progressive';
  flatTaxRate: number;                     // 0.10 = 10%
  brackets: { upTo: number | null; rate: number }[];
  warningThreshold: number;                // 기본 3회
  meritDelegatedRoles: RoleKey[];          // 기본 [] = 대통령만
}

export const DEFAULT_ECONOMY: EconomySettings = {
  taxMode: 'flat',
  flatTaxRate: 0.1,
  brackets: [
    { upTo: 300, rate: 0.05 },
    { upTo: 600, rate: 0.1 },
    { upTo: null, rate: 0.2 },
  ],
  warningThreshold: 3,
  meritDelegatedRoles: [],
};
