module.exports = {
  root: true,
  extends: ['@react-native'],
  plugins: ['import'],
  rules: {
    // Enforce grouped, alphabetized imports with blank lines between groups
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
        // Treat src/* as internal for nicer ordering
        pathGroups: [
          { pattern: 'src/**', group: 'internal', position: 'after' },
        ],
      },
    ],
    // Rely on import/order alphabetize instead of sort-imports to avoid conflicts
    'sort-imports': 'off',
  },
  settings: {
    'import/resolver': {
      // Help resolve TS paths if using tsconfig paths
      typescript: {},
    },
  },
};
