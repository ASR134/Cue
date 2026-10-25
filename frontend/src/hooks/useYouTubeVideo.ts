import { useState, useEffect, useCallback } from 'react';
import { VideoInfo } from '../types';

/**
 * Extracts YouTube Video ID from standard watch URLs, short URLs, or embed URLs.
 */
export function extractYouTubeVideoId(urlStr?: string): string | null {
  if (!urlStr) return null;

  try {
    const url = new URL(urlStr);
    const host = url.hostname.replace(/^www\./, '').replace(/^m\./, '');

    if (host === 'youtube.com' || host === 'music.youtube.com') {
      if (url.pathname === '/watch') {
        return url.searchParams.get('v');
      }
      if (url.pathname.startsWith('/embed/')) {
        return url.pathname.split('/')[2] || null;
      }
      if (url.pathname.startsWith('/shorts/')) {
        return url.pathname.split('/')[2] || null;
      }
    } else if (host === 'youtu.be') {
      return url.pathname.slice(1) || null;
    }
  } catch {
    // Invalid URL format
  }

  return null;
}

/**
 * Strips YouTube branding suffix from tab titles for a cleaner look.
 */
function cleanTitle(rawTitle?: string): string | undefined {
  if (!rawTitle) return undefined;
  return rawTitle.replace(/\s*-\s*YouTube\s*$/i, '').trim();
}

export function useYouTubeVideo() {
  const [videoInfo, setVideoInfo] = useState<VideoInfo>({
    videoId: null,
    title: undefined,
    url: undefined,
    isYouTube: false,
    isWatchPage: false,
  });

  const [isLoadingTab, setIsLoadingTab] = useState<boolean>(true);

  const queryActiveTab = useCallback(async () => {
    if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
      // Running outside Chrome extension environment (e.g. dev preview)
      setIsLoadingTab(false);
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const videoId = extractYouTubeVideoId(tab.url);
        const isYouTube = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com|youtu\.be)/i.test(tab.url);
        const isWatchPage = Boolean(videoId);

        setVideoInfo({
          videoId,
          title: cleanTitle(tab.title),
          url: tab.url,
          isYouTube,
          isWatchPage,
        });
      } else {
        setVideoInfo({
          videoId: null,
          title: undefined,
          url: undefined,
          isYouTube: false,
          isWatchPage: false,
        });
      }
    } catch (err) {
      console.warn('Failed to query current active tab:', err);
    } finally {
      setIsLoadingTab(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    queryActiveTab();

    if (typeof chrome === 'undefined' || !chrome.tabs) {
      return;
    }

    // Listen to tab events
    const handleTabUpdated = (
      _tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      _tab: chrome.tabs.Tab
    ) => {
      if (changeInfo.url || changeInfo.status === 'complete' || changeInfo.title) {
        queryActiveTab();
      }
    };

    const handleTabActivated = () => {
      queryActiveTab();
    };

    // Listen to messages from content script or background worker
    const handleRuntimeMessage = (message: { type?: string }) => {
      if (
        message?.type === 'YOUTUBE_NAVIGATED' ||
        message?.type === 'TAB_UPDATED' ||
        message?.type === 'TAB_ACTIVATED'
      ) {
        queryActiveTab();
      }
    };

    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    chrome.tabs.onActivated.addListener(handleTabActivated);
    chrome.runtime.onMessage.addListener(handleRuntimeMessage);

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      chrome.tabs.onActivated.removeListener(handleTabActivated);
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
    };
  }, [queryActiveTab]);

  return {
    videoInfo,
    isLoadingTab,
    refreshVideoInfo: queryActiveTab,
  };
}
