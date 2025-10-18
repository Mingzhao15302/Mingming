module.exports = {
  extends: ['eslint:recommended'],
  env: {
    es6: true,
    browser: true,
    node: true
  },
  globals: {
    wx: true,
    App: true,
    Page: true,
    getApp: true,
    Component: true
  },
  rules: {
    'no-unused-vars': 'off'
  }
};
