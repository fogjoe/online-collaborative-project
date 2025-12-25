import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export const ensureUploadSubdirectory = (folder: string) => {
  const uploadPath = join(process.cwd(), 'uploads', folder);
  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath, { recursive: true });
  }
  return uploadPath;
};
