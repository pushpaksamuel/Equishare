const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const MIME_TYPE = 'image/jpeg';
const QUALITY = 0.8;

export const resizeAndEncodeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const blobURL = URL.createObjectURL(file);
    const img = new Image();
    img.src = blobURL;
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image."));
    };
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      let { width, height } = img;
      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context.'));
      }
      ctx.drawImage(img, 0, 0, width, height);
      
      const base64 = canvas.toDataURL(MIME_TYPE, QUALITY);
      resolve(base64);
    };
  });
};
