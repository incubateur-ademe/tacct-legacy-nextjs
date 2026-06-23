'use client';

import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { ReactNode, useEffect } from 'react';

export const PHProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const host = window.location.host;
    if (host.includes('localhost') || host.includes('127.0.0.1')) return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;

    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      persistence: 'localStorage+cookie',
      capture_pageview: false,
      disable_session_recording: false,
      capture_heatmaps: true,
    });
    posthog.startSessionRecording();
    posthog.register({ app: 'tacct' });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
};
