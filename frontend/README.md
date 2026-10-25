# Cue — YouTube AI Assistant

A minimalist Chrome Side Panel extension that allows you to prepare YouTube video transcripts and ask questions using your local FastAPI RAG backend.

---

## What Changed in Cue

- **Brand & Identity**: Rebranded as **Cue** with a dark play symbol, timeline marker, and coral-red accent derived from the official reference logo.
- **Fixed Timestamp Navigation**: Timestamps (e.g. `[01:23]`, `[01:05:20]`, or ranges `[01:23 - 02:45]`) now execute directly inside the page's `MAIN` world using `chrome.scripting.executeScript` to invoke YouTube's internal `movie_player.seekTo()` API reliably, with message-passing fallback.
- **Cleaned Header**: Removed the dashboard Online/Offline badge and editable settings popdown.
- **Fixed API Base URL**: Pinned to `http://127.0.0.1:8000` internally without runtime configuration clutter.
- **Compact Layout**: Natural inline status, no oversized illustrations or placeholder cards, and a bottom-anchored question input bar.

---

## 1. Start the FastAPI Backend

```powershell
# Navigate to backend
cd backend

# Activate your virtual environment:
..\ytc_venv\Scripts\activate

# Start FastAPI with uvicorn
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify backend health at: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

---

## 2. Build the Extension

To build or rebuild the extension:

```powershell
cd frontend
npm run build
```

The output directory `frontend/dist/` is the complete unpacked extension.

---

## 3. Load the Extension into Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** (top-left).
4. Select `frontend/dist`.
5. Pin **Cue** to your Chrome toolbar.

---

## 4. Usage

1. Open any YouTube video with English captions.
2. Click the **Cue** icon in your toolbar to open the side panel.
3. Click **Prepare video**. Cue indexes the transcript through `POST /video`.
4. Ask any question in the bottom input bar.
5. Click any timestamp in the response to jump the YouTube video directly to that time.
