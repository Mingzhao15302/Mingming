import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.08)',
          medium: 'rgba(255, 255, 255, 0.14)',
          strong: 'rgba(255, 255, 255, 0.22)',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glow: '0 0 40px rgba(56, 189, 248, 0.45)',
      },
      borderRadius: {
        xl: '20px',
      },
    },
  },
  plugins: [],
};

export default config;
