const multer = require('multer');

const uploader = multer({ limits: { fieldSize: '500mb' } });

module.exports = ({ app }) => {
  app.post('/media', uploader.single('file'), async (req, res) => {
    const { body, file } = req;
    res.json({
      ciphertext: body.ciphertext,
      fieldname: file.fieldname,
      filename: file.originalname,
    });
  });
};
