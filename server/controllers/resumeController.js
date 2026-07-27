const { extractTextFromPDF } = require('../services/pdfService');
const upload = require('../utils/multerConfig');
const UserProfile = require('../models/UserProfile');
const { uploadResumePdf, deleteResumePdf } = require('../utils/gridfsStorage');

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

            // Save PDF to GridFS and store reference in user profile if user is authenticated
            if (req.user && req.user.uid && req.query.sessionOnly !== 'true') {
                try {
                    // Upload to GridFS
                    const fileId = await uploadResumePdf(
                        req.user.uid,
                        req.file.buffer,
                        req.file.originalname,
                        req.file.mimetype
                    );

                    // Delete old GridFS file if one exists
                    const existingProfile = await UserProfile.findOne({ uid: req.user.uid });
                    if (existingProfile && existingProfile.resume_pdf_file_id) {
                        await deleteResumePdf(existingProfile.resume_pdf_file_id);
                    }

                    await UserProfile.findOneAndUpdate(
                        { uid: req.user.uid },
                        {
                            $set: {
                                resume_pdf_file_id: fileId,
                                resume_pdf_data: '',           // Clear legacy base64 storage
                                resume_pdf_name: req.file.originalname,
                                resume_pdf_mime: req.file.mimetype,
                                resume_text: resume_text
                            }
                        },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                } catch (dbErr) {
                    console.warn('[ResumeUpload] Could not persist to DB/GridFS:', dbErr.message);
                }
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
