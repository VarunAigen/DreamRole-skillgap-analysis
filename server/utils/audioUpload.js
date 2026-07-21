const multer = require('multer');

// Memory storage — file buffer available as req.file.buffer
const storage = multer.memoryStorage();

const audioFilter = (req, file, cb) => {
    // Accept audio MIME types
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm' || file.mimetype === 'application/octet-stream') {
        cb(null, true);
    } else {
        cb(new Error('Only audio files are allowed'), false);
    }
};

const audioUpload = multer({
    storage,
    fileFilter: audioFilter,
    limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
});

module.exports = audioUpload;
