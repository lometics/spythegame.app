/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          900: '#0b1020',
          800: '#11172e',
          700: '#1a2142',
          600: '#252e5a',
        },
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
      boxShadow: {
        soft: '0 10px 40px -10px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
