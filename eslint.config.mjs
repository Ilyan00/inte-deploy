// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'no-console': 'error',
    'no-debugger': 'error',
    // Prettier écrit <img />, on aligne ESLint dessus pour éviter qu'ils se contredisent
    'vue/html-self-closing': ['warn', { html: { void: 'always' } }],
  },
})
