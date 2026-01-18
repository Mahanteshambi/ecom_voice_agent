# Voice-Enabled E-commerce Agent 🛍️🎙️

A multimodal AI agent capable of navigating an e-commerce interface via voice commands. Built with **Google Gemini Multimodal Live API**, **FastAPI**, and **Next.js**.

## 🌟 Features
- **Voice Control**: "Show me laptops", "Filter by phones", "Add this to cart".
- **Multimodal Interaction**: The agent sees what you see (UI context) and responds with both Audio and UI actions.
- **Real-time Feedback**: Latency-optimized WebSocket connection for instant response.
- **Visual Grounding**: The agent understands the product grid and can highlight specific items.

## 📂 Project Structure
- `src/frontend`: Next.js React Application (UI).
- `src/agent`: Python FastAPI Server (The Brain).

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Google Cloud Project with Gemini API enabled.

### 1. Backend Setup (Agent)
```bash
cd src/agent
# Install dependencies
uv sync  # or pip install -r requirements.txt
# Set Environment Variables
cp .env.example .env 
# (Add your GOOGLE_API_KEY in .env)

# Run the Server
uv run main.py
```
*Server runs on `http://localhost:8080`*

### 2. Frontend Setup (Client)
```bash
cd src/frontend
npm install
npm run dev
```
*Client runs on `http://localhost:3000`*

## 🛠️ Usage
1. Open `http://localhost:3000`.
2. Click the **Microphone Icon** (bottom right).
3. Say commands like:
   - *"I'm looking for a new laptop for work."*
   - *"Show me the details of that Dell XPS."*
   - *"Add it to my cart."*

## 🔧 Troubleshooting
- **No Audio?** Check browser permissions.
- **Agent not responding?** Ensure backend is running logs show `Client connected`.
