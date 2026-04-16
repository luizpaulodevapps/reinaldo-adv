import type {Config} from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        serif: ['Outfit', 'sans-serif'],
      },
      colors: {
        background: '#0D1422',
        foreground: '#C7C7C7',
        primary: {
          DEFAULT: '#DFC88E',
          foreground: '#0D1422',
        },
        gold: {
          100: "#DFC88E",
          200: "#A37F35",
          300: "#9F762C"
        },
        secondary: {
          DEFAULT: '#111827',
          foreground: '#FFFFFF',
        },
        card: {
          DEFAULT: '#141B2D',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#111827',
          foreground: '#8A8A8A',
        },
        accent: {
          DEFAULT: '#DFC88E',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#BD4073',
          foreground: '#FFFFFF',
        },
        border: 'rgba(223,200,142,0.2)',
        input: '#111827',
        ring: '#DFC88E',
      },
      borderRadius: {
        lg: '12px',
        md: '10px',
        sm: '8px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;
