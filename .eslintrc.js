module.exports = {
  root: true,
  extends: ['@react-native', 'plugin:prettier/recommended'],
  plugins: ['import'],
  rules: {
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
          'type',
        ],
        'newlines-between': 'never',
        alphabetize: { order: 'asc', caseInsensitive: true },
        pathGroupsExcludedImportTypes: ['builtin'],
        pathGroups: [
          { pattern: 'src/**', group: 'internal', position: 'after' },
        ],
      },
    ],
    'sort-imports': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
};
