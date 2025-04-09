import daisyui from "daisyui";
import scrollbar from "tailwind-scrollbar";
import typography from '@tailwindcss/typography'
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        progress: 'progressBar 1.5s linear forwards',
      },
      keyframes: {
        progressBar: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
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
    typography
  ],
  daisyui: {
    themes: [

      "forest",


    ],
  },
};
