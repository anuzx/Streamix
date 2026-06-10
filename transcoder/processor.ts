import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";

export const RESOLUTIONS = [
  { name: "360p", width: 640, height: 360, bitrate: "800k" },
  { name: "720p", width: 1280, height: 720, bitrate: "2500k" },
  { name: "1080p", width: 1920, height: 1080, bitrate: "5000k" },
];

export async function transcodeToHLS(
  originalUrl: string,
  tmpDir: string
): Promise<string> {
  fs.mkdirSync(tmpDir, { recursive: true });

  // transcode each resolution
  for (const res of RESOLUTIONS) {
    const outputDir = path.join(tmpDir, res.name);
    fs.mkdirSync(outputDir, { recursive: true });

    await new Promise<void>((resolve, reject) => {
      ffmpeg(originalUrl)
        .outputOptions([
          `-vf scale=${res.width}:${res.height}`,
          `-b:v ${res.bitrate}`,
          `-c:v h264`,
          `-c:a aac`,
          `-hls_time 6`,
          `-hls_playlist_type vod`,
          `-hls_segment_filename ${outputDir}/segment_%03d.ts`,
        ])
        .output(`${outputDir}/index.m3u8`)
        .on("start", (cmd) => console.log(`[${res.name}] FFmpeg started`))
        .on("progress", (p) => console.log(`[${res.name}] ${Math.floor(p.percent ?? 0)}%`))
        .on("end", () => { console.log(`[${res.name}] done`); resolve(); })
        .on("error", (err) => { console.error(`[${res.name}] error:`, err); reject(err); })
        .run();
    });
  }

  // generate master playlist
  const masterContent = [
    "#EXTM3U",
    ...RESOLUTIONS.map(r =>
      `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(r.bitrate) * 1000},RESOLUTION=${r.width}x${r.height}\n${r.name}/index.m3u8`
    ),
  ].join("\n");

  const masterPath = path.join(tmpDir, "master.m3u8");
  fs.writeFileSync(masterPath, masterContent);

  return masterPath;
}
