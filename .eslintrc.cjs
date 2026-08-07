module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/prettier',
    'prettier',
  ],
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: [
    'vue',
    'prettier',
  ],
  rules: {
    // 在这里添加你的自定义规则  
    'prettier/prettier': 'warn',
    'vue/multi-word-component-names': 'off',
    'no-var': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off',
    'no-unreachable': 'off',
    'vue/no-unused-vars': 'off',
    'vue/require-v-for-key': 'off',
    // 其他规则...  
  },
  settings: {
    'import/resolvers': {
      // 如果使用别名，可以在这里配置  
    },
  },
};