/**
 * Utility to parse and seek timestamps in YouTube video player.
 */

export interface TextSegment {
  type: 'text' | 'timestamp';
  content: string;
  seconds?: number;
}

/**
 * Converts a timestamp string like "01:23", "1:23", "01:15:30", or "[04:20]" into total seconds.
 * Returns null if the format is invalid or out of range.
 */
export function timestampToSeconds(timeStr: string): number | null {
  if (!timeStr) return null;

  // Strip brackets, parentheses, and trim
  const clean = timeStr.replace(/[\[\]\(\)]/g, '').trim();
  const parts = clean.split(':').map((p) => parseInt(p, 10));

  if (parts.some((p) => isNaN(p) || p < 0)) {
    return null;
  }

  if (parts.length === 2) {
    // MM:SS
    const [minutes, seconds] = parts;
    if (seconds >= 60) return null;
    return minutes * 60 + seconds;
  } else if (parts.length === 3) {
    // HH:MM:SS
    const [hours, minutes, seconds] = parts;
    if (minutes >= 60 || seconds >= 60) return null;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
}

/**
 * Parses text and identifies timestamp occurrences (e.g., [01:23], [1:05:20], 04:30).
 * Supports timestamp ranges like [01:23 - 02:45] by cleanly tokenizing both endpoints.
 */
export function parseTimestamps(text: string): TextSegment[] {
  if (!text) return [];

  // Matches [HH:MM:SS], [MM:SS], or word-bounded HH:MM:SS / MM:SS
  const timestampRegex = /(\[?(?:\b\d{1,2}:)?\d{1,2}:\d{2}\]?)/g;

  const segments: TextSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = timestampRegex.exec(text)) !== null) {
    const rawMatch = match[0];
    const matchIndex = match.index;

    // Append preceding plain text
    if (matchIndex > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, matchIndex),
      });
    }

    const seconds = timestampToSeconds(rawMatch);
    if (seconds !== null) {
      // Clean display label (remove surrounding brackets for cleaner badge styling)
      const label = rawMatch.replace(/[\[\]]/g, '');
      segments.push({
        type: 'timestamp',
        content: label,
        seconds,
      });
    } else {
      segments.push({
        type: 'text',
        content: rawMatch,
      });
    }

    lastIndex = timestampRegex.lastIndex;
  }

  // Append any trailing text
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return segments;
}

/**
 * Executes a seek operation on the active YouTube tab.
 * Uses chrome.scripting with world: 'MAIN' to interface directly with YouTube's
 * internal movie_player API, falling back to message passing or standard HTML5 video.
 */
export async function seekActiveYouTubeTab(seconds: number): Promise<boolean> {
  if (typeof chrome === 'undefined' || !chrome.tabs) {
    console.warn('Chrome tabs API not available.');
    return false;
  }

  try {
    // 1. Identify the active YouTube tab in the current or focused window
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url || (!tab.url.includes('youtube.com') && !tab.url.includes('youtu.be'))) {
      const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (tabs[0]?.url && (tabs[0].url.includes('youtube.com') || tabs[0].url.includes('youtu.be'))) {
        tab = tabs[0];
      }
    }

    if (!tab || !tab.id) {
      console.warn('No active YouTube tab found to seek.');
      return false;
    }

    const tabId = tab.id;

    // 2. Primary Method: Execute directly in the page's MAIN world.
    // This allows calling YouTube's official player API (document.getElementById('movie_player').seekTo())
    // which is not accessible from isolated content script environments.
    if (chrome.scripting && chrome.scripting.executeScript) {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId },
          world: 'MAIN',
          func: (targetSec: number) => {
            // Attempt YouTube internal player API
            const player = document.getElementById('movie_player') as {
              seekTo?: (sec: number, allowSeekAhead: boolean) => void;
              playVideo?: () => void;
            } | null;

            if (player && typeof player.seekTo === 'function') {
              player.seekTo(targetSec, true);
              if (typeof player.playVideo === 'function') {
                player.playVideo();
              }
              return true;
            }

            // Fallback to standard HTML5 video element
            const video = document.querySelector('video') as HTMLVideoElement | null;
            if (video) {
              video.currentTime = targetSec;
              if (video.paused) {
                video.play().catch(() => {});
              }
              return true;
            }

            return false;
          },
          args: [seconds],
        });

        if (results && results[0]?.result) {
          return true;
        }
      } catch (scriptErr) {
        console.warn('Direct scripting seek failed, falling back to message passing:', scriptErr);
      }
    }

    // 3. Fallback Method: Send message to content script
    try {
      const response = await chrome.tabs.sendMessage(tabId, {
        action: 'SEEK_TO',
        seconds,
      });
      return Boolean(response?.success);
    } catch {
      // Content script may not be loaded on page; ignore
    }

    return false;
  } catch (err) {
    console.error('Failed to seek active YouTube tab:', err);
    return false;
  }
}
