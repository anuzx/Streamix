import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import VideoCard from "../components/VideoCard";
import UploadPage from "../components/upload/UploadPage";
import { getAllVideos } from "../api/video.api";

export default function Home() {
  const location = useLocation();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const showUploadModal = location.pathname === "/upload";

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await getAllVideos();
        setVideos(data);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <Sidebar />

      <main className="pt-16 pl-64 pr-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="w-full aspect-video rounded-xl bg-zinc-800" />
                <div className="flex gap-3 mt-3">
                  <div className="w-9 h-9 rounded-full bg-zinc-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-800 rounded w-3/4" />
                    <div className="h-3 bg-zinc-800 rounded w-1/2" />
                    <div className="h-3 bg-zinc-800 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-zinc-500">
            <p className="text-lg">No videos found</p>
            <p className="text-sm mt-1">Be the first to upload one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
            {videos.map((video: any) => (
              <VideoCard key={video._id} {...video} />
            ))}
          </div>
        )}
      </main>

      {showUploadModal && <UploadPage />}
    </div>
  );
}
