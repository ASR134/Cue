import React, { useState } from 'react';
import { Play } from 'lucide-react';
import { seekActiveYouTubeTab } from '../utils/timestamp';

interface TimestampBadgeProps {
  label: string;
  seconds: number;
}

export const TimestampBadge: React.FC<TimestampBadgeProps> = ({ label, seconds }) => {
  const [status, setStatus] = useState<'idle' | 'seeking' | 'success' | 'failed'>('idle');

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent accidental parent form submission or card click
    e.preventDefault();
    e.stopPropagation();

    setStatus('seeking');
    const success = await seekActiveYouTubeTab(seconds);

    if (success) {
      setStatus('success');
      setTimeout(() => setStatus('idle'), 1000);
    } else {
      setStatus('failed');
      setTimeout(() => setStatus('idle'), 1500);
    }
  };

  const getStatusClass = () => {
    if (status === 'success') return 'timestamp-success';
    if (status === 'failed') return 'timestamp-failed';
    if (status === 'seeking') return 'timestamp-seeking';
    return '';
  };

  return (
    <button
      type="button"
      className={`timestamp-badge ${getStatusClass()}`}
      onClick={handleClick}
      title={`Jump video to ${label}`}
      aria-label={`Jump video to ${label}`}
    >
      <Play size={9} fill="currentColor" className="timestamp-play-icon" />
      <span>{label}</span>
    </button>
  );
};
