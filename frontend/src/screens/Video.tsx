import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import VideoCard from "../components/VideoCard";
import { getVideoById, getAllVideos } from "../api/video.api";
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
  owner: {
    username: string;
    avatar: string;
  };
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
  const videoRef = useRef<HTMLVideoElement>(null);

  const [video, setVideo] = useState<VideoData | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);

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

        // exclude current video from suggestions
        const docs = allVideos?.docs ?? allVideos ?? [];
        setSuggestions(docs.filter((v: SuggestionVideo) => v._id !== videoId));
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
            {/* LEFT — video + info */}
            <div className="flex-1 min-w-0">
              {/* Video player */}
              <div className="w-full aspect-video bg-zinc-950 rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  src={video?.videoFile}
                  controls
                  autoPlay
                  className="w-full h-full"
                  controlsList="nodownload"
                >
                  Your browser does not support video playback.
                </video>
              </div>

              {/* Title */}
              <h1 className="text-white text-xl font-semibold mt-4 leading-snug">
                {video?.title}
              </h1>

              {/* Views + date + actions */}
              <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                <p className="text-zinc-400 text-sm">
                  {video?.views} views · {video && timeAgo(video.createdAt)}
                </p>

                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-full transition-colors">
                    <ThumbsUp size={16} />
                    Like
                  </button>
                  <button className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-full transition-colors">
                    <ThumbsDown size={16} />
                    Dislike
                  </button>
                  <button className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-full transition-colors">
                    <Share2 size={16} />
                    Share
                  </button>
                  <button className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-sm px-4 py-2 rounded-full transition-colors">
                    <Flag size={16} />
                    Report
                  </button>
                </div>
              </div>

              {/* Channel info */}
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
                  <div>
                    <p className="text-white font-medium text-sm">
                      {video?.owner.username}
                    </p>
                  </div>
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
