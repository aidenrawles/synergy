// src/vite-plugin-eslint.d.ts

declare module 'vite-plugin-eslint' {
  import { Plugin } from 'vite';

  interface Options {
    cache?: boolean;
  }

  export default function eslintPlugin(options?: Options): Plugin;
}
