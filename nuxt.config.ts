// https://nuxt.com/docs/api/configuration/nuxt-config
import { NB_POKEMON } from './shared/utils/pokedex'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxtjs/i18n'],
  hooks: {
    // Chaque fiche /pokemon/:id sort en HTML statique au build : plus besoin
    // d'appeler PokéAPI à chaque visite. Les autres langues restent en SSR.
    async 'prerender:routes'({ routes }) {
      const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon?limit=${NB_POKEMON}`,
      )
      if (!res.ok) throw new Error(`PokéAPI injoignable (${res.status})`)
      const { results } = (await res.json()) as { results: { url: string }[] }

      for (const { url } of results) {
        const id = url.split('/').filter(Boolean).pop()
        routes.add(`/pokemon/${id}`)
      }
    },
  },
  i18n: {
    // Fichiers dans i18n/locales/ ; en.json sert de référence à scripts/check-i18n.mjs
    locales: [
      { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
      { code: 'es', language: 'es-ES', name: 'Español', file: 'es.json' },
      { code: 'pt', language: 'pt-BR', name: 'Português', file: 'pt.json' },
    ],
    defaultLocale: 'fr',
    // Sert aux liens hreflang absolus ; surchargé en prod par NUXT_PUBLIC_I18N_BASE_URL
    baseUrl: 'http://localhost:3000',
    // Le français garde les URLs actuelles, les autres langues sont préfixées (/en/favoris)
    strategy: 'prefix_except_default',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_langue',
      redirectOn: 'root',
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Surchargé en prod par NUXT_PUBLIC_API_URL
    public: { apiUrl: 'http://localhost:3333' },
  },
  app: {
    head: {
      title: 'PokéGang',
      // lang et description dépendent de la langue : posés dans app.vue
      meta: [{ name: 'theme-color', content: '#14110f' }],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800&family=DM+Mono:wght@400;500&display=swap',
        },
      ],
    },
  },
})
