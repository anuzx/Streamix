interface VideoCardProps {
  thumbnail: string;
  title: string;
  channel: string;
  views: string;
  uploaded: string;
}

export default function VideoCard({
  thumbnail,
  title,
  channel,
  views,
  uploaded,
}: VideoCardProps) {
  return (
    <div className="cursor-pointer">
      <img
        src={thumbnail}
        alt={title}
        className="w-full aspect-video object-cover rounded-xl"
      />

      <div className="flex gap-3 mt-3">
        <div className="w-9 h-9 rounded-full bg-zinc-700 shrink-0" />

        <div>
          <h3 className="text-white font-medium line-clamp-2">
            {title}
          </h3>

          <p className="text-sm text-zinc-400">
            {channel}
          </p>

          <p className="text-sm text-zinc-400">
            {views} views • {uploaded}
          </p>
        </div>
      </div>
    </div>
  );
}
