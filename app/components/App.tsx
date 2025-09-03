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
  const transcriptQueue = useRef<string[]>([]);
  const lastSentPrompt = useRef<string>("");
  const promptTimeout = useRef<NodeJS.Timeout | null>(null);

  // Function to build accumulated prompt from transcripts
  const buildAccumulatedPrompt = () => {
    // Include settings prompt if available
    const settingsPrompt = streamParams.prompt && typeof streamParams.prompt === 'string' && streamParams.prompt.trim()
      ? streamParams.prompt
      : "";

    // Combine settings prompt with accumulated transcripts
    const transcriptsText = transcriptQueue.current.join(" ");
    const fullPrompt = settingsPrompt
      ? `${settingsPrompt} ${transcriptsText}`.trim()
      : transcriptsText;

    return fullPrompt;
  };

  // Function to send prompt to Daydream
  const sendPromptToDaydream = async (prompt: string) => {
    if (prompt === lastSentPrompt.current) {
      return; // Don't send duplicate prompts
    }

    lastSentPrompt.current = prompt;

    const updatedParams = {
      ...streamParams,
      prompt: prompt
    };

    try {
      await updateStreamParams(updatedParams);
      console.log("🎨 [DEBUG] Sent accumulated prompt to Daydream:", prompt);
    } catch (error) {
      console.error("Failed to update Daydream parameters:", error);
    }
  };

  // Function to check if we should send the prompt
  const checkAndSendPrompt = () => {
    const currentPrompt = buildAccumulatedPrompt();

    // Send if we have more than 3 transcripts OR if there's a timeout
    if (transcriptQueue.current.length > 3 || promptTimeout.current) {
      if (currentPrompt.trim()) {
        sendPromptToDaydream(currentPrompt);
      }

      // Clear timeout after sending
      if (promptTimeout.current) {
        clearTimeout(promptTimeout.current);
        promptTimeout.current = null;
      }
      // Don't reset queue - keep accumulating
    }
  };

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
          
          await createStream();
          
        } catch (error) {
          console.error("Failed to create Daydream stream:", error);
          return;
        }
      }

      // Auto-start microphone if not already running
      if (microphoneState === MicrophoneState.Ready) {
        try {
          
          await startMicrophone();
          
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

        

        if (shouldUpdateDaydream && stream && stream.id) {
          

          // Fixed sliding window of 3 transcripts: always remove from beginning, add to end
          if (transcriptQueue.current.length >= 3) {
            // Remove oldest transcript from beginning using slice
            transcriptQueue.current = transcriptQueue.current.slice(1);
          }

          // Add new transcript to end
          transcriptQueue.current.push(trimmedCaption);

          // Set timeout for 1 second if not already set
          if (!promptTimeout.current) {
            promptTimeout.current = setTimeout(() => {
              checkAndSendPrompt();
            }, 1000);
          }

          // Check if we should send the prompt immediately
          checkAndSendPrompt();

          lastProcessedTranscript.current = trimmedCaption;
        } else if (shouldUpdateDaydream && !stream) {
          

          // Retry after a short delay in case stream state hasn't propagated yet
          setTimeout(async () => {
            
            

            if (currentStreamRef.current) {
              

              // Fixed sliding window of 3 transcripts: always remove from beginning, add to end
              if (transcriptQueue.current.length >= 3) {
                // Remove oldest transcript from beginning using slice
                transcriptQueue.current = transcriptQueue.current.slice(1);
              }

              // Add new transcript to end
              transcriptQueue.current.push(trimmedCaption);

              // Set timeout for 1 second if not already set
              if (!promptTimeout.current) {
                promptTimeout.current = setTimeout(() => {
                  checkAndSendPrompt();
                }, 1000);
              }

              // Check if we should send the prompt immediately
              checkAndSendPrompt();

              lastProcessedTranscript.current = trimmedCaption;
            } else {
              
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
  }, [connectionState, streamParams]);

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

              {/* Video Output - centered vertically */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] z-10" style={{marginTop: '-8rem'}}>
                <VideoOutput />
              </div>

              {/* WebRTC Streamer */}
              <WebRTCStreamer
                canvasRef={canvasRef}
              />

              {/* Visualizer */}
              {microphone && microphoneState === MicrophoneState.Open && <Visualizer microphone={microphone} />}

              {/* Mic Button and Caption - positioned below video output */}
              <div className="absolute top-[calc(50%+9rem)] left-1/2 transform -translate-x-1/2 max-w-4xl mx-auto text-center flex flex-col items-center gap-4 z-20">
                <button
                  onClick={handleMicToggle}
                  className="bg-black/70 p-4 rounded-full hover:bg-black/80 transition-colors"
                  disabled={microphoneState === MicrophoneState.NotSetup || microphoneState === MicrophoneState.SettingUp}
                >
                  <MicrophoneIcon micOpen={microphone?.state === "recording"} className="w-8 h-8" />
                </button>
                {caption && <span className="bg-black/70 p-4 rounded-lg">{caption}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Overlay */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-black/80 backdrop-blur-sm z-30 flex items-center justify-center">
        <p className="text-white/60 text-sm"></p>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
};

export default App;
