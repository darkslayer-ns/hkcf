export default {
  content: [
    './src/client/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'cfhk-red': '#FF0000',
        'cfhk-dark': '#000000',
      },
      keyframes: {
        chevron: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        chevron: 'chevron 1s infinite',
      },
    },
  },
  plugins: [],
};
