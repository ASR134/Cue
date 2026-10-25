export interface VideoInfo {
  videoId: string | null;
  title?: string;
  url?: string;
  isYouTube: boolean;
  isWatchPage: boolean;
}

export type PreparationStatus = 'idle' | 'preparing' | 'ready' | 'error';

export interface VideoPrepareRequest {
  video_id: string;
}

export interface VideoPrepareResponse {
  video_id: string;
  status: 'ready';
}

export interface QuestionRequest {
  video_id: string;
  question: string;
}

export interface QuestionResponse {
  video_id: string;
  question: string;
  answer: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  createdAt: number;
  isError?: boolean;
}
