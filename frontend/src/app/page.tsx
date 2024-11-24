// frontend/app/page.tsx
import { BlueskyAnalyzer } from "@/components/bluesky/analyzer";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <BlueskyAnalyzer />
    </main>
  );
}