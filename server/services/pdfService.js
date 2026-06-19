const pdfParse = require('pdf-parse');

/**
 * Clean and normalize extracted text.
 */
function normalizeText(text) {
    if (!text) return '';
    return text
        .replace(/\r\n/g, '\n')
        .replace(/[^\x20-\x7E\n]/g, ' ') // Remove non-printable characters
        .replace(/\n\s*\n/g, '\n')       // Remove excessive blank lines
        .replace(/[ \t]+/g, ' ')        // Normalize spaces
        .trim();
}

/**
 * Extract plain text from a PDF buffer.
 * @param {Buffer} buffer - PDF file buffer from Multer memoryStorage
 * @returns {Promise<string>} - Extracted text
 */
async function extractTextFromPDF(buffer) {
    try {
        const data = await pdfParse(buffer);
        return normalizeText(data.text);
    } catch (err) {
        throw new Error(`PDF parsing failed: ${err.message}`);
    }
}

module.exports = { extractTextFromPDF };
