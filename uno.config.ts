import {
  defineConfig,
  presetAttributify,
  presetUno,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';

export default defineConfig({
  shortcuts: {
    'wh-full': 'w-full h-full',
    'xy-center': 'justify-center items-center flex',
  },
  rules: [['font-pingfang', { 'font-family': 'PingFangSC-Regular' }]],
  presets: [presetUno(), presetAttributify()],
  transformers: [transformerDirectives(), transformerVariantGroup()],
});
