const { extractTextFromPDF } = require('../services/pdfService');
const upload = require('../utils/multerConfig');

const uploadResume = [
    upload.single('resume'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No PDF file uploaded. Use field name "resume".' });
            }

            const resume_text = await extractTextFromPDF(req.file.buffer);

            if (!resume_text || resume_text.trim().length < 50) {
                return res.status(422).json({ error: 'Could not extract meaningful text from the PDF. Please try a different file.' });
            }

            res.json({
                success: true,
                filename: req.file.originalname,
                resume_text,
                char_count: resume_text.length
            });
        } catch (err) {
            console.error('Resume upload error:', err.message);
            res.status(500).json({ error: err.message });
        }
    }
];

module.exports = { uploadResume };
