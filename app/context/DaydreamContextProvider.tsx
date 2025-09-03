"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

interface StreamData {
  id: string;
  outputPlaybackId: string;
  output_playback_id: string;
  whipUrl: string;
  whip_url: string;
}

interface StreamParams {
  model_id: string;
  prompt: string;
  prompt_interpolation_method: string;
  normalize_prompt_weights: boolean;
  normalize_seed_weights: boolean;
  negative_prompt: string;
  num_inference_steps: number;
  seed: number;
  t_index_list: number[];
  controlnets: any[];
}

interface DaydreamContextType {
  stream: StreamData | null;
  streamParams: StreamParams;
  isLoading: boolean;
  error: string | null;
  createStream: () => Promise<void>;
  updateStreamParams: (params: StreamParams) => Promise<void>;
  setStreamParams: (params: StreamParams) => void;
  stopStream: () => Promise<void>;
  clearError: () => void;
}

const DaydreamContext = createContext<DaydreamContextType | undefined>(undefined);

interface DaydreamContextProviderProps {
  children: ReactNode;
}

const PIPELINE_ID = "pip_qpUgXycjWF6YMeSL";

export const DaydreamContextProvider: React.FC<DaydreamContextProviderProps> = ({
  children,
}) => {
  const [stream, setStream] = useState<StreamData | null>(null);
  const [streamParams, setStreamParams] = useState<StreamParams>({
    model_id: "stabilityai/sd-turbo",
    prompt: "",
    prompt_interpolation_method: "slerp",
    normalize_prompt_weights: true,
    normalize_seed_weights: true,
    negative_prompt: "blurry, low quality, flat, 2d",
    num_inference_steps: 50,
    seed: 42,
    t_index_list: [0, 8, 17],
    controlnets: [
      {
        conditioning_scale: 0,
        control_guidance_end: 1,
        control_guidance_start: 0,
        enabled: true,
        model_id: "thibaud/controlnet-sd21-openpose-diffusers",
        preprocessor: "pose_tensorrt",
        preprocessor_params: {}
      },
      {
        conditioning_scale: 0,
        control_guidance_end: 1,
        control_guidance_start: 0,
        enabled: true,
        model_id: "thibaud/controlnet-sd21-hed-diffusers",
        preprocessor: "soft_edge",
        preprocessor_params: {}
      },
      {
        conditioning_scale: 0,
        control_guidance_end: 1,
        control_guidance_start: 0,
        enabled: true,
        model_id: "thibaud/controlnet-sd21-canny-diffusers",
        preprocessor: "canny",
        preprocessor_params: {
          high_threshold: 200,
          low_threshold: 100
        }
      },
      {
        conditioning_scale: 0,
        control_guidance_end: 1,
        control_guidance_start: 0,
        enabled: true,
        model_id: "thibaud/controlnet-sd21-depth-diffusers",
        preprocessor: "depth_tensorrt",
        preprocessor_params: {}
      },
      {
        conditioning_scale: 0,
        control_guidance_end: 1,
        control_guidance_start: 0,
        enabled: true,
        model_id: "thibaud/controlnet-sd21-color-diffusers",
        preprocessor: "passthrough",
        preprocessor_params: {}
      }
    ]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createStream = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("https://api.daydream.live/v1/streams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_DAYDREAM_API_KEY}`,
        },
        body: JSON.stringify({
          pipeline_id: PIPELINE_ID,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create stream: ${response.statusText}`);
      }

      const data = await response.json();

      const streamData = {
        id: data.id,
        outputPlaybackId: data.output_playback_id,
        output_playback_id: data.output_playback_id,
        whipUrl: data.whip_url,
        whip_url: data.whip_url,
      };

      setStream(streamData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateStreamParams = useCallback(async (params: StreamParams) => {
    // Get current stream value instead of captured value
    setStream(currentStream => {
      if (!currentStream) {
        return currentStream;
      }

      setIsLoading(true);
      setError(null);

      fetch(
        `https://api.daydream.live/beta/streams/${currentStream.id}/prompts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_DAYDREAM_API_KEY}`,
          },
          body: JSON.stringify({ params }),
        }
      )
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to update stream params: ${response.statusText}`);
          }
        })
        .catch(err => {
          console.error("Failed to update stream params:", err);
          setError(err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });

      return currentStream;
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const stopStream = useCallback(async () => {
    if (!stream) return;

    setIsLoading(true);
    setError(null);

    try {
      // Note: The API doesn't have a direct stop endpoint, but we can reset the stream
      setStream(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [stream]);

  return (
    <DaydreamContext.Provider
      value={{
        stream,
        streamParams,
        isLoading,
        error,
        createStream,
        updateStreamParams,
        setStreamParams,
        stopStream,
        clearError,
      }}
    >
      {children}
    </DaydreamContext.Provider>
  );
};

export const useDaydream = (): DaydreamContextType => {
  const context = useContext(DaydreamContext);
  if (context === undefined) {
    throw new Error("useDaydream must be used within a DaydreamContextProvider");
  }
  return context;
};