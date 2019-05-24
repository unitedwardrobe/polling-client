module.exports = function(wallaby) {
  return {
    files: [
      'jest-config.js',
      'tsconfig.json',
      'src/**/*.ts',
      '!src/**/__tests__/*.ts',
      '!src/**/*.test.ts',
      '!src/**/*.spec.ts',
    ],
    tests: ['src/**/__tests__/*.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
    env: {
      type: 'node',
      runner: 'node',
    },
    testFramework: 'jest',
    preprocessors: {
      '**/*.js': (file) =>
        require('@babel/core').transform(file.content, {
          sourceMap: true,
          filename: file.path,
          presets: ['babel-preset-jest'],
        }),
    },
  };
};
