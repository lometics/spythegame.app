/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Single typeface — shadcn ships with Inter. `display` kept as an
        // alias so existing `font-display` classes still resolve.
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // True zinc (hue 0%) — shadcn neutral dark theme.
        ink: {
          900: '#0a0a0a', // background (zinc-950-ish)
          800: '#171717', // card (zinc-900)
          700: '#262626', // muted surface (zinc-800)
          600: '#404040', // hover surface (zinc-700)
        },
        // Amber retained as a secondary accent for selected pills / chips.
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
      borderRadius: {
        // shadcn default scale: --radius 0.5rem; lg = radius, md = radius - 2px.
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        // Lower, flatter shadow than before — shadcn cards lean on borders, not glow.
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.5), 0 8px 24px -12px rgb(0 0 0 / 0.6)',
      },
    },
  },
  plugins: [],
}
