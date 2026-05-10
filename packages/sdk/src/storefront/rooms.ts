import type { ScopedClient } from '../client';
import type { PlayFlixRoom, PlayFlixRoomJoinResponse } from '../types';
import type { CreatePlayFlixRoomDto, JoinPlayFlixRoomDto, SwitchPlayFlixRoomModeDto, ListPlayFlixRoomsQuery } from '../dto';

export function createStorefrontRooms(c: ScopedClient) {
  return {
    create(data: CreatePlayFlixRoomDto) {
      return c.post<PlayFlixRoom>('/rooms', data, 'enduser');
    },

    get(roomId: string) {
      return c.get<PlayFlixRoom>(`/rooms/${roomId}`);
    },

    join(roomId: string, data: JoinPlayFlixRoomDto) {
      return c.post<PlayFlixRoomJoinResponse>(`/rooms/${roomId}/join`, data, 'enduser');
    },

    leave(roomId: string) {
      return c.post<void>(`/rooms/${roomId}/leave`, undefined, 'enduser');
    },

    switchMode(roomId: string, data: SwitchPlayFlixRoomModeDto) {
      return c.post<void>(`/rooms/${roomId}/switch-mode`, data, 'enduser');
    },

    end(roomId: string) {
      return c.post<void>(`/rooms/${roomId}/end`, undefined, 'enduser');
    },

    listLive(params?: ListPlayFlixRoomsQuery) {
      return c.paginated<PlayFlixRoom>('/rooms/live', params);
    },

    listForMovie(tmdbId: number) {
      return c.get<PlayFlixRoom[]>(`/rooms/movie/${tmdbId}`);
    },
  };
}
