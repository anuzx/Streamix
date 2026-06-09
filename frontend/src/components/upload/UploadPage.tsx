import { useRef, useState } from "react";
import { X, ImageIcon, Video, Upload } from "lucide-react";
import { useVideoUpload } from "../../hooks/useVideoUpload";
import UploadProgressBar from "../../components/upload/UploadPrograssBar";
import { useUploadStore } from "../../store/uploadStore";

export default function UploadPage() {
  const { closeUpload } = useUploadStore();

  const { upload, progress, status, error } = useVideoUpload();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!videoFile || !thumbnail) return;

    await upload({
      title,
      description,
      videoFile,
      thumbnail,
    });
  }

  const isLoading =
    status === "uploading" || status === "publishing";

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="h-16 px-6 border-b border-zinc-800 flex items-center justify-between">
          <h2 className="text-white text-xl font-semibold">
            Upload Video
          </h2>

          <button className="p-2 rounded-full hover:bg-zinc-800"
            onClick={closeUpload}>
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 flex flex-col gap-6"
        >
          {/* Title */}
          <div>
            <label className="text-sm text-zinc-400 block mb-2">
              Title
            </label>

            <input
              type="text"
              placeholder="Add a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-zinc-600"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-zinc-400 block mb-2">
              Description
            </label>

            <textarea
              placeholder="Tell viewers about your video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-32 resize-none bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-zinc-600"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {/* Video Upload */}
            <div
              onClick={() => videoInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-700 rounded-2xl h-56 flex flex-col items-center justify-center cursor-pointer hover:border-zinc-500 transition"
            >
              <Video
                size={40}
                className="text-zinc-500 mb-3"
              />

              {videoFile ? (
                <>
                  <p className="text-green-500 font-medium">
                    Video Selected
                  </p>

                  <p className="text-zinc-400 text-sm mt-1">
                    {videoFile.name}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-white">
                    Select Video
                  </p>

                  <p className="text-zinc-500 text-sm">
                    MP4, MOV, AVI...
                  </p>
                </>
              )}

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) =>
                  setVideoFile(
                    e.target.files?.[0] ?? null
                  )
                }
              />
            </div>

            {/* Thumbnail Upload */}
            <div
              onClick={() =>
                thumbnailInputRef.current?.click()
              }
              className="border-2 border-dashed border-zinc-700 rounded-2xl h-56 flex items-center justify-center cursor-pointer overflow-hidden hover:border-zinc-500 transition"
            >
              {thumbnail ? (
                <img
                  src={URL.createObjectURL(thumbnail)}
                  alt="Thumbnail"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <ImageIcon
                    size={40}
                    className="text-zinc-500 mb-3"
                  />

                  <p className="text-white">
                    Select Thumbnail
                  </p>

                  <p className="text-zinc-500 text-sm">
                    JPG, PNG, WEBP
                  </p>
                </div>
              )}

              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  setThumbnail(
                    e.target.files?.[0] ?? null
                  )
                }
              />
            </div>
          </div>

          {/* Progress */}
          {status === "uploading" && (
            <UploadProgressBar progress={progress} />
          )}

          {status === "publishing" && (
            <p className="text-zinc-400">
              Saving video...
            </p>
          )}

          {status === "done" && (
            <p className="text-green-500 font-medium">
              Video published successfully.
            </p>
          )}

          {status === "error" && (
            <p className="text-red-500">{error}</p>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="px-5 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-white"
              onClick={closeUpload}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isLoading ||
                !videoFile ||
                !thumbnail
              }
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
            >
              <Upload size={18} />
              {isLoading
                ? "Uploading..."
                : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
