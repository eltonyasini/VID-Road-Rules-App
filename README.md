# Learners Practice

A browser app for practising 400 Zimbabwe road-rule questions, with road diagrams, end-of-quiz answer review and saved progress.

**[Open the app](https://eltonyasini.github.io/VID-Road-Rules-App/)**

## Quiz modes

| Mode | What it does |
| --- | --- |
| 25-question sets | Choose one of 16 sets and practise its questions in order. |
| Random 25 | Start a new random selection of 25 questions. |
| Ultimate 400 | Work through every question in its original order. |

## How practice works

1. Choose a quiz mode.
2. Click an answer to save your choice and move straight to the next question.
3. Answers and the running score stay hidden during the quiz.
4. Sets and Random 25 finish after all 25 answers. Ultimate 400 also offers **Done** after your first answer, so you can finish early.
5. Results show your score out of the questions you answered. Unanswered questions are not counted as wrong.
6. Select **Review answers** to see all your choices. Tick **Only show mistakes** inside the review to filter out correct answers.

Retrying a set or Ultimate 400 clears your answer history and starts the same questions again. Retrying Random 25 creates a fresh selection. There is no Next button; rapid double-clicks are ignored to avoid accidentally answering another question.

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

Windows users can also double-click `START-WINDOWS.bat`. It installs packages with `npm ci` if needed, then starts the development server.

## Where the code lives

| File or folder | Responsibility |
| --- | --- |
| `app/page.tsx` | Keeps quiz state, displays the menu and results, checks answers, manages navigation and saves progress. |
| `app/components/QuestionCard.tsx` | Displays the question and calls the page when an answer is clicked. |
| `app/components/QuizResults.tsx` | Displays the final score and optional answer or mistake review. |
| `app/quizSession.ts` | Defines saved sessions, records answers, counts correct answers and validates restored data. |
| `app/hooks/usePreloadImages.ts` | Loads the current image and preloads the next two image questions. |
| `app/questions.json` | Stores the question text, answer options, correct answers and image paths. |
| `app/globals.css` | Controls colours, spacing, layouts and responsive styles. |
| `index.html` | Provides the HTML page, title, description and browser-tab icon. |
| `src/main.tsx` | Starts React and displays the main page. |
| `public/question-images/` | Contains the road diagrams. |
| `public/favicon.svg` | Browser-tab icon. |
| `vite.config.ts` | Configures the development server, base path and build plugins. |
| `.github/workflows/deploy.yml` | Builds and deploys the app to GitHub Pages. |

## Understanding the quiz code

The main page stores a `session` object:

| Field | Meaning |
| --- | --- |
| `phase` | Menu, quiz or results. |
| `kind` | Set, random or ultimate mode. |
| `setNumber` | The selected set number, if applicable. |
| `questionIds` | The questions included in this quiz, in display order. |
| `answers` | Each answered question's ID and the selected option's index. |

`selectOption()` calls `recordAnswer()`, which saves the choice. The number of saved answers identifies the next question. The final answer switches the session to results; `finishQuiz()` allows Ultimate 400 to finish early.

`QuestionCard` receives the current question and click function through **props**. `QuizResults` receives the saved answers and calculates the score with `countCorrectAnswers()`. Its review button reveals the selected and correct answers.

Saved sessions use format v3. Older v2 sessions did not retain answer history, so the menu asks users with older unfinished quizzes to start again. The old browser entry is left untouched.

The preloading hook follows the active question order and remains in its own file.

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

Edit questions directly in `app/questions.json`. Store any new diagrams in `public/question-images/` and use their paths in the question data.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the exact dependencies recorded in the lockfile. |
| `npm run dev` | Start the development server. |
| `npm run build` | Check TypeScript and create the production site in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run check` | Check TypeScript for errors without building. |
| `npm test` | Check quiz completion, scoring, early finishing and saved-answer validation. |

After quiz changes, manually check correct and incorrect answers, automatic advancement, results, answer review, retry, exit confirmation and saved progress in all three modes. Check image preloading too.

## Deployment and current tooling

Pushing to `main` triggers the GitHub Pages workflow. It installs dependencies, runs `npm run build`, and deploys `dist`. Changes appear on the live site after the workflow finishes successfully.

The interface uses **React and TypeScript**, with plain CSS for styling and **Vite** for development and production builds. The quiz runs entirely in the browser; no server or database is required.

Keep functions small, use descriptive names and add comments where the purpose is not obvious. The main page connects the menu, questions and results. Session helpers, question display, results display and preloading have their own files.
