"use client";

import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import Link from "next/link";

export function HomeHero() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId: number;

    const fade = (start: number, end: number, duration: number, callback?: () => void) => {
      const startTime = performance.now();
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const opacity = start + (end - start) * progress;
        if (video) video.style.opacity = opacity.toString();
        if (progress < 1) {
          rafId = requestAnimationFrame(animate);
        } else if (callback) {
          callback();
        }
      };
      rafId = requestAnimationFrame(animate);
    };

    const handleCanPlay = () => {
      video.play();
      fade(0, 0.6, 500);
    };
    const handleTimeUpdate = () => {
      const remaining = video.duration - video.currentTime;
      if (remaining <= 0.55 && video.style.opacity !== "0" && !video.dataset.fadingOut) {
        video.dataset.fadingOut = "true";
        fade(parseFloat(video.style.opacity || "0.6"), 0, 500);
      }
    };
    const handleEnded = () => {
      video.style.opacity = "0";
      video.dataset.fadingOut = "";
      setTimeout(() => {
        video.currentTime = 0;
        video.play();
        fade(0, 0.6, 500);
      }, 100);
    };

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section className="min-h-screen overflow-hidden relative flex flex-col bg-black">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover object-bottom"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_074625_a81f018a-956b-43fb-9aee-4d1508e30e6a.mp4"
        muted
        autoPlay
        playsInline
        preload="auto"
        style={{ opacity: 0 }}
      />

      {/* Navbar */}
      <nav className="relative z-20 px-6 py-6 mt-4">
        <div className="liquid-glass rounded-full max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-xl">H</span>
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">HackInspo</span>
            <div className="hidden md:flex gap-8 ml-12">
              <Link
                href="/projects"
                className="text-white/80 hover:text-white text-sm font-medium transition-colors"
              >
                Projects
              </Link>
              <Link
                href="/tracks/ai-ml"
                className="text-white/80 hover:text-white text-sm font-medium transition-colors"
              >
                Tracks
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 text-center -translate-y-12">
        <motion.h1
          initial={{ opacity: 0.6, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-8xl lg:text-9xl text-white tracking-tighter whitespace-nowrap font-serif mb-8"
        >
          Win your next <em className="italic text-white/60">hackathon</em>.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="max-w-2xl w-full mb-8"
        >
          <form action="/projects" method="GET">
            <div className="liquid-glass rounded-full pl-6 pr-2 py-1.5 flex items-center gap-3">
              <input
                type="text"
                name="search"
                placeholder="Search projects, tech stack, ideas..."
                className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/40 text-base py-2.5"
              />
              <button
                type="submit"
                className="bg-white rounded-full px-6 py-2.5 text-black font-bold hover:bg-white/90 transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <Link
            href="/projects"
            className="liquid-glass rounded-full px-8 py-3 text-white/60 text-xs tracking-[0.3em] font-medium hover:text-white hover:bg-white/5 transition-all uppercase inline-block"
          >
            or browse all projects
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
