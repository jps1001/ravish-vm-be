import multer, { MulterError } from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';
import path from 'path';
import { NextFunction } from 'express';
import { MRequest, MResponse } from '../types/express';
import { ErrorResponseSchema } from '../interfaces/apiResponse';
import { ErrorCodes } from '../constants/errorCode.enum';

// Configure the MinIO-compatible S3 client
const s3 = new S3Client({
  endpoint: process.env.MINIO_PUBLIC_URL ?? 'http://localhost:9000', // Change to your MinIO URL
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY ?? 'MINIO_ACCESS_KEY',
    secretAccessKey: process.env.MINIO_SECRET_KEY ?? 'MINIO_SECRET_KEY',
  },
  forcePathStyle: true, // Required for MinIO
})


const publicBaseUrl = process.env.MINIO_PUBLIC_URL || 'http://vehicle-management-minio-1e1db2-164-52-202-197.traefik.me';


class S3FileUploadHandler {
  private upload: multer.Multer;

  constructor(private bucketName: string) {

    const storage = multerS3({
      s3: s3,
      bucket: bucketName,
      acl: 'public-read', // Or 'private' depending on your use case
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (_req, file, cb) => {
        const filename = `${Date.now()}${path.extname(file.originalname)}`;
        cb(null, filename);
      },
    });

    this.upload = multer({ storage });
  }

  public handleFileUploads() {
    return (req: MRequest, res: MResponse, next: NextFunction) => {
      const contentType = req.headers['content-type'] || '';
      const isMultipart = contentType.startsWith('multipart/form-data');
      console.log(process.env.MINIO_PUBLIC_URL);
      console.log(process.env.MINIO_URL);
      (async () => {
        const resolvedEndpoint = await s3?.config?.endpoint!();
        console.log("Resolved S3 endpoint:", resolvedEndpoint.hostname);
      })();


      if (!isMultipart) return next();

      this.upload.any()(req, res, (err) => {
        if (err) {
          console.error('Multer S3 file upload error:', err);
          const message =
            err instanceof MulterError ? err.message : 'Unknown error occurred during S3 upload.';
          return res.status(401).json(
            ErrorResponseSchema.parse({
              message,
              error: {
                code: ErrorCodes.FILE_UPLOAD_ERROR,
              },
            })
          );
        }

        if (req.files && Array.isArray(req.files)) {
          req.files.forEach((file: any) => {
            const filename = path.basename(file.key);
            file.location = `${publicBaseUrl}/${this.bucketName}/${filename}`;

            const field = file.fieldname;
            const fileUrl = file.location; // public URL of the file in MinIO
            const parts = field.split(/[\[\]]+/).filter(Boolean);

            if (parts.length >= 3) {
              const arrayKey = parts[0];
              const index = parseInt(parts[1], 10);
              const key = parts[2];

              if (Array.isArray(req.body[arrayKey]) && req.body[arrayKey][index]) {
                req.body[arrayKey][index][key] = fileUrl;
              }
            } else {
              if (!req.body[field]) {
                req.body[field] = fileUrl;
              } else if (typeof req.body[field] === 'string') {
                req.body[field] = [req.body[field], fileUrl];
              } else if (Array.isArray(req.body[field])) {
                req.body[field].push(fileUrl);
              }
            }
          });
        }

        next();
      });
    };
  }
}

export default S3FileUploadHandler;

