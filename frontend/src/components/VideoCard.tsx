import React from 'react';
import { Loader2, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { VideoInfo, PreparationStatus } from '../types';

interface VideoCardProps {
  videoInfo: VideoInfo;
  status: PreparationStatus;
  errorMessage?: string;
  onPrepare: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  videoInfo,
  status,
  errorMessage,
  onPrepare,
}) => {
  // When no YouTube video is detected: small, natural, muted inline message
  if (!videoInfo.isYouTube || !videoInfo.isWatchPage || !videoInfo.videoId) {
    return (
      <div className="video-empty-banner">
        <span className="empty-indicator-dot"></span>
        <span className="empty-text">Open a YouTube video in your browser to begin.</span>
      </div>
    );
  }

  const isPreparing = status === 'preparing';

  return (
    <div className="video-compact-bar">
      <div className="video-info-row">
        <div className="video-title-wrap">
          <span className="video-title" title={videoInfo.title || videoInfo.videoId}>
            {videoInfo.title || `Video ${videoInfo.videoId}`}
          </span>
          <span className="video-id-tag">
            {videoInfo.videoId}
            {videoInfo.url && (
              <a
                href={videoInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="video-ext-link"
                title="Open video in new tab"
                aria-label="Open video in new tab"
              >
                <ExternalLink size={10} />
              </a>
            )}
          </span>
        </div>

        <div className="video-action-cell">
          {status === 'idle' && (
            <button
              type="button"
              className="btn-prepare"
              onClick={onPrepare}
              disabled={isPreparing}
            >
              Prepare video
            </button>
          )}

          {status === 'preparing' && (
            <button type="button" className="btn-prepare preparing" disabled>
              <Loader2 size={12} className="spin" />
              <span>Indexing...</span>
            </button>
          )}

          {status === 'ready' && (
            <div className="status-ready-pill" title="Transcript indexed and ready">
              <Check size={11} className="text-ready" />
              <span>Ready</span>
            </div>
          )}

          {status === 'error' && (
            <button
              type="button"
              className="btn-prepare retry"
              onClick={onPrepare}
              title="Click to retry preparation"
            >
              Retry
            </button>
          )}
        </div>
      </div>

      {status === 'error' && errorMessage && (
        <div className="video-inline-error">
          <AlertCircle size={12} className="flex-shrink-0" />
          <span className="error-message-text">{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
