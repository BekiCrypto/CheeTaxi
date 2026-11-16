import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { db } from '../db/database.js';

export interface PresignedUploadUrlResult {
  uploadUrl: string;
  fileKey: string;
  expiresAt: number;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  signature: string;
}

export interface PresignedDownloadUrlResult {
  downloadUrl: string;
  fileKey: string;
  expiresAt: number;
  signature: string;
}

const STORAGE_SECRET = process.env.STORAGE_SIGNING_SECRET || 'chebelew_media_sec_2026_9882a';
const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_DOC_SIZE_BYTES = 10 * 1024 * 1024;  // 10 MB

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export class StorageService {
  private static storageDir = path.resolve(process.cwd(), 'uploads_secure');

  static init() {
    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true, mode: 0o700 });
      } catch (e) {}
    }

    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS media_documents (
          id TEXT PRIMARY KEY,
          owner_id TEXT NOT NULL,
          owner_type TEXT NOT NULL, -- 'driver' | 'user' | 'support'
          category TEXT NOT NULL,   -- 'driver_license' | 'libri' | 'bolo' | 'profile_photo' | 'fayda_id'
          file_name TEXT NOT NULL,
          mime_type TEXT NOT NULL,
          file_size_bytes INTEGER NOT NULL,
          storage_key TEXT NOT NULL,
          is_verified INTEGER NOT NULL DEFAULT 0,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_media_owner ON media_documents(owner_id, category);
      `);
    } catch (e) {}
  }

  /**
   * Generates a tamper-proof short-lived signed upload URL (15 min TTL)
   */
  static generatePresignedUploadUrl(
    ownerId: string,
    ownerType: 'driver' | 'user' | 'support',
    category: string,
    mimeType: string,
    fileExtension: string
  ): PresignedUploadUrlResult {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(`Unsupported MIME type '${mimeType}'. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    const maxSizeBytes = mimeType === 'application/pdf' ? MAX_DOC_SIZE_BYTES : MAX_PHOTO_SIZE_BYTES;
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeExt = fileExtension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
    const fileKey = `${ownerType}/${ownerId}/${category}_${randomHex}.${safeExt}`;

    const dataToSign = `${fileKey}:${mimeType}:${maxSizeBytes}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', STORAGE_SECRET).update(dataToSign).digest('hex');

    const uploadUrl = `/api/media/upload?key=${encodeURIComponent(fileKey)}&mime=${encodeURIComponent(mimeType)}&maxSize=${maxSizeBytes}&expires=${expiresAt}&sig=${signature}`;

    return {
      uploadUrl,
      fileKey,
      expiresAt,
      maxSizeBytes,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      signature,
    };
  }

  /**
   * Verifies an upload URL signature and constraints
   */
  static verifyUploadSignature(
    fileKey: string,
    mimeType: string,
    maxSizeBytes: number,
    expiresAt: number,
    signature: string
  ): boolean {
    if (Date.now() > expiresAt) {
      return false; // Expired
    }

    const dataToSign = `${fileKey}:${mimeType}:${maxSizeBytes}:${expiresAt}`;
    const expected = crypto.createHmac('sha256', STORAGE_SECRET).update(dataToSign).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch (e) {
      return false;
    }
  }

  /**
   * Generates a short-lived signed download URL (10 min TTL) for authorized viewing of private KYC docs
   */
  static generatePresignedDownloadUrl(fileKey: string, ttlMs = 10 * 60 * 1000): PresignedDownloadUrlResult {
    const expiresAt = Date.now() + ttlMs;
    const dataToSign = `${fileKey}:${expiresAt}`;
    const signature = crypto.createHmac('sha256', STORAGE_SECRET).update(dataToSign).digest('hex');

    const downloadUrl = `/api/media/download?key=${encodeURIComponent(fileKey)}&expires=${expiresAt}&sig=${signature}`;

    return {
      downloadUrl,
      fileKey,
      expiresAt,
      signature,
    };
  }

  /**
   * Verifies a download URL signature
   */
  static verifyDownloadSignature(fileKey: string, expiresAt: number, signature: string): boolean {
    if (Date.now() > expiresAt) return false;

    const dataToSign = `${fileKey}:${expiresAt}`;
    const expected = crypto.createHmac('sha256', STORAGE_SECRET).update(dataToSign).digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
    } catch (e) {
      return false;
    }
  }

  /**
   * Save an uploaded document record to the database
   */
  static recordUploadedDocument(data: {
    id: string;
    ownerId: string;
    ownerType: 'driver' | 'user' | 'support';
    category: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    storageKey: string;
  }) {
    db.prepare(`
      INSERT INTO media_documents (
        id, owner_id, owner_type, category, file_name, mime_type, file_size_bytes, storage_key, is_verified, created_at
      ) VALUES (
        @id, @ownerId, @ownerType, @category, @fileName, @mimeType, @fileSizeBytes, @storageKey, 1, @createdAt
      )
    `).run({
      ...data,
      createdAt: new Date().toISOString(),
    });
  }

  static getStoragePath(fileKey: string): string {
    return path.join(this.storageDir, path.normalize(fileKey).replace(/^(\.\.[\/\\])+/, ''));
  }
}

// Auto-initialize storage
StorageService.init();
