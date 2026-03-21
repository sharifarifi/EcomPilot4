import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: [
      'src/context/AuthContext.jsx',
      'src/components/settings/integrations/AccountingApps.jsx',
      'src/components/settings/integrations/EcommerceApps.jsx',
      'src/components/settings/integrations/LogisticsApps.jsx',
      'src/components/settings/integrations/MarketplaceApps.jsx',
      'src/components/settings/integrations/PaymentApps.jsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
