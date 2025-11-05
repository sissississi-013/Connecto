/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Inter',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0a1929',
        },
        accent: '#3B82F6',
        'accent-strong': '#2563EB',
        graphite: '#1B2A44',
        'graphite-soft': '#112240',
      },
      boxShadow: {
        'navy-glow': '0 20px 60px -25px rgba(15, 118, 255, 0.45)',
        'subtle-ring': '0 0 0 1px rgba(148, 163, 184, 0.08)',
      },
      backgroundImage: {
        'navy-gradient': 'radial-gradient(circle at top left, rgba(59, 130, 246, 0.25), transparent 55%), radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.18), transparent 60%)',
      },
      keyframes: {
        'sphere-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.35)',
          },
          '50%': {
            transform: 'scale(1.06)',
            boxShadow: '0 0 0 18px rgba(59, 130, 246, 0)',
          },
        },
        'sphere-ring': {
          '0%': {
            transform: 'scale(0.95)',
            opacity: '0.6',
          },
          '100%': {
            transform: 'scale(1.8)',
            opacity: '0',
          },
        },
      },
      animation: {
        'sphere-pulse': 'sphere-pulse 2.4s ease-in-out infinite',
        'sphere-ring': 'sphere-ring 2.6s ease-out infinite',
      },
    },
  },
}
