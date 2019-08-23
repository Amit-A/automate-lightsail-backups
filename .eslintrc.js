module.exports = {
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 6
  },
  env: {
    node: true,
    es6: true
  },
  extends: 'eslint:recommended',
  rules: {
    'comma-dangle': [ 'error', 'never' ],
    'eqeqeq': [ 'error', 'smart' ],
    'indent': ['error', 2, { SwitchCase: 1 } ],
    'no-console': [ 'warn', { allow: [ 'error', 'warn', 'log' ] } ],
    'no-else-return': 'error',
    'no-empty': 0,
    'no-param-reassign': 'error',
    'no-unused-vars': 'warn',
    'no-use-before-define': [ 'error', 'nofunc' ],
    'no-var': 'error',
    'object-curly-spacing': [ 'warn', 'always' ],
    'prefer-const': 'error',
    'quotes': [ 'error', 'single' ],
    'keyword-spacing': 'warn',
    'require-await': 'error',
    'semi': [ 'error', 'always' ]
  }
};
