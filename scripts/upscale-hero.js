const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

async function main() {
  const input = path.join(__dirname, "../public/gallery/01-kaled.png");
  const outJpg = path.join(__dirname, "../public/gallery/hero-kaled.jpg");
  const outWebp = path.join(__dirname, "../public/gallery/hero-kaled.webp");

  const meta = await sharp(input).metadata();
  console.log("source", meta.width, meta.height, meta.format);

  // Upscale ~2.2x with high-quality kernel for full-bleed displays
  const targetWidth = 1920;
  const targetHeight = Math.round((targetWidth / meta.width) * meta.height);

  const pipeline = sharp(input)
    .resize(targetWidth, targetHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: "fill",
    })
    .sharpen({ sigma: 0.6 });

  await pipeline
    .clone()
    .jpeg({ quality: 95, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(outJpg);

  await sharp(input)
    .resize(targetWidth, targetHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: "fill",
    })
    .sharpen({ sigma: 0.6 })
    .webp({ quality: 92 })
    .toFile(outWebp);

  console.log(
    "wrote",
    Math.round(fs.statSync(outJpg).size / 1024) + "KB jpg",
    Math.round(fs.statSync(outWebp).size / 1024) + "KB webp",
    `${targetWidth}x${targetHeight}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
