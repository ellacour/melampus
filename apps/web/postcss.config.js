/**
 * PostCSS pipeline pour Vite.
 * Sans ce fichier, Tailwind n'est pas exécuté et `@tailwind base/components/utilities`
 * dans src/index.css passent tels quels — l'app rend en HTML brut sans utilitaires.
 *
 * Le repo est en "type": "module" (cf. package.json), donc syntaxe ESM.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
