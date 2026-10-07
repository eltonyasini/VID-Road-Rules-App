# VID Road Rules Practice

A browser app for practising 400 Zimbabwe VID road-rule questions, with road diagrams, immediate answer feedback and saved progress.

**[Open the app](https://eltonyasini.github.io/VID-Road-Rules-App/)**

## Quiz modes

| Mode | What it does |
| --- | --- |
| 25-question sets | Choose one of 16 sets and practise its questions in order. |
| Random 25 | Start a new random selection of 25 questions. |
| Ultimate 400 | Work through every question in its original order. |

## How practice works

1. Choose a quiz mode.
2. Click an answer to check it immediately.
3. A correct answer turns green. A wrong answer turns red, and the correct option is highlighted in green.
4. Click **Next card** when you are ready.
5. After the last question, select **See results** to view your score.

An answer can only be marked once per question. Retrying a set or Ultimate 400 starts the same questions again; retrying Random 25 creates a fresh selection.

The app preloads the next two questions that contain images, skipping text-only questions. This helps upcoming diagrams appear faster without adding a fixed delay. Loading speed still depends on your connection and browser.

## Saved progress and exiting

Progress is saved in this browser on this device using `localStorage`. Reloading the app normally restores your current quiz. Progress does not sync between devices or browsers.

- **Exit quiz** asks for confirmation during an unfinished quiz.
- **Cancel** keeps your current question and progress.
- **OK** clears the current quiz and returns to the menu.
- A finished quiz can return to the menu without a warning.

If the browser cannot save, the app displays a message and lets you keep practising. Clearing browser storage also removes saved progress. The app does not currently provide a dedicated offline mode.

## Run locally

Install **Node.js 22.13 or newer** and npm. Use a supported Node version compatible with the locked dependencies; the deployment workflow uses Node 22.

Clone the repository:

```bash
git clone https://github.com/eltonyasini/VID-Road-Rules-App.git
cd VID-Road-Rules-App
npm ci
npm run dev
```

Alternatively, download and extract the repository ZIP, open a terminal in its folder, then run `npm ci` and `npm run dev`.

Open the address printed by the development server. The project uses the base path `/VID-Road-Rules-App/`; with the default port, try:

```text
http://localhost:5173/VID-Road-Rules-App/
```

Press **Ctrl + C** in the terminal to stop it. On later launches, run `npm run dev` again.

Windows users can also double-click `START-WINDOWS.bat`. It installs packages with `npm install` if needed, then starts the development server.

## Where the code lives

| File or folder | Responsibility |
| --- | --- |
| `app/page.tsx` | Keeps quiz state, displays the menu and results, checks answers, manages navigation and saves progress. |
| `app/components/QuestionCard.tsx` | Displays the current question, diagram, answer options, feedback and Next button. |
| `app/hooks/usePreloadImages.ts` | Loads the current image and preloads the next two image questions. |
| `app/questions.json` | Stores the question text, answer options, correct answers and image paths. |
| `app/globals.css` | Controls colours, spacing, layouts and responsive styles. |
| `app/layout.tsx` | Provides the outer page layout, fonts and metadata. |
| `public/question-images/` | Contains the road diagrams. |
| `public/favicon.svg` | Browser-tab icon. |
| `vite.config.ts` | Configures the development server, base path and build plugins. |
| `.github/workflows/deploy.yml` | Builds and deploys the app to GitHub Pages. |
| `scripts/extract_questions.py` | Development utility for extracting questions and diagrams from a supplied PDF. |

## Understanding the quiz code

The main page stores a `session` object:

| Field | Meaning |
| --- | --- |
| `phase` | Which screen is showing: menu, quiz or results. |
| `kind` | Which quiz mode is active. |
| `setNumber` | The selected set number, when practising a set. |
| `questionIds` | The questions included in this quiz, in their display order. |
| `current` | The current question's position, starting at zero. |
| `selected` | The chosen option's position, or `null` before choosing. |
| `checked` | Whether the current answer has been marked. |
| `score` | The number of correct answers so far. |

`selectOption()` calls `checkAnswer()`, then updates the session. React redraws the relevant parts of the screen using those new values.

`QuestionCard` receives information and click functions from the page through **props**. It displays the question and calls those functions when you click. Scoring and saved progress stay in the page.

The preloading hook is called from the page, but its image-loading logic stays in its own file.

## Question data

Each question has this shape. This is an illustrative example:

```json
{
  "id": 1,
  "question": "What does this sign mean?",
  "options": ["Stop", "Give way", "No entry"],
  "correct": 0,
  "image": "/question-images/q-001.png"
}
```

- `correct` is a zero-based option index: `0` means the first answer.
- `image` is `null` for a question without a diagram.
- The current code expects IDs to be sequential, starting at 1, and in the same order as the JSON list.
- Changing the number of questions also requires reviewing labels such as “Ultimate 400” and “16 focused sets”.

The source PDF is not included in this repository. The extraction script requires a separately supplied PDF, Python, `pdfplumber` and Pillow. It writes to `app/questions.json` and `public/question-images/`, so review its output before committing it.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the exact dependencies recorded in the lockfile. |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build using Vinext. |
| `npm start` | Serve the production build using Vinext. |
| `npm run lint` | Run the configured ESLint checks. |
| `npm test` | Build the project and run the existing rendered-HTML test. |

The existing test checks development-preview metadata. It is not a full test suite for scoring, quiz navigation or saved progress.

## Deployment and current tooling

Pushing to `main` triggers the GitHub Pages workflow. It installs dependencies, runs `npm run build`, and deploys `dist/client`. Changes appear on the live site after the workflow finishes successfully.

The interface uses **React and TypeScript**, with CSS for styling. The current build still uses **Vite, Vinext, Next-related packages and Cloudflare tooling** inherited from the starter project.

Database scaffolding also remains, but the quiz itself saves progress in the browser and does not use a database. Some starter documentation and scripts describe optional infrastructure rather than the current GitHub Pages workflow. Build simplification is a separate future change.
