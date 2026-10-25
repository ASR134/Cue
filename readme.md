# Cue — YouTube AI Assistant

<p align="center">
  <img src="frontend/public/icons/icon-128.png" alt="Cue logo" width="50" />
</p>

Cue is a Chrome Side Panel extension powered by a FastAPI backend that retrieves relevant transcript passages and generates context-grounded answers using Google Gemini.

## Features

- **Transcript Processing:** Fetches manually created English captions, falling back to auto-generated captions.
- **RAG Pipeline:** Splits transcripts into chunks, generates embeddings, and indexes them using FAISS.
- **Hybrid Retrieval:** Combines FAISS semantic search and BM25 keyword search using an ensemble retriever.
- **Question Answering:** Generates answers grounded in retrieved transcript context using Google Gemini.
- **Timestamp Navigation:** Jump directly to relevant moments in YouTube videos from answer timestamps.
- **Chrome Extension:** Minimalist side panel built with React, TypeScript, Vite, and Chrome Extension Manifest V3.

## Tech Stack

**Backend:** Python, FastAPI, LangChain, FAISS, BM25, Sentence Transformers, Google Gemini

**Frontend:** React, TypeScript, Vite, Chrome Extension APIs

## Getting Started

### 1. Configure the Backend

Install the backend dependencies and configure your Gemini API key in a `.env` file, using the environment variable name expected by your code.

```env
GOOGLE_API_KEY=your_gemini_api_key
```

### 2. Start the Backend

From the project root:

```powershell
cd backend
..\ytc_venv\Scripts\activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Build the Extension

```bash
cd frontend
npm install
npm run build
```

Open `chrome://extensions/`, enable **Developer mode**, click **Load unpacked**, and select `frontend/dist`.

## Usage

1. Open a YouTube video with available English captions.
2. Open Cue and click **Prepare video** to process and index the transcript.
3. Ask questions about the video.
4. Click timestamps in answers to jump to relevant moments.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Backend health check |
| POST | `/video` | Prepare and index a video's transcript |
| POST | `/question` | Answer a question using video context |

## Author

**Aman Singh Rawat**

- GitHub: [@ASR134](https://github.com/ASR134)
- Project Repository: [Cue](https://github.com/ASR134/Cue)
