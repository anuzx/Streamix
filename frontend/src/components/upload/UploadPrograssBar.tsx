
type Props = { progress: number };

export default function UploadProgressBar({ progress }: Props) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span>Uploading video...</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
