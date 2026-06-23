const { extractTextFromPDF } = require('../services/pdfService');
const upload = require('../utils/multerConfig');
const UserProfile = require('../models/UserProfile');

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

            // Save PDF data and text to the database if authenticated (unless sessionOnly is requested)
            if (req.user && req.user.uid && req.query.sessionOnly !== 'true') {
                const base64Data = req.file.buffer.toString('base64');
                await UserProfile.findOneAndUpdate(
                    { uid: req.user.uid },
                    {
                        $set: {
                            resume_pdf_data: base64Data,
                            resume_pdf_name: req.file.originalname,
                            resume_pdf_mime: req.file.mimetype,
                            resume_text: resume_text
                        }
                    },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
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
