import { cloudinary } from "shared";
import fs from "fs";
import path from "path";

export async function uploadHLSToCloudinary(
  tmpDir: string,
  videoId: string
): Promise<string> {
  const folder = `hls/${videoId}`;

  // upload all .ts segment files + .m3u8 playlists
  const uploadFile = async (filePath: string, publicId: string) => {
    return cloudinary.uploader.upload(filePath, {
      resource_type: "raw",
      public_id: publicId,
      folder,
      overwrite: true,
    });
  };

  // walk through tmpDir and upload everything
  const walkAndUpload = async (dir: string, baseFolder: string) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walkAndUpload(fullPath, `${baseFolder}/${entry.name}`);
      } else {
        const publicId = `${baseFolder}/${entry.name}`;
        await uploadFile(fullPath, publicId);
        console.log(`Uploaded: ${publicId}`);
      }
    }
  };

  await walkAndUpload(tmpDir, folder);

  // return the master playlist URL
  const masterResult = await cloudinary.api.resource(
    `${folder}/master.m3u8`,
    { resource_type: "raw" }
  );

  return masterResult.secure_url;
}

export async function deleteOriginalFromCloudinary(publicId: string) {
  await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
  console.log(`Deleted original: ${publicId}`);
}
