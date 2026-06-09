import {
  Compass, History, Home, PlaySquare,
  Clock, ThumbsUp, ListVideo
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const items = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: PlaySquare, label: "Subscriptions", path: "/subscriptions" },
  { icon: ListVideo, label: "Playlist", path: "/playlist" },
  { icon: Clock, label: "Watch Later", path: "/watch-later" },
  { icon: ThumbsUp, label: "Liked", path: "/liked" },
  { icon: History, label: "History", path: "/history" },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="fixed top-14 left-0 w-60 h-[calc(100vh-56px)] bg-black border-r border-zinc-800 p-2">
      {items.map((item) => (
        <div
          key={item.label}
          onClick={() => navigate(item.path)}
          className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-900 cursor-pointer text-white"
        >
          <item.icon size={22} />
          <span>{item.label}</span>
        </div>
      ))}
    </aside>
  );
}
