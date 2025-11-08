import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './web/index.html',
    './web/src/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(255, 255, 255, 0.2)'
      },
      backdropBlur: {
        xs: '2px'
      },
      boxShadow: {
        glow: '0 0 25px rgba(79, 209, 197, 0.45)'
      }
    }
  },
  plugins: []
}

export default config
