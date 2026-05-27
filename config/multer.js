import multer from "multer";

const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Upload only for format Image"));
  }
};

const uploadFile = multer({ storage: storage, fileFilter: fileFilter });

export default uploadFile;
