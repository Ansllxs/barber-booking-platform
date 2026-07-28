const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

async function main() {
  const brandDir = path.join(__dirname, "../public/brand");
  const input = path.join(brandDir, "logo.png");
  const output = path.join(brandDir, "logo-transparent.png");
  const finalPath = path.join(brandDir, "logo.png");
  const backup = path.join(brandDir, "logo-with-bg.png");

  // Backup original if needed
  if (!fs.existsSync(backup)) {
    fs.copyFileSync(input, backup);
  }

  const source = fs.existsSync(backup) ? backup : input;

  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = 42;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Soft edge: fade near-black
    const darkness = Math.max(r, g, b);
    if (darkness <= threshold) {
      data[i + 3] = 0;
    } else if (darkness <= threshold + 24) {
      data[i + 3] = Math.round(((darkness - threshold) / 24) * data[i + 3]);
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toFile(output);

  // Replace logo.png
  fs.copyFileSync(output, finalPath);
  console.log("OK transparent logo", info.width, "x", info.height);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
