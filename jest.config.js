module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage-jest',
  testEnvironment: 'node',
  testMatch: [ "**/__tests__/**/*.test.js" ],
  clearMocks: true,
};