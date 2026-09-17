# 데이터 모델

`✅` 는 1단계에서 이미 만든 것, `⬜` 는 이후 단계에서 추가할 것입니다.
규칙(`firestore.rules`)에 열려 있지 않은 컬렉션은 전면 차단 상태이므로,
해당 단계를 구현할 때 규칙도 함께 열어야 합니다.

```
classCodes/{CODE}                                        ✅ 로그인 전 공개(get 만, list 금지)
  classId, teacherId, authPrefix, generations{번호:세대}

classes/{classId}                                        ✅
  name, teacherId, classCode, authPrefix,
  allowNegativeBalance(false), createdAt

  settings/economy                                       ✅
    taxMode('flat'|'progressive'), flatTaxRate(0.1),
    brackets[{upTo, rate}], warningThreshold(3), meritDelegatedRoles[]
  settings/approval                                      ⬜ 7단계 (결재 라인)
  settings/stock                                         ⬜ 8단계 (coinRatio, 수수료, 거래시간)
  settings/bank                                          ⬜ 6단계 (금리상한, 결재 기준금액)

  students/{번호}          공개 명단                        ✅
    number, name, roles[], ministryId, creditScore(1000), debts, uid
  roster/{번호}            교사 전용 비밀값                  ✅
    number, name, pin, authGeneration, updatedAt
  members/{uid}           uid → 번호·역할 매핑               ✅
    number, roles[]

  ministries/{id}                                        ✅ (편집 화면은 2단계)
    name, officialName2026, positionTitle, roleKey,
    salary, duty, capacity, order

  accounts/{accountId}     ★ 잔액은 여기에만 있습니다        ✅
    type('SYSTEM'|'STUDENT'), ownerNumber, balance(int),
    lastTxId, updatedAt
    · MINT           발행·소각 상대 계정 (음수 허용, -잔액 = 통화량)
    · TREASURY       국고
    · S{번호}         학생 지갑
    · BANK_DEPOSIT / BANK_LOAN                           ⬜ 6단계
    · ESCROW         경매 입찰 잠금                        ⬜ 5단계

  transactions/{txId}      ★ append-only, 수정·삭제 영구 금지  ✅
    type, fromAccount, toAccount, amount(int>0), reason,
    actorUid, refDoc, payrollMonth, createdAt

  payrolls/{YYYY-MM}                                     ✅ 규칙만 (화면은 3단계)
    status, executedAt, totals{gross,tax,net}, paidCount
    slips/{번호}   create-only → 같은 달 이중 지급 불가
      gross, tax, loanDeduction, net, held, holdReason

  warnings/{id}                                          ✅ 규칙만 (화면은 4단계)
    number, month, reason, createdAt, canceled, cancelReason, canceledAt
  warningCounts/{YYYY-MM_번호}  { count }                  ✅ 규칙만
  salaryHolds/{YYYY-MM_번호}                              ✅ 규칙만
    held, sourceMonth, releasedBy, releasedAt
  meritPresets/{id}  { label, amount }                    ✅ 규칙만

  auditLogs/{id}   수정·삭제 불가                           ✅
    actorUid, action, target, detail, at
  notices/{id}     관보                                    ✅ 규칙만 (화면은 7단계)

  auctions/{roundId} · bids/{id} · seats/{id}            ⬜ 5단계
  deposits/{id} · loans/{id} · bank/config               ⬜ 6단계
  approvals/{id}                                         ⬜ 7단계
  stocks/{ticker} · holdings/{uid_ticker} · orders/{id}  ⬜ 8단계
  reports/{YYYY-MM}                                      ⬜ 9단계

stockPrices/{ticker}   전역 캐시, 클라이언트는 읽기만        ✅ 규칙만 (수집 스크립트 완료)
  ticker, name, price, currency, fxRate, krw, coin,
  daily[30], source, updatedAt, lastSuccessAt, lastError
```

## 불변식

1. **모든 `accounts.balance` 의 합 == 0** — `scripts/verify-ledger.ts` 로 확인합니다.
2. 통화량 = `-(accounts/MINT.balance)`
3. `transactions` 는 한 번 쓰면 바뀌지 않습니다.
4. 같은 달 같은 학생의 `payrolls/{월}/slips/{번호}` 는 하나뿐입니다.

## 규칙에서 자주 쓰는 함수

| 함수 | 뜻 |
| --- | --- |
| `isTeacher(classId)` | 대통령(담임교사)인가 |
| `isMember(classId)` | 이 학급 구성원인가 |
| `hasRole(classId, 'FINANCE_MINISTER')` | 해당 역할 키를 가졌는가 |
| `myAccount(classId)` | 내 지갑 계정 ID (`S07`) |
| `emailMatches(classId, number)` | 가상 이메일이 그 번호의 것인가 |
| `accountMoveValid(cid, accId)` | 복식부기 짝이 맞는가 (핵심) |
| `txTypeAllowed(cid, tx)` | 이 거래 유형을 이 사람이 이 방향으로 만들 수 있는가 |
