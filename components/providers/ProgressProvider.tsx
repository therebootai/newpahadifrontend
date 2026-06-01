'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';

export default function ProgressProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ProgressBar
        height="3px"
        color="#4EA674" // Brand Primary Green
        options={{ showSpinner: false }}
        shallowRouting
      />
    </>
  );
}
