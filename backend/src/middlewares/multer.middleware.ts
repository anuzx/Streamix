import multer from "multer";

//its a middleware as where ever we will req to upload a file ,we will use it

//check multer documentation for code 

const storage = multer.diskStorage({
  destination: function(_req, _file, cb) {
    cb(null, "./backend/public/temp");
  },
  filename: function(_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.originalname + "-" + uniqueSuffix);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 4 * 1024 * 1024,
  },
  fileFilter(_req, file, cb) {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

