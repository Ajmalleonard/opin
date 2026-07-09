import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, Urbanist } from "next/font/google";
import { ControlUiProvider } from "../components/control-ui/control-ui-provider";
import { GlobalShell } from "../components/control-ui/global-shell";
import "./globals.css";

const urbanist = Urbanist({
  subsets: ["latin"],
  variable: "--font-urbanist",
  weight: ["300", "400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Opin Control",
  description: "Next.js control UI for the Opin gateway and local engine.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${urbanist.variable} ${ibmPlexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const settingsStr = localStorage.getItem("opin-settings");
                const theme = settingsStr ? JSON.parse(settingsStr).theme : "system";
                const resolved = theme === "system"
                  ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
                  : theme;
                if (resolved === "dark") {
                  document.documentElement.classList.add("dark");
                  document.documentElement.setAttribute("data-theme", "dark");
                } else {
                  document.documentElement.classList.add("light");
                  document.documentElement.setAttribute("data-theme", "light");
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body style={{ fontFamily: "var(--font-urbanist)" }} className="antialiased">
        <ControlUiProvider>
          <GlobalShell>{children}</GlobalShell>
        </ControlUiProvider>
      </body>
    </html>
  );
}
