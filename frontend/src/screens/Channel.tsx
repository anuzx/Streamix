// src/screens/Channel.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getChannelProfile } from "../api/users.api";
import { getChannelVideos } from "../api/video.api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { LayoutDashboard } from "lucide-react";
import { useAuthStore } from "../store/authStore";

type ChannelProfile = {
  _id: string;
  username: string;
  fullName: string;
  avatar: string;
  coverImage: string;
  subscribersCount: number;
  isSubscribed: boolean;
};

type Video = {
  _id: string;
  title: string;
  thumbnail: string;
  duration: number;
  views: number;
  createdAt: string;
};

type Tab = "videos" | "playlists" | "posts";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

export default function Channel() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: loggedInUser } = useAuthStore();

  const [profile, setProfile] = useState<ChannelProfile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("videos");

  const isOwnChannel = loggedInUser?.username === username;

  useEffect(() => {
    if (!username) return;

    async function fetchChannelData() {
      try {
        setLoading(true);
        const profileData = await getChannelProfile(username!);
        setProfile(profileData);
        const videosData = await getChannelVideos(profileData._id);
        setVideos(videosData);
      } catch (err: any) {
        setError(err.message ?? "Failed to load channel");
      } finally {
        setLoading(false);
      }
    }

    fetchChannelData();
  }, [username]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "videos", label: "Videos" },
    { key: "playlists", label: "Playlists" },
    { key: "posts", label: "Posts" },
  ];

  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <Sidebar />

      <main className="pt-14 pl-60">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-zinc-600 border-t-red-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <>
            {/* Cover image */}
            <div className="w-full h-44 bg-zinc-900">
              {profile?.coverImage ? (
                <img
                  src={profile.coverImage}
                  alt="cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-900" />
              )}
            </div>

            {/* Channel info */}
            <div className="px-8 py-5 border-b border-zinc-800">
              <div className="flex items-end gap-5">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full overflow-hidden bg-zinc-700 flex items-center justify-center flex-shrink-0 -mt-6 ring-4 ring-black">
                  {profile?.avatar ? (
                    <img
                      src={profile.avatar}
                      alt={username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" fill="#9ca3af" className="w-12 h-12">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  )}
                </div>

                {/* Name + stats + buttons */}
                <div className="flex-1 flex items-end justify-between pb-1">
                  <div>
                    <h1 className="text-white text-2xl font-bold">
                      {profile?.fullName}
                    </h1>
                    <p className="text-zinc-400 text-sm mt-0.5">@{username}</p>
                    <p className="text-zinc-500 text-sm mt-1">
                      {profile?.subscribersCount ?? 0} subscribers ·{" "}
                      {videos.length} videos
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {isOwnChannel && (
                      <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors"
                      >
                        <LayoutDashboard size={16} />
                        Dashboard
                      </button>
                    )}
                    {!isOwnChannel && (
                      <button className="bg-white hover:bg-zinc-200 text-black text-sm font-semibold px-5 py-2 rounded-full transition-colors">
                        {profile?.isSubscribed ? "Subscribed" : "Subscribe"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mt-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-2 text-sm font-medium rounded-full transition-colors ${activeTab === tab.key
                        ? "bg-white text-black"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="px-8 py-6">
              {/* VIDEOS TAB */}
              {activeTab === "videos" && (
                <>
                  {videos.length === 0 ? (
                    <EmptyState message="No videos uploaded yet" />
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {videos.map((video) => (
                        <div
                          key={video._id}
                          onClick={() => navigate(`/watch?id=${video._id}`)}
                          className="cursor-pointer group"
                        >
                          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-800">
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                            {video.duration > 0 && (
                              <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                                {formatDuration(video.duration)}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 px-1">
                            <h3 className="text-white text-sm font-medium line-clamp-2 leading-snug">
                              {video.title}
                            </h3>
                            <p className="text-zinc-500 text-xs mt-1">
                              {video.views} views · {timeAgo(video.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* PLAYLISTS TAB */}
              {activeTab === "playlists" && (
                <EmptyState message="No playlists created yet" />
              )}

              {/* POSTS TAB */}
              {activeTab === "posts" && (
                <EmptyState message="No posts yet" />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-zinc-600">
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12 mb-3">
        <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" />
      </svg>
      <p className="text-sm">{message}</p>
    </div>
  );
}
