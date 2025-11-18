import type { ITrackMetaData } from "./ITrackMetaData";

export interface IStoredTrack {
  fileHandle: FileSystemFileHandle;
  metaHandle: FileSystemFileHandle | null;
  meta: ITrackMetaData | null;
}