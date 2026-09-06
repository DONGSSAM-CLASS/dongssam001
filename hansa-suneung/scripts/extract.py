#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
scripts/extract.py — 평가원 한국사 문제지 PDF에서 문항 메타데이터 초안을 추출한다.

원칙(프롬프트 0장·6장):
  - 데이터를 지어내지 않는다. 추출된 텍스트를 근거로만 초안을 만든다.
  - topic, unitIds 는 비워 둔다(자동 추론 금지). 검수 화면에서 교사가 확정한다.
  - 각 문항에 pdfPage, evidence.extractedText, evidence.sourceFile 을 채운다.
  - 분리 실패 문항은 parseWarning 에 사유를 남기고 리포트로 출력한다.

로컬 실행 전용(배포물에 포함하지 않음). 산출물 items.draft.json 은 저작권상 커밋/배포하지 않는다.

사용법:
  pip install -r scripts/requirements.txt
  python3 scripts/extract.py                # data/raw/*.pdf 전체
  python3 scripts/extract.py data/raw/2026_수능_한국사.pdf

입력 파일명 규칙: {학년도}_{시행구분}_한국사.pdf   예) 2026_수능_한국사.pdf, 2026_9월_한국사.pdf
"""
from __future__ import annotations

import glob
import json
import os
import re
import sys

try:
    import pdfplumber
except ImportError:
    sys.exit(
        "pdfplumber 가 필요합니다. 먼저 설치하세요:\n"
        "  pip install -r scripts/requirements.txt"
    )

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
RAW_DIR = os.path.join(ROOT, "data", "raw")
OUT_JSON = os.path.join(ROOT, "data", "items.draft.json")
OUT_REPORT = os.path.join(ROOT, "data", "items.draft.report.txt")

# 시행 구분 → examId 코드
TYPE_CODE = {"수능": "CSAT", "6월": "JUN", "9월": "SEP"}

# 문항 시작 패턴: 줄 맨 앞의 "1." "12." (전각 마침표 포함)
Q_START = re.compile(r"^\s*(\d{1,2})[.．]")
FNAME_RE = re.compile(r"^(\d{4})_(수능|6월|9월)_한국사$")

MAX_EVIDENCE_CHARS = 200


def parse_filename(path: str):
    """파일명에서 (학년도, 시행구분, examId) 를 얻는다. 규칙에 안 맞으면 (None, None, None)."""
    base = os.path.splitext(os.path.basename(path))[0]
    m = FNAME_RE.match(base)
    if not m:
        return None, None, None
    year, typ = int(m.group(1)), m.group(2)
    exam_id = f"{year}-{TYPE_CODE[typ]}"
    return year, typ, exam_id


def extract_pdf(path: str):
    year, typ, exam_id = parse_filename(path)
    warnings: list[str] = []
    if exam_id is None:
        warnings.append(
            f"[파일명 규칙 불일치] '{os.path.basename(path)}' → "
            f"'{{학년도}}_{{시행구분}}_한국사.pdf' 형식이어야 합니다. 건너뜀."
        )
        return [], warnings

    source_file = os.path.basename(path)
    items = []
    with pdfplumber.open(path) as pdf:
        for page_index, page in enumerate(pdf.pages):
            page_no = page_index + 1
            text = page.extract_text() or ""
            lines = text.split("\n")
            # 이 페이지에서 문항 시작 지점 수집: (문항번호, 줄 인덱스)
            starts = []
            for li, line in enumerate(lines):
                m = Q_START.match(line)
                if m:
                    starts.append((int(m.group(1)), li))
            for idx, (num, li) in enumerate(starts):
                end_li = starts[idx + 1][1] if idx + 1 < len(starts) else len(lines)
                chunk = " ".join(l.strip() for l in lines[li:end_li]).strip()
                evidence_text = chunk[:MAX_EVIDENCE_CHARS]
                item = {
                    "itemId": f"{exam_id}-{num:02d}",
                    "examId": exam_id,
                    "number": num,
                    "unitIds": [],
                    "topic": None,
                    "keywords": [],
                    "itemType": None,
                    "pdfPage": page_no,
                    "evidence": {
                        "extractedText": evidence_text,
                        "sourceFile": source_file,
                    },
                    "verified": False,
                    "verifiedAt": None,
                    "note": "",
                }
                if len(evidence_text) < 10:
                    item["parseWarning"] = "추출 텍스트가 너무 짧음 — 이미지/표 문항일 수 있음. 수동 확인 필요."
                items.append(item)

    # 문항 번호 검증: 중복/누락 리포트
    numbers = [it["number"] for it in items]
    dupes = sorted({n for n in numbers if numbers.count(n) > 1})
    if dupes:
        warnings.append(f"[{exam_id}] 중복 문항 번호 감지: {dupes} (페이지 경계 재확인 필요)")
    if numbers:
        expected = set(range(1, max(numbers) + 1))
        missing = sorted(expected - set(numbers))
        if missing:
            warnings.append(f"[{exam_id}] 누락 추정 문항 번호: {missing} (분리 실패 가능)")
    else:
        warnings.append(f"[{exam_id}] 문항을 하나도 분리하지 못함 — 스캔/이미지 PDF 여부 확인 필요")

    return items, warnings


def main():
    args = sys.argv[1:]
    if args:
        paths = args
    else:
        paths = sorted(glob.glob(os.path.join(RAW_DIR, "*.pdf")))

    if not paths:
        print(f"대상 PDF가 없습니다: {RAW_DIR}/*.pdf")
        print("평가원 게시판에서 문제지 PDF를 내려받아 data/raw/ 에 넣으세요.")
        return

    all_items = []
    all_warnings = []
    for path in paths:
        items, warnings = extract_pdf(path)
        all_items.extend(items)
        all_warnings.extend(warnings)
        print(f"· {os.path.basename(path)}: 문항 {len(items)}개, 경고 {len(warnings)}건")

    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

    with open(OUT_REPORT, "w", encoding="utf-8") as f:
        f.write(f"추출 문항 합계: {len(all_items)}\n")
        f.write(f"경고 합계: {len(all_warnings)}\n\n")
        for w in all_warnings:
            f.write(w + "\n")

    print(f"\n초안 저장: {OUT_JSON}  (문항 {len(all_items)}개)")
    print(f"리포트:   {OUT_REPORT}  (경고 {len(all_warnings)}건)")
    print("→ 검수 화면(/teacher/verify)에서 이 draft 를 불러와 topic·unitIds·itemType 을 확정하세요.")
    if all_warnings:
        print("\n[경고 요약]")
        for w in all_warnings:
            print("  -", w)


if __name__ == "__main__":
    main()
