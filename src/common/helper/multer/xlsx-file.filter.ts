export const xlsxFileFilter = (req, file, cb) => {
  if (
    file.mimetype !==
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    req.fileValidationError = new Error('Not a Xlsx File!');
    return cb(null, false);
  }
  cb(null, true);
};
