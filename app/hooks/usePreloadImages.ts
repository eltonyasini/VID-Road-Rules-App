"use client";

import { useEffect } from "react";
import type { Question } from "../components/QuestionCard";

// Start downloading an image without displaying it on the page.
function preloadImage(imagePath: string) {
  const image = new Image();

  // Use exactly the same URL as QuestionCard so the browser can reuse it.
  image.src = import.meta.env.BASE_URL + imagePath.replace(/^\/+/, "");
}

// A custom hook groups React behaviour in a separate, reusable function.
export default function usePreloadImages(
  questions: Question[],
  currentIndex: number,
  quizIsActive: boolean,
) {
  useEffect(() => {
    if (!quizIsActive) {
      return;
    }

    const currentQuestion = questions[currentIndex];

    if (!currentQuestion) {
      return;
    }

    // Load the current image first. Never make the quiz wait for preloading.
    if (currentQuestion.image) {
      preloadImage(currentQuestion.image);
    }

    // Follow this quiz's order, including the shuffled order in Random 25.
    // Skip text-only questions and stop after finding two future images.
    let imagesPreloaded = 0;

    for (let index = currentIndex + 1; index < questions.length; index += 1) {
      const nextQuestion = questions[index];

      if (nextQuestion.image) {
        preloadImage(nextQuestion.image);
        imagesPreloaded = imagesPreloaded + 1;
      }

      if (imagesPreloaded === 2) {
        break;
      }
    }

    // Failed preloads do not block navigation. The displayed image can retry.
  }, [questions, currentIndex, quizIsActive]);
}
