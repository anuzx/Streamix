import {
  Compass,
  History,
  Home,
  PlaySquare,
  Clock,
  ThumbsUp,
} from "lucide-react";

const items = [
  {
    icon: Home,
    label: "Home",
  },
  {
    icon: Compass,
    label: "Explore",
  },
  {
    icon: PlaySquare,
    label: "Subscriptions",
  },
  {
    icon: Clock,
    label: "Watch Later",
  },
  {
    icon: ThumbsUp,
    label: "like"
  },
  {
    icon: History,
    label: "History",

  },

];

export default function Sidebar() {
  return (
    <aside className="fixed top-14 left-0 w-60 h-[calc(100vh-56px)] bg-black border-r border-zinc-800 p-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-900 cursor-pointer text-white"
        >
          <item.icon size={22} />
          <span>{item.label}</span>
        </div>
      ))}
    </aside>
  );
}
