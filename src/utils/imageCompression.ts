/**
 * Utilitaires pour la compression et l'upload d'images
 * - Compression locale sur le navigateur (max 1200px, qualité 0.8) pour économiser la bande passante
 * - Upload unsigned Cloudinary
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

/**
 * Compresse une image côté navigateur via HTML5 Canvas
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const { maxWidth = 1200, maxHeight = 1200, quality = 0.8 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calcul du redimensionnement proportionnel
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file); // repli sur le fichier original
          return;
        }

        // Amélioration de la qualité de rendu
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '') + '.webp',
              {
                type: 'image/webp',
                lastModified: Date.now(),
              }
            );
            resolve(compressedFile);
          },
          'image/webp',
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}

/**
 * Téléverse une image vers Cloudinary via upload unsigned
 */
export async function uploadToCloudinary(
  file: File,
  cloudName?: string,
  uploadPreset?: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const finalCloudName =
    cloudName ||
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
    localStorage.getItem('fripo_cloudinary_cloud_name') ||
    localStorage.getItem('vestio_cloudinary_cloud_name') ||
    '';

  const finalUploadPreset =
    uploadPreset ||
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
    localStorage.getItem('fripo_cloudinary_upload_preset') ||
    localStorage.getItem('vestio_cloudinary_upload_preset') ||
    '';

  // Si Cloudinary n'est pas encore configuré, convertir en DataURL local
  // Cela permet à la boutique de fonctionner immédiatement en local
  if (!finalCloudName || !finalUploadPreset || finalCloudName === 'votre_cloud_name') {
    return new Promise((resolve) => {
      onProgress?.(50);
      const reader = new FileReader();
      reader.onload = () => {
        onProgress?.(100);
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', finalUploadPreset);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      'POST',
      `https://api.cloudinary.com/v1_1/${finalCloudName}/image/upload`
    );

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url || response.url);
        } catch {
          reject(new Error("Réponse Cloudinary invalide"));
        }
      } else {
        // En cas d'erreur API Cloudinary, repli temporaire sur DataURL
        console.warn("Échec Cloudinary, utilisation du repli local", xhr.responseText);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      }
    };

    xhr.onerror = () => {
      console.warn("Erreur réseau Cloudinary, repli local DataURL");
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    };

    xhr.send(formData);
  });
}
