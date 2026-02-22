"use client";

import dynamic from "next/dynamic";
import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

const Player = dynamic(
  () => import("@lottiefiles/react-lottie-player").then((mod) => mod.Player),
  { ssr: false }
);

interface LottieAnimationProps {
  src: string;
  loop?: boolean;
  autoplay?: boolean;
  playOnHover?: boolean;
  playOnView?: boolean;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}

function LottieAnimation({
  src,
  loop = false,
  autoplay = true,
  playOnHover = false,
  playOnView = false,
  speed = 1,
  className,
  style,
}: LottieAnimationProps) {
  const playerInstanceRef = useRef<{ play: () => void } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  const handlePlayerEvent = useCallback((event: string) => {
    if (event === "load" && playerInstanceRef.current && playOnView) {
      // Player is loaded
    }
  }, [playOnView]);

  useEffect(() => {
    if (!playOnView || hasPlayed) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && playerInstanceRef.current) {
          playerInstanceRef.current.play();
          setHasPlayed(true);
        }
      },
      { threshold: 0.3 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [playOnView, hasPlayed]);

  const handleMouseEnter = () => {
    if (playOnHover && playerInstanceRef.current) {
      playerInstanceRef.current.play();
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      className={cn("inline-flex", className)}
    >
      <Player
        lottieRef={(instance) => {
          playerInstanceRef.current = instance as { play: () => void } | null;
        }}
        onEvent={handlePlayerEvent}
        src={src}
        loop={loop}
        autoplay={autoplay && !playOnHover && !playOnView}
        speed={speed}
        style={style}
      />
    </div>
  );
}

export { LottieAnimation };
