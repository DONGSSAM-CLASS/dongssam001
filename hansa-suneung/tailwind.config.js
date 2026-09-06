/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Noto Sans KR (webfont, 무료) — index.html 에서 로드
        sans: ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
