"use client";

import { useDaydream } from "../context/DaydreamContextProvider";

const VideoOutput: React.FC = () => {
  const { stream } = useDaydream();

  if (!stream) {
    return (
      <div className="w-full h-full bg-black/50 rounded-lg flex items-center justify-center">
        <p className="text-white/70 text-sm">No active stream</p>
      </div>
    );
  }

  const playbackId = stream.output_playback_id || stream.outputPlaybackId;
  const iframeUrl = `https://lvpr.tv/?v=${playbackId}&lowLatency=force`;

  const handleIframeLoad = () => {
    // Iframe loaded successfully - no logging needed
  };

  const handleIframeError = () => {
    console.error("Video output failed to load");
  };

  return (
    <div className="w-full h-full bg-black rounded-lg overflow-hidden">
      <iframe
        src={iframeUrl}
        className="w-full h-full border-0"
        allow="autoplay; encrypted-media"
        allowFullScreen
        title="Daydream Video Output"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
};

export default VideoOutput;