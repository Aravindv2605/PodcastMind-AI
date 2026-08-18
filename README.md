# PodcastMind AI — AI-Powered Intelligent Conversational Podcast Ecosystem

PodcastMind AI is a dark-theme intelligence dashboard designed to turn standard audio podcasts into multi-dimensional conversational databases. It extracts transcripts, sentiment timeline coordinates, structural mind maps, study decks, quizzes, and viral highlight clips automatically.

## 🚀 Key Features

1. **Dashboard Shell**: Unified layout including sidebar page routing links, gold upgrade boxes, active storage progress meters, and notification dropdowns.
2. **Dynamic Canvas Waveform**: Interactive audio player that simulates audio voice waves on HTML canvas. Timing scrubber tracks play position. Clicking the waveform seeks audio playback.
3. **AI Chat Panel**: Contextual chatbot synced to the active episode. Users can submit queries or click prompt suggestion chips to receive realistic replies with typing animation delays.
4. **SVG Mind Map**: An interactive, library-free SVG diagram showing core concepts of the podcast. Nodes expand and collapse on click, updating connection paths dynamically.
5. **3D Flashcards Deck**: High-quality flipping card deck using Framer Motion 3D transitions (Front: question, Back: suggested answer).
6. **Self-Correcting Quizzes**: Sequential multiple-choice questionnaire with instant color feedback (green for correct, red for incorrect) and detailed explanations.
7. **Scrubber Emotion Timeline**: Large Recharts multi-line chart tracking Excitement, Curiosity, Surprise, Deep Thinking, and Joy. Clicking coordinates seeks the audio player to that exact quote timestamp.
8. **AI Host Twin**: A futuristic glowing mesh vector avatar panel that chats with the user, supporting settings like Debate Mode, Professional, and Casual styles.
9. **Drag-and-Drop Uploader**: Custom uploader overlay supporting file drags and auto-processing metadata.

---

## 🛠️ Technical Stack

- **Framework**: React 19 (via Vite)
- **Styling**: Tailwind CSS v3
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Framer Motion

---

## ⚙️ Quick Start Installation

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Local Development Server**:
   ```bash
   npm run dev
   ```

3. **Open Browser**:
   Navigate to the local address displayed in the terminal (typically `http://localhost:5173`).
