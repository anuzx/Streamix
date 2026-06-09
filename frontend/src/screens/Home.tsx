import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import VideoCard from "../components/VideoCard";
import UploadPage from "../components/upload/UploadPage";

const videos = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  thumbnail: `https://picsum.photos/600/350?random=${i}`,
  title: `Building a YouTube Clone Part ${i + 1}`,
  channel: "Code Master",
  views: `${(i + 1) * 100}K`,
  uploaded: `${i + 1} days ago`,
}));

export default function Home() {

  const location = useLocation();

  const showUploadModal =
    location.pathname === "/upload";

  return (
    <div className="bg-black min-h-screen">
      <Navbar />
      <Sidebar />

      <main className="pt-16 pl-64 pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              thumbnail={video.thumbnail}
              title={video.title}
              channel={video.channel}
              views={video.views}
              uploaded={video.uploaded}
            />
          ))}
        </div>
      </main>
      {showUploadModal && <UploadPage />}
    </div>
  );
}
