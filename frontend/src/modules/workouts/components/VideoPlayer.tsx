import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  url?: string;
  isRunning: boolean;
}

export function VideoPlayer({ url, isRunning }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isRunning) {
        videoRef.current.play().catch((e) => console.log("Auto-play prevented", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isRunning]);

  if (!url) {
    return (
      <div className="w-full h-full min-h-75 flex items-center justify-center rounded-xl bg-surface-elevated border border-border text-muted">
        No video reference available
      </div>
    );
  }

  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");

  if (isYouTube) {
    let videoId = "";
    if (url.includes("v=")) {
      videoId = url.split("v=")[1]?.split("&")[0] || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (url.includes("youtube.com/shorts/")) {
      videoId = url.split("youtube.com/shorts/")[1]?.split("?")[0] || "";
    }

    if (!videoId) return <div className="text-red-400">Invalid YouTube URL</div>;

    return (
      <div className="w-full aspect-video rounded-xl overflow-hidden border border-border shadow-lg">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden border border-border shadow-lg bg-black flex items-center justify-center">
      <video ref={videoRef} src={url} controls className="w-full h-full object-contain" playsInline>
        <track kind="captions" />
      </video>
    </div>
  );
}
