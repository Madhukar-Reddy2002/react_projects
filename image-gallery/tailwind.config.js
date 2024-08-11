/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        neumorphism: '10px 10px 15px #c5c5c5, -10px -10px 15px #ffffff',
      },
    },
  }
  ,
  plugins: [],
}
