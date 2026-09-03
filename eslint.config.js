import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Three.js 객체(텍스처·머티리얼)는 useEffect/useFrame 안에서 직접 변경해야 하므로 React Compiler 불변성 규칙은 끈다
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
);
