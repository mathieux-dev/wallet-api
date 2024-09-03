module.exports = {
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.(t|j)sx?$': 'ts-jest',
  },
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^prisma/(.*)$': '<rootDir>/prisma/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage',
    '/prisma',
    'src/shared/validators',
    '.*\\.d\\.ts$',
    '.*\\.module\\.spec\\.ts$',
  ],
};
