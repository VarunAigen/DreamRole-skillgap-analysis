const mongoose = require('mongoose');

/**
 * Ensures MongoDB is connected (readyState === 1) and returns the native DB instance.
 * If connecting (readyState === 2), waits up to 5 seconds for the connection to open.
 */
async function getDb() {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
        return mongoose.connection.db;
    }

    if (mongoose.connection.readyState === 2) {
        await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000);
            mongoose.connection.once('connected', () => {
                clearTimeout(timer);
                resolve();
            });
            mongoose.connection.once('error', (err) => {
                clearTimeout(timer);
                reject(err);
            });
        });
        if (mongoose.connection.db) return mongoose.connection.db;
    }

    throw new Error('MongoDB connection is not established. Please check MONGO_URI.');
}

/**
 * Get a GridFSBucket instance for the 'resume_pdfs' bucket.
 */
async function getBucket() {
    const db = await getDb();
    return new mongoose.mongo.GridFSBucket(db, { bucketName: 'resume_pdfs' });
}

/**
 * Upload a resume PDF buffer to GridFS.
 * @param {string} uid - Firebase user ID (stored as metadata for lookup)
 * @param {Buffer} buffer - PDF file buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - MIME type (e.g. 'application/pdf')
 * @returns {Promise<mongoose.Types.ObjectId>} - GridFS file ID
 */
async function uploadResumePdf(uid, buffer, filename, mimetype) {
    const bucket = await getBucket();
    return new Promise((resolve, reject) => {
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
 * @returns {Promise<import('stream').Readable>} - Readable stream of the PDF
 */
async function downloadResumePdf(fileId) {
    const bucket = await getBucket();
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
    try {
        const bucket = await getBucket();
        const objectId = typeof fileId === 'string'
            ? new mongoose.Types.ObjectId(fileId)
            : fileId;
        await bucket.delete(objectId);
    } catch (err) {
        console.warn('[GridFS] deleteResumePdf warning:', err.message);
    }
}

/**
 * Get file info (metadata, size, etc.) for a GridFS file.
 * @param {mongoose.Types.ObjectId|string} fileId
 * @returns {Promise<Object|null>}
 */
async function getFileInfo(fileId) {
    try {
        const bucket = await getBucket();
        const objectId = typeof fileId === 'string'
            ? new mongoose.Types.ObjectId(fileId)
            : fileId;
        const cursor = bucket.find({ _id: objectId });
        const files = await cursor.toArray();
        return files.length > 0 ? files[0] : null;
    } catch (err) {
        return null;
    }
}

module.exports = {
    uploadResumePdf,
    downloadResumePdf,
    deleteResumePdf,
    getFileInfo
};
