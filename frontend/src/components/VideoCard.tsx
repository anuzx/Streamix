import { useNavigate } from "react-router-dom";

interface VideoCardProps {
  _id: string;
  thumbnail: string;
  title: string;
  views: number | string;
  createdAt: string;
  duration?: number;
  owner: {
    username: string;
    avatar: string;
  };
  variant?: "primary" | "secondary";
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

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoCard({
  _id,
  thumbnail,
  title,
  views,
  createdAt,
  duration,
  owner,
  variant = "primary",
}: VideoCardProps) {
  const navigate = useNavigate();

  if (variant === "secondary") {
    // horizontal card for recommendations sidebar
    return (
      <div
        onClick={() => navigate(`/watch?id=${_id}`)}
        className="flex gap-2 cursor-pointer group"
      >
        {/* Thumbnail */}
        <div className="relative flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden bg-zinc-800">
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {duration && duration > 0 && (
            <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
              {formatDuration(duration)}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white text-sm font-medium line-clamp-2 leading-snug">
            {title}
          </h3>
          <p
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/channel/${owner.username}`);
            }}
            className="text-zinc-400 text-xs mt-1 hover:text-white cursor-pointer"
          >
            {owner.username}
          </p>
          <p className="text-zinc-500 text-xs">
            {views} views · {timeAgo(createdAt)}
          </p>
        </div>
      </div>
    );
  }

  // primary — vertical card for home/channel/explore
  return (
    <div
      onClick={() => navigate(`/watch?id=${_id}`)}
      className="cursor-pointer group"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-800">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
        />
        {duration && duration > 0 && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex gap-3 mt-3">
        <img
          src={owner.avatar}
          alt={owner.username}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/channel/${owner.username}`);
          }}
          className="w-9 h-9 rounded-full bg-zinc-700 shrink-0 object-cover cursor-pointer hover:opacity-80"
        />
        <div>
          <h3 className="text-white font-medium line-clamp-2 text-sm">
            {title}
          </h3>
          <p
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/channel/${owner.username}`);
            }}
            className="text-sm text-zinc-400 hover:text-white cursor-pointer mt-0.5"
          >
            {owner.username}
          </p>
          <p className="text-sm text-zinc-500">
            {views} views · {timeAgo(createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
