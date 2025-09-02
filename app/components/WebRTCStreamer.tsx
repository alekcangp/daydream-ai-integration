"use client";

import { useEffect, useRef } from "react";
import { useDaydream } from "../context/DaydreamContextProvider";

interface WebRTCStreamerProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  isMicRecording?: boolean;
}

const WebRTCStreamer: React.FC<WebRTCStreamerProps> = ({ canvasRef, isMicRecording }) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const { stream } = useDaydream();

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const whipUrl = stream.whip_url || stream.whipUrl;

    const startStreaming = async () => {
      try {
        // Create MediaStream from canvas
        const stream = canvas.captureStream(30); // 30 FPS

        // Create RTCPeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });

        peerConnectionRef.current = pc;

        // Add canvas stream to peer connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Create offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send offer to WHIP endpoint
        const response = await fetch(whipUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/sdp",
          },
          body: offer.sdp,
        });

        if (!response.ok) {
          throw new Error(`WHIP request failed: ${response.status}`);
        }

        const answerSdp = await response.text();

        // Set remote description
        await pc.setRemoteDescription({
          type: "answer",
          sdp: answerSdp,
        });

        console.log("WebRTC streaming started successfully");

      } catch (error) {
        console.error("Error starting WebRTC stream:", error);
      }
    };

    startStreaming();

    return () => {
      // Cleanup
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    };
  }, [stream, canvasRef]);

  return null; // This component doesn't render anything
};

export default WebRTCStreamer;