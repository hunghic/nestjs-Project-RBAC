export const imageFileFilter = (req, file, cb) => {
  if (!/^image\/.+$/.test(file.mimetype)) {
    req.fileValidationError = new Error('Not a Image File!');
    return cb(null, false);
  }
  cb(null, true);
};
