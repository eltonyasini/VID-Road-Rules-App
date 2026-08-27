# VID Road Rules Practice App

This ZIP contains the complete application, all 400 questions, the extracted
road diagrams, and the original `VID.pdf` for reference.

## What you need

- A Windows, macOS, or Linux computer
- Node.js 22.13 or newer from https://nodejs.org/
- An internet connection for the first installation only

## Quick launch

### Windows

1. Extract the ZIP to a normal folder such as `Documents/VID-Road-Rules-App`.
2. Double-click `START-WINDOWS.bat`.
3. The first launch installs the required packages, so it can take a few
   minutes.
4. When the terminal displays a local address, open it in your browser. It is
   normally `http://localhost:5173`.

### macOS or Linux

1. Extract the ZIP.
2. Open Terminal inside the extracted `VID-Road-Rules-App` folder.
3. Run:

   ```bash
   npm install
   npm run dev
   ```

4. Open the local address shown in Terminal, normally
   `http://localhost:5173`.

## Manual Windows launch

If the Windows launcher does not open, right-click inside the extracted folder,
choose **Open in Terminal**, then run:

```powershell
npm install
npm run dev
```

## Stop the app

Return to the terminal and press `Ctrl + C`.

## Launch it again later

The packages only need to be installed once. On later launches, use
`START-WINDOWS.bat` or run:

```bash
npm run dev
```

## Optional production test

To create and run a production build:

```bash
npm run build
npm start
```

## App content

- 16 ordered sets of 25 questions
- A fresh random 25-question challenge
- The complete Ultimate 400 questionnaire
- 144 original road diagrams from the PDF
- Correct-answer feedback, scoring, and saved local progress

The app stores progress only in the browser on the current device.

