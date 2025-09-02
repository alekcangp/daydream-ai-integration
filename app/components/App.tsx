"use client";

import { useEffect, useRef, useState } from "react";
import {
  LiveConnectionState,
  LiveTranscriptionEvent,
  LiveTranscriptionEvents,
  useDeepgram,
} from "@/app/context/DeepgramContextProvider";
import {
  MicrophoneEvents,
  MicrophoneState,
  useMicrophone,
} from "@/app/context/MicrophoneContextProvider";
import { useDaydream } from "@/app/context/DaydreamContextProvider";
import Visualizer from "./Visualizer";
import { MicrophoneIcon } from "./icons/MicrophoneIcon";
import CanvaArea from "./CanvaArea";
import VideoOutput from "./VideoOutput";
import WebRTCStreamer from "./WebRTCStreamer";
import SettingsModal from "./SettingsModal";

const App: () => JSX.Element = () => {
  const [caption, setCaption] = useState<string | undefined>(
    "Powered by Deepgram"
  );
  const [showSettings, setShowSettings] = useState(false);
  const { connection, connectToDeepgram, connectionState } = useDeepgram();
  const { setupMicrophone, microphone, startMicrophone, stopMicrophone, microphoneState } =
    useMicrophone();
  const { createStream, stream, updateStreamParams, streamParams } = useDaydream();

  // Update ref when stream changes
  useEffect(() => {
    currentStreamRef.current = stream;
  }, [stream]);
  const captionTimeout = useRef<any>();
  const keepAliveInterval = useRef<any>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastProcessedTranscript = useRef<string>("");
  const lastEmptyLogTime = useRef<number>(0);
  const currentStreamRef = useRef<any>(null);

  const handleMicToggle = async () => {
    if (microphoneState === MicrophoneState.Open) {
      stopMicrophone();
    } else {
      // Start microphone
      startMicrophone();

      // Create Daydream stream if not exists
      if (!stream) {
        await createStream();
      }
    }
  };

  useEffect(() => {
    setupMicrophone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Auto-create Daydream stream and start streaming on page load
    const autoStartStreaming = async () => {
      if (!stream) {
        try {
          console.log("Auto-creating Daydream stream...");
          await createStream();
          console.log("Daydream stream created successfully");
        } catch (error) {
          console.error("Failed to create Daydream stream:", error);
          return;
        }
      }

      // Auto-start microphone if not already running
      if (microphoneState === MicrophoneState.Ready) {
        try {
          console.log("Auto-starting microphone...");
          await startMicrophone();
          console.log("Microphone started successfully");
        } catch (error) {
          console.error("Failed to start microphone:", error);
        }
      }
    };

    // Small delay to ensure all components are ready
    const timer = setTimeout(() => {
      autoStartStreaming();
    }, 1000);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettings(true);
    };

    window.addEventListener('openSettings', handleOpenSettings);

    return () => {
      window.removeEventListener('openSettings', handleOpenSettings);
    };
  }, []);

  useEffect(() => {
    if (microphoneState === MicrophoneState.Ready) {
      connectToDeepgram({
        model: "nova-3",
        language: "multi",
        interim_results: true,
        smart_format: true,
        filler_words: false,
        utterance_end_ms: 3000, // Better for complete sentences
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState]);

  useEffect(() => {
    if (!microphone) return;
    if (!connection) return;

    const onData = (e: BlobEvent) => {
      // iOS SAFARI FIX:
      // Prevent packetZero from being sent. If sent at size 0, the connection will close. 
      if (e.data.size > 0) {
        connection?.send(e.data);
      }
    };

    const onTranscript = async (data: LiveTranscriptionEvent) => {
      const { is_final: isFinal, speech_final: speechFinal } = data;
      let thisCaption = data.channel.alternatives[0].transcript;

      // Only process non-empty transcripts
      if (thisCaption && thisCaption.trim()) {
        const trimmedCaption = thisCaption.trim();

        // Only update if the transcript content has actually changed
        if (lastProcessedTranscript.current === trimmedCaption) {
          return;
        }

        setCaption(thisCaption);

        // Update Daydream for final transcripts (more permissive)
        const shouldUpdateDaydream = isFinal;

        console.log("🎨 [DEBUG] Processing transcript:", trimmedCaption, "isFinal:", isFinal);

        if (shouldUpdateDaydream && stream && stream.id) {
          console.log("🎨 [DEBUG] Sending transcript to Daydream:", trimmedCaption);

          const updatedParams = {
            ...streamParams,
            prompt: trimmedCaption
          };

          try {
            await updateStreamParams(updatedParams);
            lastProcessedTranscript.current = trimmedCaption;
            console.log("🎨 [DEBUG] Successfully sent to Daydream API");
          } catch (error) {
            console.error("Failed to update Daydream parameters:", error);
          }
        } else if (shouldUpdateDaydream && !stream) {
          console.log("🎨 [DEBUG] Final transcript received but no stream available - will retry in 500ms");

          // Retry after a short delay in case stream state hasn't propagated yet
          setTimeout(async () => {
            console.log("🎨 [DEBUG] Checking for stream availability after delay...");
            console.log("🎨 [DEBUG] Current stream state from ref:", currentStreamRef.current);

            if (currentStreamRef.current) {
              console.log("🎨 [DEBUG] Stream now available, retrying transcript update");

              const updatedParams = {
                ...streamParams,
                prompt: trimmedCaption
              };

              try {
                await updateStreamParams(updatedParams);
                lastProcessedTranscript.current = trimmedCaption;
                console.log("🎨 [DEBUG] Successfully sent to Daydream API on retry");
              } catch (error) {
                console.error("Failed to update Daydream parameters on retry:", error);
              }
            } else {
              console.log("🎨 [DEBUG] Stream still not available after delay");
            }
          }, 500);
        }
      }

      if (isFinal && speechFinal) {
        clearTimeout(captionTimeout.current);
        captionTimeout.current = setTimeout(() => {
          setCaption(undefined);
          clearTimeout(captionTimeout.current);
        }, 5000);
      }
    };

    if (connectionState === LiveConnectionState.OPEN) {
      connection.addListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.addEventListener(MicrophoneEvents.DataAvailable, onData);

      // Removed automatic startMicrophone() to allow manual activation
    }

    return () => {
      // prettier-ignore
      connection.removeListener(LiveTranscriptionEvents.Transcript, onTranscript);
      microphone.removeEventListener(MicrophoneEvents.DataAvailable, onData);
      clearTimeout(captionTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionState]);

  useEffect(() => {
    if (!connection) return;

    if (
      microphoneState !== MicrophoneState.Open &&
      connectionState === LiveConnectionState.OPEN
    ) {
      connection.keepAlive();

      keepAliveInterval.current = setInterval(() => {
        connection.keepAlive();
      }, 10000);
    } else {
      clearInterval(keepAliveInterval.current);
    }

    return () => {
      clearInterval(keepAliveInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [microphoneState, connectionState]);

  return (
    <>
      <div className="flex h-full antialiased">
        <div className="flex flex-row h-full w-full overflow-x-hidden">
          <div className="flex flex-col flex-auto h-full">
            {/* height 100% minus 8rem */}
            <div className="relative w-full h-full">
              {/* Canvas Area - Hidden but functional for video streaming */}
              <div className="absolute inset-0 w-full h-full invisible">
                <CanvaArea ref={canvasRef} />
              </div>

              {/* Video Output - positioned in upper center */}
              <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] z-10">
                <VideoOutput />
              </div>

              {/* WebRTC Streamer */}
              <WebRTCStreamer
                canvasRef={canvasRef}
              />

              {/* Visualizer */}
              {microphone && microphoneState === MicrophoneState.Open && <Visualizer microphone={microphone} />}

              {/* Mic Button and Caption - positioned below video output */}
              <div className="absolute top-[75%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-4xl mx-auto text-center flex flex-col items-center gap-4 z-20">
                <button
                  onClick={handleMicToggle}
                  className="bg-black/70 p-4 rounded-full hover:bg-black/80 transition-colors"
                  disabled={microphoneState === MicrophoneState.NotSetup || microphoneState === MicrophoneState.SettingUp}
                >
                  <MicrophoneIcon micOpen={microphone?.state === "recording"} className="w-8 h-8" />
                </button>
                {caption && <span className="bg-black/70 p-8">{caption}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
};

export default App;
