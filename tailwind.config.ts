import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export default <Config>{
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      animation: {
        scroll:
          "scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
        aurora: "aurora 60s linear infinite",
      },
      keyframes: {
        scroll: {
          to: {
            transform: "translate(calc(-50% - 0.5rem))",
          },
        },
        aurora: {
          from: {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          to: {
            backgroundPosition: "350% 50%, 350% 50%",
          },
        },
      },
    },
  },
  plugins: [
    plugin(({ addBase, theme }) => {
      const colors = theme("colors") as Record<string, string | Record<string, string>>;
      const flattenedColors: Record<string, string> = {};

      const flattenColors = (colorObj: Record<string, string | Record<string, string>>, prefix = "") => {
        for (const [key, value] of Object.entries(colorObj)) {
          if (typeof value === "string") {
            flattenedColors[`--${prefix}${key}`] = value;
          } else {
            flattenColors(value, `${prefix}${key}-`);
          }
        }
      };

      flattenColors(colors);

      addBase({
        ":root": flattenedColors,
      });
    }),
  ],
};
