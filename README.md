# 🎨 Daydream AI Video Generation Integration

[![Next.js](https://img.shields.io/badge/Next.js-14.0+-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-38B2AC)](https://tailwindcss.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Supported-green)](https://webrtc.org/)

**Transform your speech into AI-generated video in real-time!** 🎬✨

This innovative application combines speech recognition with AI video generation, allowing users to speak naturally and watch their words transform into dynamic video content powered by the Daydream API.

## 🌟 Features

### 🎤 Real-Time Speech-to-Video
- **Live transcription** using Deepgram's advanced speech recognition
- **Instant AI processing** - your speech immediately updates video generation
- **Seamless integration** between audio input and visual output

### 🎨 Dynamic Visual Experience
- **Animated canvas** with auto-changing gradient backgrounds
- **WebRTC streaming** from canvas to AI pipeline
- **Live video output** via Livepeer iframe integration
- **Responsive design** that works on all devices

### ⚙️ Advanced Controls
- **Comprehensive settings modal** with parameter controls
- **Real-time parameter adjustment** for AI generation
- **Multiple control nets** (Pose, Edge Detection, Depth, Color Preservation)


## 🎯 How It Works

1. **🎤 Speak Naturally** - The app captures your voice in real-time
2. **📝 Live Transcription** - Deepgram converts speech to text instantly
3. **🎨 AI Processing** - Daydream transforms your words into video parameters
4. **🎬 Visual Output** - Watch your speech become dynamic AI-generated video
5. **⚙️ Fine-tune** - Adjust parameters in real-time for different effects

## 🛠️ Technology Stack

- **Frontend:** Next.js 14, React, TypeScript
- **Styling:** Tailwind CSS
- **Real-time Communication:** WebRTC
- **AI Integration:** Daydream API, Deepgram API
- **Video Streaming:** Livepeer
- **State Management:** React Context

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Daydream API key (from Discord)
- Deepgram API key (optional, for speech recognition)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/alekcangp/daydream-ai-integration.git
cd daydream-ai-integration
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
Create a `.env.local` file:
```bash
# Required: Daydream API key
NEXT_PUBLIC_DAYDREAM_API_KEY=your_daydream_api_key_here

# Optional: Deepgram API key for speech recognition
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 Usage

### Basic Operation
1. **Allow microphone access** when prompted
2. **Click the microphone button** to start/stop recording
3. **Speak naturally** - watch your words transform into video
4. **Use the Settings button** to adjust AI parameters

### Advanced Controls
- **Model Selection:** Choose between different AI models
- **Inference Steps:** Control quality vs. speed trade-off
- **Prompt Engineering:** Customize the AI's creative direction
- **Control Nets:** Enable/disable various visual processing techniques

## 📋 API Configuration

### Daydream API
Get your API key from the [Daydream Key Generator](https://app.daydream.live/beta/api-key) using your Discord passcode.

### Deepgram API
For enhanced speech recognition, get a key from [Deepgram Console](https://console.deepgram.com/).


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Daydream** for the incredible AI video generation API
- **Deepgram** for advanced speech recognition technology
- **Livepeer** for reliable video streaming infrastructure
- **Vercel** for hosting and deployment platform


---


🎨 **Transform your voice into visual art!** 🎨