import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "videojs-contrib-quality-levels";
import Navbar from "../components/Navbar";
import VideoCard from "../components/VideoCard";
import { getVideoById, getAllVideos, getVideoStatus } from "../api/video.api";
import { ThumbsUp, ThumbsDown, Share2, Flag } from "lucide-react";
import "../components/VideoJsQualityMenu";
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

  // fetch video + suggestions
  useEffect(() => {
    if (!videoId) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        setDescExpanded(false);

        const [videoData, videosResponse] = await Promise.all([
          getVideoById(videoId!),
          getAllVideos(),
        ]);

        const allVideos = Array.isArray(videosResponse?.docs)
          ? videosResponse.docs
          : [];

        setVideo(videoData);

        setSuggestions(
          allVideos.filter(
            (v: SuggestionVideo) => v._id !== videoId
          )
        );
      } catch (err: any) {
        setError(err.message ?? "Failed to load video");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [videoId]);

  useEffect(() => {
    if (!video || !containerRef.current) return;

    // dispose previous player
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }

    const isHLS = video.isTranscoded && !!video.hlsUrl;
    const src = isHLS
      ? { src: video.hlsUrl!, type: "application/x-mpegURL" }
      : { src: video.videoFile, type: "video/mp4" };

    // create fresh video element
    containerRef.current.innerHTML = "";
    const videoEl = document.createElement("video");
    videoEl.className = "video-js vjs-big-play-centered vjs-fluid";
    containerRef.current.appendChild(videoEl);

    const player = videojs(videoEl, {
      controls: true,
      autoplay: "muted",
      preload: "auto",
      html5: {
        vhs: {
          overrideNative: true,        // required for quality switching in all browsers
          enableLowInitialPlaylist: true,
        },
        nativeVideoTracks: false,
        nativeAudioTracks: false,
        nativeTextTracks: false,
      },
      sources: [src],
    });

    playerRef.current = player;

    // Attach quality selector only for HLS.
    // Add the button unconditionally inside player.ready() —
    // QualityMenuButton itself listens for addqualitylevel and calls
    // update() to rebuild the menu as levels arrive from the manifest.
    if (isHLS) {
      player.ready(() => {
        const controlBar = player.getChild("ControlBar");
        if (controlBar && !controlBar.getChild("QualityMenuButton")) {
          controlBar.addChild(
            "QualityMenuButton",
            {},
            controlBar.children().length - 1   // just before the fullscreen button
          );
        }
      });
    }

    return () => {

      playerRef.current?.dispose();
      playerRef.current = null;
    };
  }, [video]);

  // poll for HLS completion if not yet transcoded
  useEffect(() => {
    if (!video?._id || video.isTranscoded) return;

    setTranscoding(true);

    pollRef.current = setInterval(async () => {
      try {
        const status = await getVideoStatus(video._id);
        if (status.isTranscoded && status.hlsUrl) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setTranscoding(false);
          setVideo((prev) =>
            prev ? { ...prev, isTranscoded: true, hlsUrl: status.hlsUrl } : prev
          );
        }
      } catch {
        // ignore transient errors, keep polling
      }
    }, 5000);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [video?._id, video?.isTranscoded]);

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

            {/* LEFT — player + info */}
            <div className="flex-1 min-w-0">

              {/* transcoding banner */}
              {transcoding && (
                <div className="mb-3 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm px-4 py-2.5 rounded-xl">
                  <div className="w-3.5 h-3.5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  Transcoding to HLS — quality switching available shortly. Playing original in the meantime.
                </div>
              )}
              {/* player */}
              <div className="relative w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden">

                <div ref={containerRef} className="w-full h-full" />

              </div>

              {/* title */}
              <h1 className="text-white text-xl font-semibold mt-4 leading-snug">
                {video?.title}
              </h1>

              {/* views + actions */}
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
                      {icon}{label}
                    </button>
                  ))}
                </div>
              </div>

              {/* channel */}
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

              {/* description */}
              {video?.description && (
                <div className="mt-4 p-4 bg-zinc-900 rounded-xl">
                  <p className={`text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed ${!descExpanded ? "line-clamp-3" : ""}`}>
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

          </div >
        )
        }
      </main >
    </div >
  );
}
