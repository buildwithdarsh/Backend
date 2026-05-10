import type { ScopedClient } from '../client';
import type { ConnectedSource, GoogleDriveConnectUrl } from '../types';
import type { GoogleDriveCallbackDto } from '../dto';

export function createStorefrontConnectedSources(c: ScopedClient) {
  return {
    list() {
      return c.get<ConnectedSource[]>('/connected-sources', 'enduser');
    },

    getGoogleDriveConnectUrl() {
      return c.get<GoogleDriveConnectUrl>('/connected-sources/google-drive/connect', 'enduser');
    },

    connectGoogleDrive(data: GoogleDriveCallbackDto) {
      return c.post<ConnectedSource>('/connected-sources/google-drive/callback', data, 'enduser');
    },

    disconnect(provider: string) {
      return c.del<void>(`/connected-sources/${provider}`, 'enduser');
    },
  };
}
