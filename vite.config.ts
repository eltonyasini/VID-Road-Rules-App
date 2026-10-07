import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this project inside its repository folder.
  base: "/VID-Road-Rules-App/",
});
