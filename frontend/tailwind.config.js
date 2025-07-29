import PrimeUI from 'tailwindcss-primeui';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    darkMode: ['selector', '[class~="my-app-dark"]'],
    theme: {
        extend: {},
    },
    plugins: [PrimeUI],
}