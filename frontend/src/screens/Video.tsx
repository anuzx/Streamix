import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels"; // registers player.qualityLevels()
import Navbar from "../components/Navbar";
import VideoCard from "../components/VideoCard";
import { getVideoById, getAllVideos, getVideoStatus } from "../api/video.api";
import { ThumbsUp, ThumbsDown, Share2, Flag } from "lucide-react";

type VideoData = {
  _id: string;
  title: string;
  description: string;
  videoFile: string;
  thumbnail: string;
  views: number;
  duration: number;
  createdAt: string;
  isTranscoded: boolean;
  hlsUrl: string | null;
  owner: {
    _id: string;
    username: string;
    avatar: string;
  };
};

type SuggestionVideo = {
  _id: string;
  title: string;
  thumbnail: string;
  views: number;
  duration: number;
  createdAt: string;
  owner: { username: string; avatar: string };
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

// ─── Quality Selector ──────────────────────────────────────────────────────────
// Reads actual rendition heights from the HLS manifest instead of hardcoding
// index positions. Works with Cloudinary's sp_hd profile (360/480/720/1080p).

function setupQualitySelector(player: any) {
  const Button = videojs.getComponent("Button");

  // Guard: only register once per page lifecycle
  if (!videojs.getComponent("QualityButton")) {
    class QualityButton extends Button {
      private menuEl: HTMLElement | null = null;
      private labelEl: HTMLElement | null = null;

      buildCSSClass() {
        return `vjs-quality-selector vjs-menu-button ${super.buildCSSClass()}`;
      }

      createEl() {
        const el = super.createEl("button", {
          className: "vjs-quality-selector vjs-control vjs-button",
        }) as HTMLElement;

        const label = document.createElement("span");
        label.className = "vjs-icon-placeholder";
        label.textContent = "Auto";
        el.appendChild(label);
        this.labelEl = label;
        return el;
      }

      setLabel(text: string) {
        if (this.labelEl) this.labelEl.textContent = text;
      }

      closeMenu() {
        if (this.menuEl) {
          this.menuEl.remove();
          this.menuEl = null;
        }
      }

      handleClick() {
        if (this.menuEl) {
          this.closeMenu();
          return;
        }

        const qualityLevels = (this.player() as any).qualityLevels?.();
        if (!qualityLevels || qualityLevels.length === 0) return;

        const menu = document.createElement("div");
        menu.className =
          "vjs-quality-menu absolute bottom-10 right-0 bg-black/90 rounded-lg overflow-hidden z-50 min-w-[110px]";

        // Build items: Auto + one entry per unique height (sorted highest first)
        const heights: number[] = [];
        for (let i = 0; i < qualityLevels.length; i++) {
          const h = qualityLevels[i].height;
          if (h && !heights.includes(h)) heights.push(h);
        }
        heights.sort((a, b) => b - a); // descending

        const items: { label: string; height: number | null }[] = [
          { label: "Auto", height: null },
          ...heights.map((h) => ({ label: `${h}p`, height: h })),
        ];

        items.forEach(({ label, height }) => {
          const item = document.createElement("div");
          item.className =
            "px-4 py-2 text-white text-sm cursor-pointer hover:bg-zinc-700 transition-colors";
          item.textContent = label;
          item.addEventListener("click", () => {
            for (let i = 0; i < qualityLevels.length; i++) {
              // null height = Auto (enable all); otherwise enable only matching height
              qualityLevels[i].enabled =
                height === null || qualityLevels[i].height === height;
            }
            this.setLabel(label);
            this.closeMenu();
          });
          menu.appendChild(item);
        });

        // Close when clicking outside
        const onOutside = (e: MouseEvent) => {
          if (!this.el().contains(e.target as Node)) {
            this.closeMenu();
            document.removeEventListener("click", onOutside);
          }
        };
        // Defer so this click doesn't immediately close it
        setTimeout(() => document.addEventListener("click", onOutside), 0);

        this.el().appendChild(menu);
        this.menuEl = menu;
      }
    }

    videojs.registerComponent("QualityButton", QualityButton);
  }

  player.ready(() => {
    const qualityLevels = player.qualityLevels?.();
    if (!qualityLevels) return;

    // Wait until levels are populated from the manifest before adding the button
    const addButton = () => {
      if (qualityLevels.length > 1) {
        player.getChild("controlBar")?.addChild("QualityButton", {}, 15);
      }
    };

    if (qualityLevels.length > 1) {
      addButton();
    } else {
      qualityLevels.on("addqualitylevel", () => {
        // Only add the button once, after at least 2 levels are known
        if (qualityLevels.length > 1) {
          qualityLevels.off("addqualitylevel");
          addButton();
        }
      });
    }
  });
}

// ──────────────────────────────────────────────────────────────────────────────

export function Video() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const videoId = searchParams.get("id");

  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [video, setVideo] = useState<VideoData | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [transcoding, setTranscoding] = useState(false);

  // Initialise / destroy Video.js when video data is ready
  useEffect(() => {
    if (!video || !containerRef.current) return;

    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    const isHLS = video.isTranscoded && !!video.hlsUrl;
    const src = isHLS
      ? { src: video.hlsUrl!, type: "application/x-mpegURL" }
      : { src: video.videoFile, type: "video/mp4" };

    containerRef.current.innerHTML = "";
    const videoEl = document.createElement("video");
    videoEl.className = "video-js vjs-big-play-centered vjs-fluid";
    containerRef.current.appendChild(videoEl);

    const player = videojs(videoEl, {
      controls: true,
      autoplay: true,
      preload: "auto",
      html5: {
        vhs: {
          // Required: forces VHS (not native HLS) so qualityLevels plugin works
          // in all browsers including Safari
          overrideNative: true,
          enableLowInitialPlaylist: true,
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false,
        nativeTextTracks: false,
      },
      sources: [src],
    });

    playerRef.current = player;

    // Attach quality selector only for HLS — it needs the VHS quality level API
    if (isHLS) {
      setupQualitySelector(player);
    }

    return () => {
      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, [video]);

  // Poll for transcoding completion
  useEffect(() => {
    if (!video || video.isTranscoded) return;

    setTranscoding(true);

    pollRef.current = setInterval(async () => {
      try {
        const status = await getVideoStatus(video._id);
        if (status.isTranscoded && status.hlsUrl) {
          clearInterval(pollRef.current!);
          setTranscoding(false);
          setVideo((prev) =>
            prev ? { ...prev, isTranscoded: true, hlsUrl: status.hlsUrl } : prev
          );
        }
      } catch {
        // silently ignore transient poll errors
      }
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [video?._id, video?.isTranscoded]);

  // Fetch video + suggestions
  useEffect(() => {
    if (!videoId) return;

    async function fetchData() {
      try {
        setLoading(true);
        setDescExpanded(false);

        const [videoData, allVideos] = await Promise.all([
          getVideoById(videoId!),
          getAllVideos(),
        ]);

        setVideo(videoData);
        setSuggestions(
          (allVideos ?? []).filter((v: SuggestionVideo) => v._id !== videoId)
        );
      } catch (err: any) {
        setError(err.message ?? "Failed to load video");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [videoId]);

  if (!videoId) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">No video selected.</p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      <Navbar />

      <main className="pt-14 px-4 md:px-8 max-w-[1600px] mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-96">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 py-6">
            {/* LEFT */}
            <div className="flex-1 min-w-0">

              {/* Transcoding banner */}
              {transcoding && (
                <div className="mb-3 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm px-4 py-2.5 rounded-xl">
                  <div className="w-3.5 h-3.5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  Video is being transcoded to HLS — quality switching will be available shortly.
                </div>
              )}

              {/* Player */}
              <div className="w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden relative">
                <div ref={containerRef} className="w-full h-full" />
              </div>

              {/* Title */}
              <h1 className="text-white text-xl font-semibold mt-4 leading-snug">
                {video?.title}
              </h1>

              {/* Views + actions */}
              <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                <p className="text-zinc-400 text-sm">
                  {video?.views} views · {video && timeAgo(video.createdAt)}
                </p>
                <div className="flex items-center gap-2">
                  {[
                    { icon: <ThumbsUp size={16} />, label: "Like" },
                    { icon: <ThumbsDown size={16} />, label: "Dislike" },
                    { icon: <Share2 size={16} />, label: "Share" },
                    { icon: <Flag size={16} />, label: "Report" },
                  ].map(({ icon, label }) => (
                    <button
                      key={label}
                      className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-full transition-colors"
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Channel */}
              <div className="flex items-center justify-between mt-4 p-4 bg-zinc-900 rounded-xl">
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() => navigate(`/channel/${video?.owner.username}`)}
                >
                  <img
                    src={video?.owner.avatar}
                    alt={video?.owner.username}
                    className="w-10 h-10 rounded-full object-cover bg-zinc-700"
                  />
                  <p className="text-white font-medium text-sm">
                    {video?.owner.username}
                  </p>
                </div>
                <button className="bg-white hover:bg-zinc-200 text-black text-sm font-semibold px-5 py-2 rounded-full transition-colors">
                  Subscribe
                </button>
              </div>

              {/* Description */}
              {video?.description && (
                <div className="mt-4 p-4 bg-zinc-900 rounded-xl">
                  <p
                    className={`text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed ${!descExpanded ? "line-clamp-3" : ""
                      }`}
                  >
                    {video.description}
                  </p>
                  <button
                    onClick={() => setDescExpanded((p) => !p)}
                    className="text-white text-sm font-medium mt-2 hover:underline"
                  >
                    {descExpanded ? "Show less" : "Show more"}
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT — suggestions */}
            <div className="w-full lg:w-96 flex-shrink-0">
              <h2 className="text-white font-medium mb-4">Up next</h2>
              <div className="flex flex-col gap-3">
                {suggestions.length === 0 ? (
                  <p className="text-zinc-600 text-sm">No suggestions available.</p>
                ) : (
                  suggestions.map((v) => (
                    <VideoCard
                      key={v._id}
                      variant="secondary"
                      _id={v._id}
                      thumbnail={v.thumbnail}
                      title={v.title}
                      views={v.views}
                      createdAt={v.createdAt}
                      duration={v.duration}
                      owner={v.owner}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
