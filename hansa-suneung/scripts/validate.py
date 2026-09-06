#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/validate.py — 배포 데이터 무결성 검사(Python 대체본). 오류가 있으면 exit code 1.

주의: 빌드(npm run verify-data)는 이제 Python 없이 동작하도록 Node 판(scripts/validate.mjs)을 쓴다.
이 파이썬 스크립트는 동일 검사의 대체 실행용이며, 두 파일의 검사 항목은 동일하게 유지할 것.

검사 항목(프롬프트 6장):
  [오류] 존재하지 않는 unitIds 참조
  [오류] verified: true 인데 topic 이 비어 있음
  [오류] 중복 itemId
  [오류] 한 시험의 문항 수가 totalItems 를 초과
  [오류] (초안이 있으면) evidence.sourceFile 이 data/raw 의 실제 파일과 불일치
  [경고] 한 시험의 문항 수가 totalItems 미만(입력 진행 중일 수 있음)
  [경고] 저작권: 배포용 items.json 에 evidence(원문 추출 텍스트)가 포함됨

npm run verify-data 로 실행되며 npm run build 전에 자동 실행된다.
"""
from __future__ import annotations

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "public", "data")
RAW_DIR = os.path.join(ROOT, "data", "raw")
DRAFT = os.path.join(ROOT, "data", "items.draft.json")

errors: list[str] = []
warnings: list[str] = []


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


def collect_unit_ids(units, acc):
    for u in units:
        acc.add(u["id"])
        collect_unit_ids(u.get("children", []), acc)


def main():
    curriculum = load("curriculum.json")
    exams = load("exams.json")
    items = load("items.json")

    unit_ids: set[str] = set()
    collect_unit_ids(curriculum.get("units", []), unit_ids)
    exam_ids = {e["examId"] for e in exams}

    # 1) 중복 itemId
    seen = set()
    for it in items:
        iid = it["itemId"]
        if iid in seen:
            errors.append(f"중복 itemId: {iid}")
        seen.add(iid)

    # 2) unitIds 참조 / verified-topic / examId 참조 / evidence 저작권
    for it in items:
        for uid in it.get("unitIds", []):
            if uid not in unit_ids:
                errors.append(f"{it['itemId']}: 존재하지 않는 unitId 참조 → {uid}")
        if it.get("verified") and not (it.get("topic") or "").strip():
            errors.append(f"{it['itemId']}: verified=true 인데 topic 이 비어 있음")
        if it.get("examId") not in exam_ids:
            errors.append(f"{it['itemId']}: 존재하지 않는 examId 참조 → {it.get('examId')}")
        if "evidence" in it:
            warnings.append(
                f"{it['itemId']}: 배포용 items.json 에 evidence 가 포함됨 "
                f"(저작권 — 배포 전 제거 권장)"
            )

    # 3) 시험별 문항 수 vs totalItems
    for e in exams:
        cnt = sum(1 for it in items if it.get("examId") == e["examId"])
        total = e.get("totalItems")
        if isinstance(total, int):
            if cnt > total:
                errors.append(
                    f"{e['examId']}: 등록 문항 수({cnt})가 totalItems({total})를 초과"
                )
            elif 0 < cnt < total:
                warnings.append(
                    f"{e['examId']}: 등록 문항 수({cnt}) < totalItems({total}) — 입력 진행 중"
                )

    # 4) 초안(있으면) evidence.sourceFile 실제 파일 존재 확인
    if os.path.exists(DRAFT):
        with open(DRAFT, encoding="utf-8") as f:
            draft = json.load(f)
        for it in draft:
            src = (it.get("evidence") or {}).get("sourceFile")
            if src and not os.path.exists(os.path.join(RAW_DIR, src)):
                errors.append(
                    f"[draft] {it.get('itemId')}: evidence.sourceFile 이 실제 파일과 불일치 → {src}"
                )

    # 결과 출력
    print(f"검증 대상: 단원 {len(unit_ids)}개 · 시험 {len(exams)}개 · 문항 {len(items)}개")
    for w in warnings:
        print("  ⚠️ ", w)
    for e in errors:
        print("  ❌ ", e)

    if errors:
        print(f"\n무결성 검사 실패: 오류 {len(errors)}건. 배포를 중단합니다.")
        sys.exit(1)
    print(f"\n무결성 검사 통과 (경고 {len(warnings)}건).")


if __name__ == "__main__":
    main()
