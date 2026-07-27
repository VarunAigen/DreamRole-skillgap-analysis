const mongoose = require('mongoose');

let _bucket = null;

/**
 * Get or create a GridFSBucket for resume PDF storage.
 * Bucket name: 'resume_pdfs'
 * Files are stored in: resume_pdfs.files + resume_pdfs.chunks
 */
function getBucket() {
    if (_bucket) return _bucket;
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB connection not ready for GridFS');
    _bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'resume_pdfs' });
    return _bucket;
}

/**
 * Upload a resume PDF buffer to GridFS.
 * @param {string} uid - Firebase user ID (stored as metadata for lookup)
 * @param {Buffer} buffer - PDF file buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - MIME type (e.g. 'application/pdf')
 * @returns {Promise<mongoose.Types.ObjectId>} - GridFS file ID
 */
function uploadResumePdf(uid, buffer, filename, mimetype) {
    return new Promise((resolve, reject) => {
        const bucket = getBucket();
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: mimetype,
            metadata: { uid, uploadedAt: new Date() }
        });

        uploadStream.on('finish', () => resolve(uploadStream.id));
        uploadStream.on('error', reject);
        uploadStream.end(buffer);
    });
}

/**
 * Download a resume PDF from GridFS as a readable stream.
 * @param {mongoose.Types.ObjectId|string} fileId - GridFS file ID
 * @returns {import('stream').Readable} - Readable stream of the PDF
 */
function downloadResumePdf(fileId) {
    const bucket = getBucket();
    const objectId = typeof fileId === 'string'
        ? new mongoose.Types.ObjectId(fileId)
        : fileId;
    return bucket.openDownloadStream(objectId);
}

/**
 * Delete a resume PDF from GridFS.
 * @param {mongoose.Types.ObjectId|string} fileId - GridFS file ID
 * @returns {Promise<void>}
 */
async function deleteResumePdf(fileId) {
    const bucket = getBucket();
    const objectId = typeof fileId === 'string'
        ? new mongoose.Types.ObjectId(fileId)
        : fileId;
    await bucket.delete(objectId);
}

/**
 * Get file info (metadata, size, etc.) for a GridFS file.
 * @param {mongoose.Types.ObjectId|string} fileId
 * @returns {Promise<Object|null>}
 */
async function getFileInfo(fileId) {
    const bucket = getBucket();
    const objectId = typeof fileId === 'string'
        ? new mongoose.Types.ObjectId(fileId)
        : fileId;
    const cursor = bucket.find({ _id: objectId });
    const files = await cursor.toArray();
    return files.length > 0 ? files[0] : null;
}

module.exports = {
    uploadResumePdf,
    downloadResumePdf,
    deleteResumePdf,
    getFileInfo
};
