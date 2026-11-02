// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Surchargé en prod par NUXT_PUBLIC_API_URL
    public: { apiUrl: 'http://localhost:3333' },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'PokéGang',
      meta: [
        {
          name: 'description',
          content:
            'Parcours les 1025 Pokémon sous forme de cartes et range tes préférés dans ton classeur.',
        },
        { name: 'theme-color', content: '#14110f' },
      ],
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
