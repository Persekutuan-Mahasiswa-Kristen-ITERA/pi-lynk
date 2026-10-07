import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brown: {
          50: '#FDF8F3',
          100: '#F5E6D3',
          200: '#E8CBA7',
          300: '#D4A574',
          400: '#C08552',
          500: '#A0633B',
          600: '#8B4513',
          700: '#723A10',
          800: '#5C2E0D',
          900: '#3D1F09',
          950: '#2A1506',
        },
        cream: '#FFFBF5',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
