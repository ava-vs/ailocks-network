/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx,astro}'],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    function({ addUtilities }) {
      addUtilities({
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
        },
        '.scrollbar-thumb-gray-600': {
          '&::-webkit-scrollbar-thumb': {
            'background-color': '#4b5563',
            'border-radius': '6px',
          },
        },
        '.scrollbar-track-gray-800': {
          '&::-webkit-scrollbar-track': {
            'background-color': '#1f2937',
          },
        },
        '.scrollbar-thin::-webkit-scrollbar': {
          width: '6px',
        },
      });
    }
  ],
};
