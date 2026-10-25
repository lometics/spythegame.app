/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter Variable', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Theme tokens live in index.css so CSS and Tailwind stay in sync.
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        'surface-2': 'hsl(var(--surface-2) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        spy: 'hsl(var(--spy) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
