/**
 * Content Script for YouTube Pages
 * - Listens for YouTube SPA navigation events (yt-navigate-finish)
 * - Handles seeking the YouTube HTML5 video player to timestamps
 */

function notifyNavigation(): void {
  try {
    chrome.runtime
      .sendMessage({
        type: 'YOUTUBE_NAVIGATED',
        url: window.location.href,
        title: document.title,
      })
      .catch(() => {
        // Ignored when side panel / extension is inactive
      });
  } catch {
    // Context might be invalidated
  }
}

// YouTube emits custom events on SPA navigation
window.addEventListener('yt-navigate-finish', notifyNavigation);
window.addEventListener('popstate', notifyNavigation);

// Also observe title changes to capture updated video title
let lastTitle = document.title;
const titleObserver = new MutationObserver(() => {
  if (document.title !== lastTitle) {
    lastTitle = document.title;
    notifyNavigation();
  }
});

const titleElement = document.querySelector('title');
if (titleElement) {
  titleObserver.observe(titleElement, { childList: true });
}

// Listen for commands from the extension side panel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'SEEK_TO' && typeof message.seconds === 'number') {
    const targetSeconds = message.seconds;

    // Approach 1: Try YouTube's internal player API if available
    const moviePlayer = document.getElementById('movie_player') as {
      seekTo?: (seconds: number, allowSeekAhead: boolean) => void;
      playVideo?: () => void;
    } | null;

    if (moviePlayer && typeof moviePlayer.seekTo === 'function') {
      moviePlayer.seekTo(targetSeconds, true);
      if (typeof moviePlayer.playVideo === 'function') {
        moviePlayer.playVideo();
      }
      sendResponse({ success: true, method: 'player_api' });
      return true;
    }

    // Approach 2: Standard HTML5 video element
    const video = document.querySelector('video') as HTMLVideoElement | null;
    if (video) {
      video.currentTime = targetSeconds;
      if (video.paused) {
        video.play().catch(() => {});
      }
      sendResponse({ success: true, method: 'html5_video' });
      return true;
    }

    sendResponse({ success: false, error: 'No video player found on page' });
    return true;
  }

  if (message.action === 'GET_VIDEO_INFO') {
    sendResponse({
      url: window.location.href,
      title: document.title,
    });
    return true;
  }

  return false;
});
