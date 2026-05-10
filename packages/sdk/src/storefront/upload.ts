import type { ScopedClient } from '../client';
import type { UploadResult } from '../types';

export function createStorefrontUpload(c: ScopedClient) {
  return {
    upload(file: File | Blob, folder?: string) {
      const formData = new FormData();
      formData.append('file', file);
      if (folder) formData.append('folder', folder);
      return c.upload<UploadResult>('/upload', formData, 'enduser');
    },
  };
}
