# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default {
  // other rules...
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.json', './tsconfig.node.json'],
    tsconfigRootDir: __dirname,
  },
}
```

- Replace `plugin:@typescript-eslint/recommended` to `plugin:@typescript-eslint/recommended-type-checked` or `plugin:@typescript-eslint/strict-type-checked`
- Optionally add `plugin:@typescript-eslint/stylistic-type-checked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and add `plugin:react/recommended` & `plugin:react/jsx-runtime` to the `extends` list

# Supabase

To install CLI for local development, 
- Run `brew install supabase/tap/supabase` for MacOS/Linux
- Required for edge function development
- Install recommended Deno vscode extensions

More info on [supabase docs](https://supabase.com/docs).

# Instructions

To run docker compose, export the following env variables locally.
```
VITE_SUPABASE_URL={REPLACE ME}
VITE_SUPABASE_ANON_KEY={REPLACE ME}
VITE_REGISTER_SECRET={REPLACE ME}
```
- Run `docker-compose up -d --build`
- Application should start up on [http://localhost:4173/](http://localhost:4173/)
# synergy git init git add README.md git commit -m first commit git branch -M main git remote add origin git@github.com:aidenrawles/synergy.git git push -u origin main
# synergy
