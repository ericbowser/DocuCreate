/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Source Sans 3"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        doc: ['"Libre Baskerville"', 'Georgia', 'Times New Roman', 'serif'],
        blog: ['"Literata"', 'Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      fontSize: {
        'blog-body': ['1.125rem', { lineHeight: '1.8', letterSpacing: '0.01em' }],
        'blog-body-lg': ['1.1875rem', { lineHeight: '1.8', letterSpacing: '0.01em' }],
      },
      colors: {
        ember: {
          50:  '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc7c7',
          300: '#ff9a9a',
          400: '#ff6060',
          500: '#ff2d2d',
          600: '#ed1515',
          700: '#c80d0d',
          800: '#a50e0e',
          900: '#891414',
          950: '#4b0404',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f1f5f9',
          dark: '#1c1418',
          elevated: '#261c20',
          input: '#2a2024',
        },
        ink: {
          DEFAULT: '#0f172a',
          secondary: '#334155',
          muted: '#64748b',
          subtle: '#94a3b8',
        },
        line: {
          DEFAULT: '#e2e8f0',
          dark: '#3d1c1c',
        },
        accent: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
          muted: '#dbeafe',
          'muted-dark': '#0d0e1f',
        },
      },
      backgroundImage: {
        'ember-night': `
          radial-gradient(ellipse at 15% 0%, #350c0c 0%, #1f0606 22%, transparent 60%),
          radial-gradient(ellipse at 85% 100%, #1a0404 0%, transparent 50%),
          linear-gradient(160deg, #1f0707 0%, #0d0404 35%, #060404 65%, #010101 100%)
        `,
      },
    },
  },
  plugins: [],
}
