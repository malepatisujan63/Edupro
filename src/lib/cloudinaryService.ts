// src/lib/cloudinaryService.ts
// ─── Koinexa Zero-Lag Cloudinary CDN & Media Streaming Engine ($O(1)$ Memory) ───
// Eliminates base64 DOM memory bloat and network lag by streaming videos & photos
// directly to Cloudinary global edge CDNs with automatic compression.

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
  bytes: number;
}

// Unsigned Cloudinary configuration (reads from .env or defaults to Koinexa demo CDN)
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dxkufsejm';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'edunetwork_media';

/**
 * Upload an image, video, or PDF directly to Cloudinary edge CDN.
 * Guaranteed 0ms base64 memory bloat — returns ultra-lightweight CDN streaming URL.
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (pct: number) => void
): Promise<CloudinaryUploadResult> {
  const resourceType = file.type.startsWith('video/')
    ? 'video'
    : file.type.startsWith('image/')
    ? 'image'
    : 'raw';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'koinexa_campus_feed');

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

    xhr.open('POST', uploadUrl, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          onProgress(pct);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          // Return optimized secure CDN streaming URL
          let optimizedUrl = response.secure_url;
          if (resourceType === 'image') {
            // Auto WebP conversion and quality optimization
            optimizedUrl = optimizedUrl.replace('/upload/', '/upload/f_auto,q_auto:best/');
          } else if (resourceType === 'video') {
            // Automatic video bitrate streaming optimization
            optimizedUrl = optimizedUrl.replace('/upload/', '/upload/q_auto,vc_auto/');
          }

          resolve({
            secureUrl: optimizedUrl,
            publicId: response.public_id,
            format: response.format,
            width: response.width,
            height: response.height,
            duration: response.duration,
            bytes: response.bytes,
          });
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary response format.'));
        }
      } else {
        reject(new Error(`Cloudinary upload failed with status ${xhr.status}: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during Cloudinary edge CDN streaming transfer.'));
    };

    xhr.send(formData);
  });
}

/**
 * Converts local files to object URL for instant 0ms DOM preview without base64 string bloat.
 */
export function getZeroLagPreviewUrl(file: File): string {
  return URL.createObjectURL(file);
}
