import { Inter } from "next/font/google";
import classNames from "classnames";
import localFont from "next/font/local";

import { DeepgramContextProvider } from "./context/DeepgramContextProvider";
import { MicrophoneContextProvider } from "./context/MicrophoneContextProvider";
import { DaydreamContextProvider } from "./context/DaydreamContextProvider";

import "./globals.css";

import type { Metadata, Viewport } from "next";

const inter = Inter({ subsets: ["latin"] });
const favorit = localFont({
  src: "./fonts/ABCFavorit-Bold.woff2",
  variable: "--font-favorit",
});

export const viewport: Viewport = {
  themeColor: "#000000",
  initialScale: 1,
  width: "device-width",
  // maximumScale: 1, hitting accessability
};

export const metadata: Metadata = {
  metadataBase: new URL("https://daydream-ai-integration.vercel.app"),
  title: "Storytelling",
  description: `Storytelling application combines speech recognition with AI video generation, allowing users to speak naturally and watch their words transform into dynamic video content powered by the Daydream API.`,
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-dvh">
      <body
        className={`h-full dark ${classNames(
          favorit.variable,
          inter.className
        )}`}
      >
        <MicrophoneContextProvider>
          <DeepgramContextProvider>
            <DaydreamContextProvider>{children}</DaydreamContextProvider>
          </DeepgramContextProvider>
        </MicrophoneContextProvider>
      </body>
    </html>
  );
}
