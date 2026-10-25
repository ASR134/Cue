import { useState, useEffect, useRef } from 'react';
import { useYouTubeVideo } from './hooks/useYouTubeVideo';
import { Header } from './components/Header';
import { VideoCard } from './components/VideoCard';
import { ChatSection } from './components/ChatSection';
import { prepareVideo, askQuestion } from './services/api';
import { PreparationStatus, ChatMessage } from './types';

export function App() {
  const { videoInfo } = useYouTubeVideo();

  // Video preparation state
  const [prepStatus, setPrepStatus] = useState<PreparationStatus>('idle');
  const [prepError, setPrepError] = useState<string | undefined>(undefined);

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingAnswer, setIsLoadingAnswer] = useState<boolean>(false);

  // Track the videoId currently prepared or active
  const activeVideoIdRef = useRef<string | null>(null);

  // Handle video navigation / video ID change
  useEffect(() => {
    const currentVideoId = videoInfo.videoId;

    if (currentVideoId !== activeVideoIdRef.current) {
      activeVideoIdRef.current = currentVideoId;
      // Reset state for new video
      setPrepStatus('idle');
      setPrepError(undefined);
      setMessages([]);
      setIsLoadingAnswer(false);
    }
  }, [videoInfo.videoId]);

  // Handle "Prepare Video"
  const handlePrepareVideo = async () => {
    const videoId = videoInfo.videoId;
    if (!videoId || prepStatus === 'preparing') return;

    setPrepStatus('preparing');
    setPrepError(undefined);

    try {
      const response = await prepareVideo(videoId);
      if (response && response.status === 'ready') {
        if (activeVideoIdRef.current === videoId) {
          setPrepStatus('ready');
        }
      } else {
        throw new Error('Preparation finished without ready status.');
      }
    } catch (err: unknown) {
      if (activeVideoIdRef.current === videoId) {
        setPrepStatus('error');
        const errorMessage =
          (err as Error)?.message || 'Failed to prepare video transcript.';
        setPrepError(errorMessage);
      }
    }
  };

  // Handle "Ask Question"
  const handleSendQuestion = async (questionText: string) => {
    const videoId = videoInfo.videoId;
    if (!videoId || !questionText.trim() || isLoadingAnswer) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: questionText,
      createdAt: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoadingAnswer(true);

    try {
      const result = await askQuestion(videoId, questionText);

      // Verify that user hasn't switched videos while waiting for answer
      if (activeVideoIdRef.current === videoId) {
        const assistantMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: result.answer,
          createdAt: Date.now(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err: unknown) {
      if (activeVideoIdRef.current === videoId) {
        const errorMessage = (err as Error)?.message || 'Failed to get an answer.';
        const errorChatMsg: ChatMessage = {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: errorMessage,
          createdAt: Date.now(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorChatMsg]);
      }
    } finally {
      if (activeVideoIdRef.current === videoId) {
        setIsLoadingAnswer(false);
      }
    }
  };

  return (
    <div className="app-container">
      {/* 1. Understated Brand Header */}
      <Header />

      {/* 2. Compact Video Context & Action */}
      <section className="video-section">
        <VideoCard
          videoInfo={videoInfo}
          status={prepStatus}
          errorMessage={prepError}
          onPrepare={handlePrepareVideo}
        />
      </section>

      {/* 3. Conversation & Bottom-Anchored Input */}
      <ChatSection
        messages={messages}
        isLoadingAnswer={isLoadingAnswer}
        isPrepared={prepStatus === 'ready'}
        onSendQuestion={handleSendQuestion}
      />
    </div>
  );
}

export default App;
