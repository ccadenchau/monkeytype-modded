# Personal static Monkeytype

Requires Node.js 24 and pnpm 11.21.0.

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000. Build with `pnpm build`; serve the generated
`frontend/dist` directory using any static host. Configure a fallback to
`index.html` for `/settings`. `pnpm start` previews the production build.

The UI exposes the typing test and local settings. Account, leaderboard and
admin routes redirect to the typing test. Settings stay in this browser.
There is no backend service, cloud sync or account-based result history.
Docker, automated test suites, Storybook and release tooling were removed.
Shared packages under `packages/` are still required to build the frontend.

Upstream project information follows.

---

[![](https://github.com/monkeytypegame/monkeytype/blob/master/frontend/static/images/githubbanner2.png?raw=true)](https://monkeytype.com/)
<br />

[![AnimeJs](https://img.shields.io/badge/Anime.js-ff4b4b?style=for-the-badge&logo=animedotjs&logoColor=white)](https://animejs.com/)&nbsp;
[![ChartJs](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)&nbsp;
[![Fontawesome](https://img.shields.io/badge/fontawesome-538DD7?style=for-the-badge&logo=fontawesome&logoColor=white)](https://fontawesome.com/)&nbsp;
[![HTML5](https://img.shields.io/badge/html5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)&nbsp;
[![OXLint](https://img.shields.io/badge/oxlint-2b3c5a?style=for-the-badge&logo=oxc&logoColor=white)](https://oxc.rs/docs/guide/usage/linter.html)&nbsp;
[![PNPM](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)&nbsp;
[![SASS](https://img.shields.io/badge/SASS-CC6699?style=for-the-badge&logo=SASS&logoColor=white)](https://sass-lang.com/)&nbsp;
[![Solid](https://img.shields.io/badge/solid-2C4F7C?style=for-the-badge&logo=solid&logoColor=white)](https://www.solidjs.com/)&nbsp;
[![Tailwind](https://img.shields.io/badge/tailwind-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)&nbsp;
[![Tanstack](https://img.shields.io/badge/Tanstack-EDE8D1?style=for-the-badge&logo=tanstack&logoColor=3A3A38)](https://tanstack.com/)&nbsp;
[![Turborepo](https://img.shields.io/badge/-Turborepo-FF1E56?style=for-the-badge&logo=turborepo&logoColor=white)](https://turborepo.org/)&nbsp;
[![TypeScript](https://img.shields.io/badge/typescript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)&nbsp;
[![Vite](https://img.shields.io/badge/Vite-9135FF?style=for-the-badge&logo=Vite&logoColor=white)](https://vitejs.dev/)&nbsp;
[![Zod](https://img.shields.io/badge/-Zod-408AFF?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)

# About

Monkeytype is a minimalistic and customizable [typing test](https://www.monkeytype.com). It features many test modes and user-configurable features such as themes, sounds, a smooth caret, and more. Monkeytype attempts to emulate a natural typing experience during a typing test by unobtrusively presenting the text prompts and displaying typed characters in place, providing straightforward, real-time feedback on typos, speed, and accuracy.

# Features

- Minimalistic design and focus mode while typing
- Type what you see, see what you type
- Live errors, wpm, and accuracy displays
- A variety of test lengths and languages
- Punctuation and numbers modes
- Quotes
- Themes
- Smooth caret
- Challenges and just-for-fun test modifiers
- And much more

# Maintaining this static site

The app is served from `frontend/dist`; settings are stored in browser localStorage. For local development and production builds, use the commands above. The asset guides in `docs/` explain how to update fonts, languages, layouts, quotes, and themes.
