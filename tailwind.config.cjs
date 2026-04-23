/**
 * Tailwind v4：通过 @config 加载 legacy 配置，确保 @tailwindcss/typography
 * 在 Next.js + @tailwindcss/postcss 下稳定注册（仅 CSS 里 @plugin 在部分环境不可靠）。
 *
 * @see https://tailwindcss.com/docs/functions-and-directives#config-directive
 */
/* eslint-disable @typescript-eslint/no-require-imports */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  plugins: [require("@tailwindcss/typography")],
};
