import type { Config } from "tailwindcss";
import sharedConfig from "@repo/tailwind-config/tailwind.config";

const config: Pick<Config, "content" | "presets"> = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [sharedConfig as Config],
};

export default config;
