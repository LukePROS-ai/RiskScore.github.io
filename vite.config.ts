import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  // Relative assets work both at a user/organization Pages root and at /repository-name/.
  base: "./",
});
