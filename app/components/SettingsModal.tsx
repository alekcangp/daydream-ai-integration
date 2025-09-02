"use client";

import { useState } from "react";
import { useDaydream } from "../context/DaydreamContextProvider";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { streamParams, setStreamParams, updateStreamParams, isLoading } = useDaydream();
  const [localParams, setLocalParams] = useState(streamParams);

  const handleSave = async () => {
    setStreamParams(localParams);
    await updateStreamParams(localParams);
    onClose();
  };

  const updateParam = (key: string, value: any) => {
    setLocalParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const updateControlNet = (index: number, key: string, value: any) => {
    setLocalParams(prev => ({
      ...prev,
      controlnets: prev.controlnets.map((cn, i) =>
        i === index ? { ...cn, [key]: value } : cn
      )
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Stream Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Dynamic Parameters */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">AI Parameters</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Prompt
              </label>
              <p className="text-xs text-gray-400 mb-2">Guides the model in terms of what kind of output image to create</p>
              <input
                type="text"
                value={localParams.prompt}
                onChange={(e) => updateParam("prompt", e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="Enter your prompt..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Negative Prompt
              </label>
              <p className="text-xs text-gray-400 mb-2">Tells the model what *not* to produce. Discourages low quality, 2D, flat, or blurry results.</p>
              <input
                type="text"
                value={localParams.negative_prompt}
                onChange={(e) => updateParam("negative_prompt", e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="Enter negative prompt..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="flex flex-col h-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Inference Steps
                </label>
                <p className="text-xs text-gray-400 mb-2 flex-grow">High values give better quality at expense of speed/FPS</p>
                <input
                  type="number"
                  value={localParams.num_inference_steps}
                  onChange={(e) => updateParam("num_inference_steps", parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  min="1"
                  max="100"
                />
              </div>

              <div className="flex flex-col h-full">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Seed
                </label>
                <p className="text-xs text-gray-400 mb-2 flex-grow">Ensures reproducibility. Vary to randomize output</p>
                <input
                  type="number"
                  value={localParams.seed}
                  onChange={(e) => updateParam("seed", parseInt(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                  min="0"
                  max="999999"
                />
              </div>
            </div>
          </div>

          {/* Control Nets */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Control Nets</h3>
            <p className="text-sm text-gray-400">Adjust conditioning scale to control AI guidance strength</p>

            {localParams.controlnets.map((controlnet, index) => {
              const modelName = controlnet.model_id.split('/').pop()?.replace('-diffusers', '');
              let description = '';

              switch (modelName) {
                case 'controlnet-sd21-openpose-diffusers':
                  description = 'Body and hand pose tracking - detects human poses and maintains them in the generated image';
                  break;
                case 'controlnet-sd21-hed-diffusers':
                  description = 'Soft edge detection - preserves smooth edges and contours from the input image';
                  break;
                case 'controlnet-sd21-canny-diffusers':
                  description = 'Sharp edge preservation - maintains crisp edges and detailed outlines';
                  break;
                case 'controlnet-sd21-depth-diffusers':
                  description = 'Object and face structure - preserves spatial depth and 3D structure';
                  break;
                case 'controlnet-sd21-color-diffusers':
                  description = 'Color composition passthrough - maintains the color palette and composition';
                  break;
                default:
                  description = 'AI control mechanism for guiding image generation';
              }

              return (
                <div key={index} className="bg-gray-800 p-4 rounded">
                  <h4 className="text-sm font-medium text-gray-300 mb-1">
                    {modelName?.replace('controlnet-sd21-', '').replace('-diffusers', '').toUpperCase()}
                  </h4>
                  <p className="text-xs text-gray-400 mb-3">{description}</p>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      Conditioning Scale (0-1)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Higher values = stronger control, Lower values = more creative freedom</p>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={controlnet.conditioning_scale}
                      onChange={(e) => updateControlNet(index, "conditioning_scale", parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>0</span>
                      <span className="text-white font-medium">{controlnet.conditioning_scale.toFixed(2)}</span>
                      <span>1</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;