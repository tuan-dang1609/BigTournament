import daisyui from "daisyui";
import scrollbar from "tailwind-scrollbar";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      height: {
        '12.5': '50px', // Corrected key name
      },
      width: {
        '6.5/10': '65%', // Valid fraction naming
        '3.5/10': '35%',
        '12.5': '50px', // Ensure naming consistency with height
      },
      fontSize: {
        sm: '0.8rem',
        base: '1rem',
        xl: '1.25rem',
        a: '17px', // Keeping key as 'a' but make sure it's used correctly
      },
    },
  },
  plugins: [
    daisyui,
    scrollbar({ nocompatible: true }), // Properly loading scrollbar with option
  ],
  daisyui: {
    themes: [
      "light",
      "dark",
      "emerald",

      "retro",
      "cyberpunk",
      "valentine",
      "forest",
      "autumn",
      "night",
    ],
  },
};
