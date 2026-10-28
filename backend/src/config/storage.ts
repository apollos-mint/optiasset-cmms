import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

// AWS S3 client setup
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'optiasset-cmms-assets';

/**
 * Uploads a file to Amazon S3 or fallback mock in development mode.
 * Returns the URL of the uploaded asset.
 */
export async function uploadToCloudStorage(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string> {
  const isAwsConfigured = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;

  if (!isAwsConfigured) {
    // FALLBACK DE DESARROLLO: Simula la subida y retorna un mock URL
    const cleanName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const mockUrl = `https://storage.googleapis.com/gestion-activos-mock-bucket/multimedia/${Date.now()}_${cleanName}`;
    console.log(`[Storage Mock] Archivo subido simuladamente: ${mockUrl}`);
    return mockUrl;
  }

  // Nombre de clave único en S3
  const key = `multimedia/${Date.now()}_${fileName}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await s3Client.send(command);

    // Retorna URL pública o firmada. En este caso la URL de S3 estándar
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading file to AWS S3, falling back to mock:', error);
    throw new Error('Error al subir el archivo al almacenamiento en la nube.');
  }
}
