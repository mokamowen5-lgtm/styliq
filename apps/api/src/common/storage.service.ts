import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { createHash } from "crypto"
import { promises as fs } from "fs"
import path from "path"
import sharp from "sharp"

@Injectable()
export class StorageService {
  private readonly s3: S3Client | null
  private readonly bucket: string
  private readonly cdnUrl: string
  private readonly localUploadsDir: string
  private readonly localPublicUrl: string
  private readonly logger = new Logger(StorageService.name)

  constructor(private config: ConfigService) {
    const accessKey = config.get<string>("storage.awsAccessKeyId")
    const secretKey = config.get<string>("storage.awsSecretAccessKey")

    if (accessKey && secretKey) {
      this.s3 = new S3Client({
        region: config.get<string>("storage.awsRegion", "eu-west-1"),
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      })
      this.logger.log("AWS S3 configured")
    } else {
      this.s3 = null
      this.logger.warn("AWS S3 not configured — falling back to local filesystem (./uploads)")
    }

    this.bucket = config.get<string>("storage.awsS3Bucket", "stylesnap-media")
    this.cdnUrl = config.get<string>("storage.cdnUrl", "")

    // Local fallback for dev
    this.localUploadsDir = path.join(process.cwd(), "uploads")
    const apiPort = config.get<number>("app.port", 4000)
    this.localPublicUrl = `http://localhost:${apiPort}/uploads`
  }

  async uploadImage(
    buffer: Buffer,
    options: {
      folder: string
      userId: string
      mimeType?: string
      maxWidth?: number
      quality?: number
    }
  ): Promise<{ url: string; key: string; thumbnailUrl: string; thumbnailKey: string }> {
    const { folder, userId, mimeType = "image/webp", maxWidth = 2048, quality = 85 } = options

    // Optimize with sharp
    const optimized = await sharp(buffer)
      .resize(maxWidth, maxWidth, { fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer()

    const thumbnail = await sharp(buffer)
      .resize(400, 400, { fit: "cover" })
      .webp({ quality: 75 })
      .toBuffer()

    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 12)
    const timestamp = Date.now()
    const key = `${folder}/${userId}/${timestamp}-${hash}.webp`
    const thumbnailKey = `${folder}/${userId}/thumb-${timestamp}-${hash}.webp`

    if (this.s3) {
      // Production / configured S3 path
      await Promise.all([
        this.s3.send(new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: optimized,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000",
          Metadata: { userId, folder },
        })),
        this.s3.send(new PutObjectCommand({
          Bucket: this.bucket,
          Key: thumbnailKey,
          Body: thumbnail,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000",
        })),
      ])

      return {
        url: this.getPublicUrl(key),
        key,
        thumbnailUrl: this.getPublicUrl(thumbnailKey),
        thumbnailKey,
      }
    }

    // Local filesystem fallback (dev only)
    const fullPath = path.join(this.localUploadsDir, key)
    const thumbPath = path.join(this.localUploadsDir, thumbnailKey)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.mkdir(path.dirname(thumbPath), { recursive: true })
    await Promise.all([
      fs.writeFile(fullPath, optimized),
      fs.writeFile(thumbPath, thumbnail),
    ])

    return {
      url: `${this.localPublicUrl}/${key}`,
      key,
      thumbnailUrl: `${this.localPublicUrl}/${thumbnailKey}`,
      thumbnailKey,
    }
  }

  async uploadRaw(
    buffer: Buffer,
    key: string,
    contentType: string
  ): Promise<string> {
    if (this.s3) {
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=86400",
      }))
      return this.getPublicUrl(key)
    }
    const fullPath = path.join(this.localUploadsDir, key)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, buffer)
    return `${this.localPublicUrl}/${key}`
  }

  async getPresignedUploadUrl(key: string, contentType: string): Promise<string> {
    if (!this.s3) throw new Error("S3 not configured — cannot generate presigned URL in dev")
    return getSignedUrl(
      this.s3,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: contentType }),
      { expiresIn: 300 }
    )
  }

  async delete(key: string): Promise<void> {
    if (this.s3) {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
    } else {
      const fullPath = path.join(this.localUploadsDir, key)
      await fs.unlink(fullPath).catch(() => {})
    }
  }

  private getPublicUrl(key: string): string {
    return this.cdnUrl
      ? `${this.cdnUrl}/${key}`
      : `https://${this.bucket}.s3.amazonaws.com/${key}`
  }
}
