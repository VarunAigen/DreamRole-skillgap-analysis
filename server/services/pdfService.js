const pdfParse = require('pdf-parse');

/**
 * Extract plain text from a PDF buffer.
 * @param {Buffer} buffer - PDF file buffer from Multer memoryStorage
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromPDF(buffer) {
    try {
        const data = await pdfParse(buffer);
        return data.text || '';
    } catch (err) {
        throw new Error(`PDF parsing failed: ${err.message}`);
    }
}

module.exports = { extractTextFromPDF };
