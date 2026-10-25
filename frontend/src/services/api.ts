import {
  VideoPrepareRequest,
  VideoPrepareResponse,
  QuestionRequest,
  QuestionResponse,
} from '../types';

/**
 * Fixed development API base URL for FastAPI backend.
 */
export const API_BASE_URL = 'http://127.0.0.1:8000';

/**
 * Custom error class capturing backend HTTP detail or network failures.
 */
export class ApiError extends Error {
  statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Helper to parse backend error responses cleanly.
 */
async function parseError(response: Response): Promise<never> {
  let errorMessage = `Request failed (${response.status} ${response.statusText})`;
  try {
    const errorBody = await response.json();
    if (errorBody && typeof errorBody.detail === 'string') {
      errorMessage = errorBody.detail;
    } else if (Array.isArray(errorBody?.detail)) {
      // Pydantic validation errors
      errorMessage = errorBody.detail
        .map((d: { msg?: string }) => d.msg || 'Invalid field')
        .join(', ');
    }
  } catch {
    try {
      const text = await response.text();
      if (text) errorMessage = text;
    } catch {
      // fallback
    }
  }

  throw new ApiError(errorMessage, response.status);
}

/**
 * Health check: GET /
 */
export async function checkHealth(): Promise<{ message: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return parseError(response);
    }

    return await response.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const msg =
      (err as Error)?.name === 'AbortError'
        ? 'Connection timed out. Check if FastAPI is running.'
        : 'Cannot reach backend at http://127.0.0.1:8000. Ensure FastAPI is running.';
    throw new ApiError(msg);
  }
}

/**
 * Prepares a video's FAISS index: POST /video
 */
export async function prepareVideo(videoId: string): Promise<VideoPrepareResponse> {
  const payload: VideoPrepareRequest = { video_id: videoId.trim() };

  try {
    const controller = new AbortController();
    // Allow up to 90 seconds for downloading captions and building vector embeddings
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const response = await fetch(`${API_BASE_URL}/video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return parseError(response);
    }

    return await response.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const msg =
      (err as Error)?.name === 'AbortError'
        ? 'Video preparation timed out. The transcript may be unusually large.'
        : 'Failed to connect to backend at http://127.0.0.1:8000.';
    throw new ApiError(msg);
  }
}

/**
 * Asks a question about a prepared video: POST /question
 */
export async function askQuestion(
  videoId: string,
  question: string
): Promise<QuestionResponse> {
  const payload: QuestionRequest = {
    video_id: videoId.trim(),
    question: question.trim(),
  };

  try {
    const controller = new AbortController();
    // Allow up to 60 seconds for hybrid retrieval + Gemini response
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`${API_BASE_URL}/question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return parseError(response);
    }

    return await response.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const msg =
      (err as Error)?.name === 'AbortError'
        ? 'Question request timed out.'
        : 'Failed to connect to backend at http://127.0.0.1:8000.';
    throw new ApiError(msg);
  }
}
