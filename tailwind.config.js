/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: '#F8F4EC',
        paper:     '#FFFFFF',
        ink:       '#14192B',
        ink2:      '#2B3149',
        stone:     '#6E6A62',
        stone2:    '#9C978D',
        line:      '#E7E1D4',
        line2:     '#EFEADD',
        brass:     '#A87E4A',
        brassLite: '#C9A97A',
        sage:      '#6F8067',
        sageLite:  '#DDE3D6',
        clay:      '#B34A3B',
        clayLite:  '#F1D9D3',
        indigo:    '#3A4B8C',
        indigoLite:'#DDE1EE',
      },
      fontFamily: {
        sans:  ['Tajawal','system-ui','sans-serif'],
        serif: ['Amiri','serif'],
      },
      borderRadius: {
        chip: '6px',
        card: '14px',
        hero: '22px',
      },
      boxShadow: {
        card: '0 1px 0 rgba(20,25,43,0.02), 0 1px 2px rgba(20,25,43,0.04)',
        pop:  '0 8px 30px rgba(20,25,43,0.09), 0 2px 6px rgba(20,25,43,0.06)',
      },
    },
  },
  plugins: [],
};
