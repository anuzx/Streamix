import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getChannelProfile } from "../api/users.api";
import { getChannelVideos } from "../api/video.api";

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

export default function Channel() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ChannelProfile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {profile?.coverImage && (
        <img
          src={profile.coverImage}
          alt="cover"
          className="w-full h-40 object-cover"
        />
      )}

      <div className="flex items-center gap-4 p-6 border-b">
        <img
          src={profile?.avatar}
          alt={username}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div>
          <h1 className="text-xl font-bold">{profile?.fullName}</h1>
          <p className="text-gray-500 text-sm">@{username}</p>
          <p className="text-gray-500 text-sm">
            {profile?.subscribersCount} subscribers · {videos.length} videos
          </p>
        </div>
      </div>

      <div className="p-6">
        {videos.length === 0 ? (
          <p className="text-gray-500 text-center mt-16">No videos yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div
                key={video._id}
                onClick={() => navigate(`/watch?id=${video._id}`)}
                className="cursor-pointer rounded-lg overflow-hidden border hover:shadow-md transition-shadow"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-44 object-cover"
                />
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">
                    {video.views} views ·{" "}
                    {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
