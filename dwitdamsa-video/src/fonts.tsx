import "@fontsource/black-han-sans/korean-400.css";
import "@fontsource/black-han-sans/latin-400.css";
import "@fontsource/nanum-pen-script/korean-400.css";
import "@fontsource/nanum-pen-script/latin-400.css";
import "@fontsource/noto-sans-kr/korean-500.css";
import "@fontsource/noto-sans-kr/latin-500.css";
import "@fontsource/noto-sans-kr/korean-800.css";
import "@fontsource/noto-sans-kr/latin-800.css";
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { ALL_TEXT } from "./copy";

export const DISPLAY = "'Black Han Sans', sans-serif";
export const HAND = "'Nanum Pen Script', cursive";
export const BODY = "'Noto Sans KR', sans-serif";

const SPECS = [
  `400 40px 'Black Han Sans'`,
  `400 40px 'Nanum Pen Script'`,
  `500 40px 'Noto Sans KR'`,
  `800 40px 'Noto Sans KR'`,
];

// 한글 폰트는 유니코드 구간별로 쪼개져 있으므로, 실제로 쓰는 글자를 미리 불러 둔 뒤 렌더한다.
export const FontGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [handle] = useState(() => delayRender("Loading Korean fonts"));
  useEffect(() => {
    Promise.all(SPECS.map((f) => document.fonts.load(f, ALL_TEXT)))
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
  return <>{children}</>;
};
