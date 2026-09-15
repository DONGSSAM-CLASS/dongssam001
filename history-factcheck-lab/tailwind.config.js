/** @type {import('tailwindcss').Config} */
// 디자인 톤: 수사 기록부·탐정 노트. 진한 남색 / 크라프트 베이지 / 경고 빨강.
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1b2a4a', // 진한 남색 — 본문·헤더
          deep: '#101b33',
          soft: '#3a4d75',
        },
        kraft: {
          DEFAULT: '#e8dcc4', // 크라프트 베이지 — 카드 바탕
          light: '#f5efe1',
          dark: '#cbb995',
        },
        alert: {
          DEFAULT: '#a62828', // 경고 빨강 — 오류 배지·주의 문구
          soft: '#d4635f',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans KR"', 'system-ui', 'sans-serif'],
      },
      lineHeight: {
        reading: '1.7', // 본문 줄간격 고정값
      },
      backgroundImage: {
        // 종이질감: 외부 이미지 없이 CSS 그라디언트만 사용(저대역폭 대응)
        paper:
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.012) 0px, rgba(0,0,0,0.012) 1px, transparent 1px, transparent 3px), radial-gradient(circle at 20% 10%, #f7f2e6 0%, #efe7d5 55%, #e7dcc6 100%)',
      },
    },
  },
  plugins: [],
};
