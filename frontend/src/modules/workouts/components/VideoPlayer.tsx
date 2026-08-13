import { useEffect, useRef } from "react";

interface VideoPlayerProps {
  url?: string;
  isRunning?: boolean;
}

export function VideoPlayer({ url }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = 0.5;
      videoRef.current.play().catch((e) => console.log("Auto-play prevented", e));
    }
  }, [url]);

  const handleIframeLoad = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "setVolume", args: [50] }),
        "*",
      );
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: [] }),
        "*",
      );
    }
  };

  if (!url) {
    return (
      <div className="w-full h-full min-h-32 flex items-center justify-center rounded-xl bg-surface-elevated border border-border text-muted text-xs md:text-sm p-4 text-center">
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

    if (!videoId) return <div className="text-red-400 text-xs">Invalid YouTube URL</div>;

    return (
      <div className="w-full h-full min-h-0 aspect-video rounded-xl overflow-hidden border border-border shadow-md bg-black">
        <iframe
          ref={iframeRef}
          onLoad={handleIframeLoad}
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&enablejsapi=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full object-cover"
        ></iframe>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-0 aspect-video rounded-xl overflow-hidden border border-border shadow-md bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        src={url}
        autoPlay
        loop
        controls
        playsInline
        className="w-full h-full object-contain"
      >
        <track kind="captions" />
      </video>
    </div>
  );
}
