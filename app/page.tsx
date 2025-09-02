"use client";

import Image from "next/image";
import App from "./components/App";
import { XIcon } from "./components/icons/XIcon";
import { LinkedInIcon } from "./components/icons/LinkedInIcon";
import { FacebookIcon } from "./components/icons/FacebookIcon";
import { DaydreamContextProvider } from "./context/DaydreamContextProvider";

const Home = () => {
  return (
    <DaydreamContextProvider>
      <div className="h-full overflow-hidden">
        {/* height 4rem */}
        <div className="bg-gradient-to-b from-black/50 to-black/10 backdrop-blur-[2px] h-[4rem] flex items-center">
          <header className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 flex items-center justify-between">
            <div>
              <a className="flex items-center" href="/">
                <Image
                  className="w-auto h-16 max-w-[24rem] sm:max-w-none"
                  src="/daydream-logo.svg"
                  alt="Powered by Daydream"
                  width={0}
                  height={0}
                  priority
                />
              </a>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="gradient-shadow bg-gradient-to-r to-[#13EF93]/50 from-[#149AFB]/80 rounded">
                <button
                  onClick={() => {
                    // This will be handled by the App component
                    const event = new CustomEvent('openSettings');
                    window.dispatchEvent(event);
                  }}
                  className="hidden text-xs md:inline-block bg-black text-white rounded m-px px-8 py-2 font-semibold hover:bg-gray-800 transition-colors"
                >
                  Settings
                </button>
              </span>
            </div>
          </header>
        </div>

        {/* height 100% minus 8rem */}
        <main className="mx-auto px-4 md:px-6 lg:px-8 h-[calc(100%-4rem)] -mb-[4rem]">
          <App />
        </main>

        {/* height 4rem */}
        <div className="bg-black/80 h-[4rem] flex items-center absolute w-full">
          <footer className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 flex items-center justify-center gap-4 md:text-xl font-inter text-[#8a8a8e]">
          
          </footer>
        </div>
      </div>
    </DaydreamContextProvider>
  );
};

export default Home;
