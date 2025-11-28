import sharp from "sharp";
import fs from "fs";
import path from "path";

const generateDateFilename = () => {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `${day}${month}${year}${hours}${minutes}${seconds}.webp`;
};

export const convertToWebp = async (fileBuffer, destinationFolder) => {
  const fileName = generateDateFilename();
  const savePath = path.join(destinationFolder, fileName);

  const webpBuffer = await sharp(fileBuffer)
    .webp({ quality: 80 })
    .toBuffer();

  fs.writeFileSync(savePath, webpBuffer);

  return savePath;
};
