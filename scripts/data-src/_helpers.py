# 데이터 입력 헬퍼 — 각 fragment 는 이 모듈의 P/F/PL/EV/RT 를 사용해 리스트를 만든다.
def P(id, ko, en, region, start, end, capital, lat, lon, r_km, approx, summary, subjects, standards, note='', polygon=None, sources=None):
    return {
        "id": id, "name_ko": ko, "name_en": en, "region": region,
        "start_year": start, "end_year": end, "capital": capital,
        "centroid": [lat, lon],
        "area_polygon": polygon or [],
        **({"radius_km": r_km} if not polygon else {}),
        "is_approximate": approx, "summary_ko": summary,
        "textbook_appearance": subjects, "achievement_standards": standards,
        "sources": sources or ["교육부 편수자료(역사·세계사)", "2022 개정 교육과정 검정 교과서 공통 서술"],
        "note": note,
    }

def F(id, ko, en, birth, death, approx, polity, lat, lon, act_from, act_to, one_liner, subjects, standards, note='', sources=None):
    return {
        "id": id, "name_ko": ko, "name_en": en, "birth_year": birth, "death_year": death,
        "is_approximate": approx, "polity_id": polity, "activity_location": [lat, lon],
        "activity_years": [act_from, act_to], "one_liner_ko": one_liner,
        "textbook_appearance": subjects, "achievement_standards": standards,
        "sources": sources or ["교육부 편수자료(역사·세계사)", "2022 개정 교육과정 검정 교과서 공통 서술"],
        "note": note,
    }

def PL(id, ko, en, lat, lon, type_, eras, subjects=None, note=''):
    return {"id": id, "name_ko": ko, "name_en": en, "coords": [lat, lon], "type": type_,
            "era_names": [{"from": f, "to": t, "name_ko": n} for f, t, n in eras],
            **({"textbook_appearance": subjects} if subjects else {}), "note": note}

def EV(id, year, ko, en, lat, lon, subjects, bookmark=False, note=''):
    return {"id": id, "year": year, "name_ko": ko, "name_en": en, "coords": [lat, lon],
            "textbook_appearance": subjects, "bookmark": bookmark, **({"note": note} if note else {})}

def RT(id, ko, en, a, b, path, approx=True, note=''):
    return {"id": id, "name_ko": ko, "name_en": en, "active_years": [a, b], "path": path, "is_approximate": approx, "note": note}

H1 = ["역사①"]; H2 = ["역사②"]; W = ["세계사"]; E = ["동아시아 역사 기행"]
H1W = ["역사①", "세계사"]; H1E = ["역사①", "동아시아 역사 기행"]; H2E = ["역사②", "동아시아 역사 기행"]
H1WE = ["역사①", "세계사", "동아시아 역사 기행"]; WE = ["세계사", "동아시아 역사 기행"]
