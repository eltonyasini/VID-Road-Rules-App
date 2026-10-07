# Development notes

## Run the app

Install Node.js 22.13 or newer, then run:

```bash
npm ci
npm run dev
```

Open the address printed in the terminal. The app uses the base path
`/VID-Road-Rules-App/`.

## Main files

- `app/page.tsx` manages quiz state, scoring, navigation and saved progress.
- `app/components/QuestionCard.tsx` displays each question and its answers.
- `app/hooks/usePreloadImages.ts` preloads upcoming question images.
- `app/questions.json` contains the question data.
- `app/globals.css` contains the styles.
- `public/question-images/` contains the diagrams.

Keep functions small, use descriptive names and add comments where the purpose
is not obvious. Keep the menu in the main page and the question card separate.

## Question data

Question IDs start at 1 and must match their order in the JSON list. Correct
answers use zero-based option indexes. An image path can be null when a question
has no diagram.

## Check changes

Run `npm run lint` and `npm run build` when changing application code. The current
`npm test` command checks rendered HTML, not the complete quiz behaviour.

For quiz changes, check correct and incorrect answers, repeated clicks, moving to
the next question, final results, restarting, exit confirmation and restoring
progress after a reload. Check all three quiz modes when changing shared logic.

Progress is stored in the browser. Confirming an exit clears the active session.
Image preloading follows the active quiz order and skips text-only questions.

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds pushes to
`main` and publishes `dist/client` to GitHub Pages.

The current build uses Vite and Vinext. Changes to build configuration should be
verified separately from changes to quiz behaviour.
