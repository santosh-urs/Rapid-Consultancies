const ALLOWED_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function validateImageUpload(file: File): { ok: true; ext: string } | { ok: false; error: string } {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return { ok: false, error: 'Only JPG, PNG, or WEBP images are allowed.' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: 'Image must be smaller than 5MB.' };
  }
  if (file.size === 0) {
    return { ok: false, error: 'File is empty.' };
  }
  return { ok: true, ext };
}
