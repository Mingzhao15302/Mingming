const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: false,
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.6)',
          dark: 'rgba(15, 23, 42, 0.4)'
        }
      },
      backdropBlur: {
        glass: '18px'
      },
      fontFamily: {
        sans: ['"Segoe UI"', ...defaultTheme.fontFamily.sans]
      },
      boxShadow: {
        glow: '0 10px 30px rgba(59, 130, 246, 0.35)'
      }
    }
  },
  plugins: []
};
