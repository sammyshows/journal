/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef7f0',
          100: '#fde9d3',
          200: '#fad2a5',
          300: '#f6b46d',
          400: '#f19833',
          500: '#ec8320',
          600: '#d66815',
          700: '#b85114',
          800: '#954118',
          900: '#7a3716',
        },
        soft: {
          50: '#fdf9f7',
          100: '#f9f1ec',
          200: '#f2e2d9',
          300: '#e8cec0',
          400: '#dbb5a0',
          500: '#cc9980',
          600: '#ba8469',
          700: '#9c6c56',
          800: '#80594a',
          900: '#694a3f',
        }
      },
      fontFamily: {
        'space-mono': ['SpaceMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}