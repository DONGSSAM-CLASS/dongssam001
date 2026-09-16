/**
 * 보안 규칙 테스트 (Firestore 에뮬레이터 필요)
 *   npm run test:rules
 *
 * 핵심 확인 사항
 *  - 다른 학급 접근 차단
 *  - 다른 학생 결과물 읽기 차단 (사용 시간 포함)
 *  - 학생의 evals 읽기 차단
 *  - editLocked 가 켜지면 학생 쓰기 차단
 *  - 다른 모둠 보드 쓰기 차단
 */
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

const PROJECT_ID = 'demo-dasan-time';

const CLASS_A = 'classA';
const CLASS_B = 'classB';
const TEACHER_A = 'teacherA';
const TEACHER_B = 'teacherB';
const STUDENT_1 = 'student1';
const STUDENT_2 = 'student2';
const OUTSIDER = 'outsider';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  // 규칙을 무시하고 밑바탕 데이터를 깔아 둔다.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'classes', CLASS_A), {
      teacherUid: TEACHER_A,
      name: '3학년 2반',
      code: 'ABC234',
      school: '○○중학교',
      teacherName: '김다산',
      sessions: { pre: 'open', s1: 'open', s2: 'open', s3: 'open', home: 'open', post: 'open' },
      editLocked: false,
      voteClosed: false,
    });
    await setDoc(doc(db, 'classes', CLASS_B), {
      teacherUid: TEACHER_B,
      name: '3학년 3반',
      code: 'DEF567',
      school: '○○중학교',
      teacherName: '이초당',
      sessions: { pre: 'open', s1: 'open', s2: 'open', s3: 'open', home: 'open', post: 'open' },
      editLocked: false,
      voteClosed: false,
    });
    await setDoc(doc(db, 'classes', CLASS_A, 'students', STUDENT_1), {
      name: '학생하나',
      number: 1,
      loginId: 'stu001',
      group: 1,
      active: true,
    });
    await setDoc(doc(db, 'classes', CLASS_A, 'students', STUDENT_2), {
      name: '학생둘',
      number: 2,
      loginId: 'stu002',
      group: 2,
      active: true,
    });
    // 학생2의 사용 시간 기록 (민감한 값)
    await setDoc(doc(db, 'classes', CLASS_A, 'submissions', `${STUDENT_2}_s1_a1`), {
      ownerUid: STUDENT_2,
      activityId: 's1_a1',
      data: { hours: '5', thought: '많이 쓰네요' },
      status: 'submitted',
    });
    // 교사 평가
    await setDoc(doc(db, 'classes', CLASS_A, 'evals', `${STUDENT_1}_s1_a1`), {
      ownerUid: STUDENT_1,
      activityId: 's1_a1',
      grade: '상',
      memo: '근거를 잘 찾음',
    });
  });
});

function asStudent1() {
  return env.authenticatedContext(STUDENT_1).firestore();
}
function asStudent2() {
  return env.authenticatedContext(STUDENT_2).firestore();
}
function asTeacherA() {
  return env.authenticatedContext(TEACHER_A).firestore();
}
function asOutsider() {
  return env.authenticatedContext(OUTSIDER).firestore();
}

describe('학급 문서', () => {
  it('학생은 자기 학급 문서를 읽을 수 있다', async () => {
    await assertSucceeds(getDoc(doc(asStudent1(), 'classes', CLASS_A)));
  });

  it('다른 학급 문서는 읽을 수 없다', async () => {
    await assertFails(getDoc(doc(asStudent1(), 'classes', CLASS_B)));
  });

  it('담당이 아닌 교사는 남의 학급을 고칠 수 없다', async () => {
    await assertFails(
      setDoc(doc(asOutsider(), 'classes', CLASS_A), { editLocked: true }, { merge: true }),
    );
  });

  it('담당 교사는 자기 학급을 고칠 수 있다', async () => {
    await assertSucceeds(
      setDoc(
        doc(asTeacherA(), 'classes', CLASS_A),
        { teacherUid: TEACHER_A, editLocked: true },
        { merge: true },
      ),
    );
  });
});

describe('결과물 (submissions)', () => {
  it('학생은 자기 결과물을 쓸 수 있다', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'classes', CLASS_A, 'submissions', `${STUDENT_1}_s1_a1`), {
        ownerUid: STUDENT_1,
        activityId: 's1_a1',
        data: { hours: '2' },
        status: 'draft',
      }),
    );
  });

  it('다른 학생의 결과물(사용 시간)은 읽을 수 없다', async () => {
    await assertFails(
      getDoc(doc(asStudent1(), 'classes', CLASS_A, 'submissions', `${STUDENT_2}_s1_a1`)),
    );
  });

  it('다른 학생 이름으로 결과물을 쓸 수 없다', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'classes', CLASS_A, 'submissions', `${STUDENT_2}_s1_a1`), {
        ownerUid: STUDENT_2,
        activityId: 's1_a1',
        data: {},
        status: 'draft',
      }),
    );
  });

  it('담당 교사는 학생 결과물을 읽을 수 있다', async () => {
    await assertSucceeds(
      getDoc(doc(asTeacherA(), 'classes', CLASS_A, 'submissions', `${STUDENT_2}_s1_a1`)),
    );
  });

  it('다른 학급 교사는 읽을 수 없다', async () => {
    await assertFails(
      getDoc(doc(asOutsider(), 'classes', CLASS_A, 'submissions', `${STUDENT_2}_s1_a1`)),
    );
  });

  it('editLocked 가 켜지면 학생은 쓸 수 없다', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(
        doc(ctx.firestore(), 'classes', CLASS_A),
        { editLocked: true },
        { merge: true },
      );
    });
    await assertFails(
      setDoc(doc(asStudent1(), 'classes', CLASS_A, 'submissions', `${STUDENT_1}_s1_a2`), {
        ownerUid: STUDENT_1,
        activityId: 's1_a2',
        data: {},
        status: 'draft',
      }),
    );
  });
});

describe('교사 평가 (evals)', () => {
  it('학생은 자기 평가 문서를 읽을 수 없다', async () => {
    await assertFails(
      getDoc(doc(asStudent1(), 'classes', CLASS_A, 'evals', `${STUDENT_1}_s1_a1`)),
    );
  });

  it('학생은 평가 문서를 쓸 수 없다', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'classes', CLASS_A, 'evals', `${STUDENT_1}_s1_a1`), {
        grade: '상',
      }),
    );
  });

  it('담당 교사는 평가 문서를 읽을 수 있다', async () => {
    await assertSucceeds(
      getDoc(doc(asTeacherA(), 'classes', CLASS_A, 'evals', `${STUDENT_1}_s1_a1`)),
    );
  });
});

describe('모둠 보드', () => {
  it('자기 모둠 보드는 쓸 수 있다', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'classes', CLASS_A, 'groupBoards', 's2_a4_1_1'), {
        activityId: 's2_a4_1',
        group: 1,
        cells: { how__shortform: '짧게 여러 개' },
        lastEditor: '학생하나',
      }),
    );
  });

  it('다른 모둠 보드는 쓸 수 없다', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'classes', CLASS_A, 'groupBoards', 's2_a4_1_2'), {
        activityId: 's2_a4_1',
        group: 2,
        cells: {},
        lastEditor: '학생하나',
      }),
    );
  });
});

describe('동료 평가 투표', () => {
  it('자기 표는 쓸 수 있다', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'classes', CLASS_A, 'votes', STUDENT_1), {
        picks: ['a', 'b'],
        reason: '실천 가능성이 높아 보여요',
      }),
    );
  });

  it('남의 표는 쓸 수 없다', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'classes', CLASS_A, 'votes', STUDENT_2), {
        picks: ['a'],
        reason: '가로채기',
      }),
    );
  });

  it('남의 표는 읽을 수 없다', async () => {
    await assertFails(getDoc(doc(asStudent2(), 'classes', CLASS_A, 'votes', STUDENT_1)));
  });

  it('3개 이상은 고를 수 없다', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'classes', CLASS_A, 'votes', STUDENT_1), {
        picks: ['a', 'b', 'c'],
        reason: '너무 많이 골랐어요',
      }),
    );
  });
});

describe('감정 지도', () => {
  it('학생은 낱말을 올릴 수 있다', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'classes', CLASS_A, 'emotions', 'e1'), {
        word: '심심해요',
        hidden: false,
      }),
    );
  });

  it('학생은 낱말을 숨길 수 없다 (교사만 가능)', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'classes', CLASS_A, 'emotions', 'e2'), {
        word: '답답해요',
        hidden: false,
      });
    });
    await assertFails(
      setDoc(
        doc(asStudent1(), 'classes', CLASS_A, 'emotions', 'e2'),
        { hidden: true },
        { merge: true },
      ),
    );
  });
});

describe('목록 조회 (list)', () => {
  it('학생은 자기 결과물만 목록으로 가져올 수 있다', async () => {
    const db = asStudent1();
    await assertSucceeds(
      getDocs(
        query(
          collection(db, 'classes', CLASS_A, 'submissions'),
          where('ownerUid', '==', STUDENT_1),
        ),
      ),
    );
  });

  it('학생이 학급 전체 결과물을 훑는 것은 막힌다', async () => {
    await assertFails(getDocs(collection(asStudent1(), 'classes', CLASS_A, 'submissions')));
  });

  it('교사는 자기 학급 목록만 가져올 수 있다', async () => {
    const db = asTeacherA();
    await assertSucceeds(
      getDocs(query(collection(db, 'classes'), where('teacherUid', '==', TEACHER_A))),
    );
    await assertFails(getDocs(collection(db, 'classes')));
  });

  it('학급 코드 목록 훑기는 막힌다', async () => {
    await assertFails(getDocs(collection(asStudent1(), 'classCodes')));
  });
});

describe('학급 코드 / 번호 자리', () => {
  it('로그인 전에도 학급 코드 문서 하나는 읽을 수 있다 (가입 전 확인 화면)', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'classCodes', 'ABC234'), {
        classId: CLASS_A,
        teacherUid: TEACHER_A,
        className: '3학년 2반',
        teacherName: '김다산',
        joinOpen: true,
      });
    });
    await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), 'classCodes', 'ABC234')));
  });

  it('로그인 전에 코드 목록을 훑는 것은 막힌다', async () => {
    await assertFails(getDocs(collection(env.unauthenticatedContext().firestore(), 'classCodes')));
  });

  it('비어 있는 번호는 잡을 수 있다', async () => {
    await assertSucceeds(
      setDoc(doc(asStudent1(), 'classes', CLASS_A, 'numbers', '7'), { uid: STUDENT_1 }),
    );
  });

  it('이미 잡힌 번호는 다시 잡을 수 없다', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'classes', CLASS_A, 'numbers', '7'), { uid: STUDENT_1 });
    });
    await assertFails(
      setDoc(doc(asStudent2(), 'classes', CLASS_A, 'numbers', '7'), { uid: STUDENT_2 }),
    );
  });

  it('남의 uid 로 번호를 잡을 수 없다', async () => {
    await assertFails(
      setDoc(doc(asStudent1(), 'classes', CLASS_A, 'numbers', '9'), { uid: STUDENT_2 }),
    );
  });

  it('학생은 번호 명단을 읽을 수 없다', async () => {
    await assertFails(getDocs(collection(asStudent1(), 'classes', CLASS_A, 'numbers')));
  });
});
