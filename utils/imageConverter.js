import sharp from "sharp";
import fs from "fs";
import path from "path";



export const convertToWebp = async (fileBuffer, destinationFolder) => {
  const fileName = `${Date.now()}${Math.random()
    .toString(36)
    .substring(2, 8)}.webp`;

  const savePath = path.join(destinationFolder, fileName);

  const webpBuffer = await sharp(fileBuffer).webp({ quality: 80 }).toBuffer();

  fs.writeFileSync(savePath, webpBuffer);

  return savePath;
};
