import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StorageService } from '../services/storageService.js';

export const mediaRouter = Router();

/**
 * Request a short-lived presigned upload URL for documents/media
 */
mediaRouter.post('/presign-upload', (req, res) => {
  const { ownerId, ownerType = 'driver', category, mimeType, fileExtension = 'jpg' } = req.body;

  if (!ownerId || !category || !mimeType) {
    return res.status(400).json({ error: 'ownerId, category, and mimeType are required' });
  }

  try {
    const result = StorageService.generatePresignedUploadUrl(
      ownerId,
      ownerType,
      category,
      mimeType,
      fileExtension
    );
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * Direct file upload handler via signed URL
 */
mediaRouter.put('/upload', (req, res) => {
  const key = req.query.key as string;
  const mime = req.query.mime as string;
  const maxSize = parseInt(req.query.maxSize as string, 10);
  const expires = parseInt(req.query.expires as string, 10);
  const sig = req.query.sig as string;

  if (!key || !mime || !maxSize || !expires || !sig) {
    return res.status(400).json({ error: 'Missing signed upload parameters' });
  }

  const isValid = StorageService.verifyUploadSignature(key, mime, maxSize, expires, sig);
  if (!isValid) {
    return res.status(403).json({ error: 'Invalid or expired upload signature' });
  }

  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > maxSize) {
    return res.status(413).json({ error: `File size exceeds allowed limit of ${maxSize} bytes` });
  }

  const destinationPath = StorageService.getStoragePath(key);
  const dir = path.dirname(destinationPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  const writeStream = fs.createWriteStream(destinationPath);
  let bytesWritten = 0;

  req.on('data', (chunk) => {
    bytesWritten += chunk.length;
    if (bytesWritten > maxSize) {
      req.pause();
      writeStream.destroy();
      try { fs.unlinkSync(destinationPath); } catch (e) {}
      return res.status(413).json({ error: 'Upload aborted: size limit exceeded' });
    }
  });

  req.pipe(writeStream);

  writeStream.on('finish', () => {
    const keyParts = key.split('/');
    const ownerType = (keyParts[0] || 'driver') as any;
    const ownerId = keyParts[1] || 'unknown';
    const fileName = path.basename(key);

    StorageService.recordUploadedDocument({
      id: `doc_${uuidv4().substring(0, 8)}`,
      ownerId,
      ownerType,
      category: fileName.split('_')[0],
      fileName,
      mimeType: mime,
      fileSizeBytes: bytesWritten,
      storageKey: key,
    });

    return res.json({
      success: true,
      fileKey: key,
      bytesWritten,
      message: 'Document uploaded and verified securely',
    });
  });

  writeStream.on('error', (err) => {
    return res.status(500).json({ error: 'File upload storage error', details: err.message });
  });
});

/**
 * Request signed download URL for private KYC documents
 */
mediaRouter.post('/presign-download', (req, res) => {
  const { fileKey } = req.body;
  if (!fileKey) {
    return res.status(400).json({ error: 'fileKey is required' });
  }

  const result = StorageService.generatePresignedDownloadUrl(fileKey);
  return res.json(result);
});

/**
 * Download private media using short-lived signed URL
 */
mediaRouter.get('/download', (req, res) => {
  const key = req.query.key as string;
  const expires = parseInt(req.query.expires as string, 10);
  const sig = req.query.sig as string;

  if (!key || !expires || !sig) {
    return res.status(400).json({ error: 'Missing signed download parameters' });
  }

  const isValid = StorageService.verifyDownloadSignature(key, expires, sig);
  if (!isValid) {
    return res.status(403).json({ error: 'Invalid or expired media access token' });
  }

  const filePath = StorageService.getStoragePath(key);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, max-age=600');
  return res.sendFile(filePath);
});
