module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // Some SDK dependencies (e.g. zod v4) ship ESM that uses
    // `export * as ns from '...'`. Metro's commonjs transform needs this
    // plugin to lower that syntax; without it the bundle fails with
    // "Export namespace should be first transformed by
    // @babel/plugin-transform-export-namespace-from".
    '@babel/plugin-transform-export-namespace-from',
  ],
};
