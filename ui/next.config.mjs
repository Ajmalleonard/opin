import { createMDX } from "fumadocs-mdx/next";
import { dirname } from "node:path";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const config = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  turbopack: {
    root: join(__dirname, ".."),
  },
  images: {
    unoptimized: true,
  },
};

const withMDX = createMDX({
  configPath: "./source.config.ts",
});

export default withMDX(config);
