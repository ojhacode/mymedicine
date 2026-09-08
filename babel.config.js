module.exports = {
  presets: [
    'babel-preset-expo', // Essential for React Native
    'nativewind/babel'                 // For NativeWind
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@appContent':'./src/AppContent',
          '@nepaliTimePicker': './src/NepaliTimePicker',
          '@family':'./src/family',
          '@stack':'./src/stack/Stack',
          '@authStack':'./src/stack/AuthStack',
          '@appStack':'./src/stack/AppStack',
          '@signIn': './src/SignIn',
          '@asset': './src/asset',
          '@context': './src/context',
          '@data': './src/data',
          '@ui':'./src/ui',
          '@utils': './src/utils',
          '@type': './src/type',
          '@components': './src/components',
          '@screens': './src/screens',
          '@hooks': './src/hooks',
          '@protected': './src/screens/protected',
          '@calendar': './src/calendar',
          '@legal': './src/legal',
          '@db':'./src/db',
          '@pull':'./src/db/sync/pull',
          '@push':'./src/db/sync/push',
          '@module':'./src/module',
          '@migration':'./src/migration',
          '@config':'./src/config',
          '@firebase':'./src/firebase',
          '@services':'./src/services',
          '@constant':'./src/constant',
          '@translation':'./src/translation',
          '@core':'./src/core',
          '@voice':'./src/voice',
          '@logic':'./src/logic',
          '@global':'./src/global'
        }
      }
    ]
  ]
}