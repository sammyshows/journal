module.exports = function (api) {
  api.cache(true)
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel' // YES: here in presets, NOT plugins
    ],
    plugins: [
      'react-native-reanimated/plugin', // If you're using it
    ],
  }
}
