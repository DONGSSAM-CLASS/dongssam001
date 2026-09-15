import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 42px rgba(56, 189, 248, 0.18)',
      },
    },
  },
  daisyui: {
    themes: ['dark'],
    darkTheme: 'dark',
  },
  plugins: [daisyui],
};
