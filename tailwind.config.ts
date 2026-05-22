import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#CC0000',
          light: '#F5F5F5',
          dark: '#A30000'
        },
        surface: '#F5F5F5',
        text: '#1A1A1A'
      }
    }
  },
  plugins: []
};

export default config;
