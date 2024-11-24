// frontend/types/bluesky.ts
export interface BlueskyUser {
    handle: string;
    name: string;
    lastPost: string;
    followsBack: boolean;
  }
  
  export interface BlueskyAnalyzerProps {
    className?: string;
  }