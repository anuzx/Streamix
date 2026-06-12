import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import VideoCard from "../components/VideoCard";
import { getAllVideos } from "../api/video.api";

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);

  const fetchVideos = useCallback(
    async (pageNumber: number) => {
      try {
        if (pageNumber === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await getAllVideos(pageNumber, 12);

        setVideos((prev) => [...prev, ...response.docs]);

        setHasMore(response.hasNextPage);
      } catch (error) {
        console.error("Failed to fetch videos:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchVideos(1);
  }, [fetchVideos]);

  const lastVideoRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return;

      if (observer.current) {
        observer.current.disconnect();
      }

      observer.current = new IntersectionObserver((entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore
        ) {
          const nextPage = page + 1;

          setPage(nextPage);
          fetchVideos(nextPage);
        }
      });

      if (node) {
        observer.current.observe(node);
      }
    },
    [hasMore, loadingMore, page, fetchVideos]
  );

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
            <p className="text-sm mt-1">
              Be the first to upload one!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
              {videos.map((video, index) => {
                if (index === videos.length - 1) {
                  return (
                    <div
                      key={video._id}
                      ref={lastVideoRef}
                    >
                      <VideoCard {...video} />
                    </div>
                  );
                }

                return (
                  <VideoCard
                    key={video._id}
                    {...video}
                  />
                );
              })}
            </div>

            {loadingMore && (
              <div className="flex justify-center py-8 text-zinc-400">
                Loading more videos...
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
