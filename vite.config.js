import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    plugins: [react()],

    build: {
        outDir: "static/dist",
        emptyOutDir: true,
    },

    server: {
        proxy: {
            "/start": "http://127.0.0.1:8000",
            "/search": "http://127.0.0.1:8000",
            "/guess": "http://127.0.0.1:8000",
            "/saved-guesses": "http://127.0.0.1:8000",
            "/completed-puzzles": "http://127.0.0.1:8000",
            "/attach-session": "http://127.0.0.1:8000",
        },
    },
});