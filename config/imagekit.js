import ImageKit from "@imagekit/nodejs";
import "dotenv/config";
const ImageKitStorage = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
});

export default ImageKitStorage;
