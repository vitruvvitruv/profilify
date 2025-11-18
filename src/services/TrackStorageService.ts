import type { IStoredTrack } from '../interfaces/IStoredTrack';
import type { ITrackMetaData } from '../interfaces/ITrackMetaData';
import { Track } from '../models/Track';
import { GpxParseService } from './GpxParseService';
import { parseGPX } from '@we-gold/gpxjs';
import type { Ref } from 'vue';

export class TrackStorageService {
  static async loadTracksFromFolder(
    folderHandle: FileSystemDirectoryHandle,
    storedTracks: IStoredTrack[],
    preparedTracks: Track[]
  ): Promise<void> {

    storedTracks.length = 0;
    preparedTracks.length = 0;

    const entries: [string, FileSystemHandle][] = [];

    for await (const [name, handle] of (folderHandle as any).entries()) {
      if (handle.kind === 'file' && name.toLowerCase().endsWith('.gpx')) {
        entries.push([name, handle]);
      }
    }
    
    entries.sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    for (const [name, handle] of entries) {
      try {
        const file = await (handle as any).getFile();
        const text = await file.text();

        const [gpx, error] = parseGPX(text);
        if (error) {
          console.warn(`Fehler beim Parsen von ${name}:`, error);
          continue;
        }

        const baseName = name.replace(/\.gpx$/i, '');
        const metaName = `${baseName}.json`;
        let metaHandle: FileSystemFileHandle | null = null;
        let meta: ITrackMetaData | null = null;

        try {
          metaHandle = await folderHandle.getFileHandle(metaName);
          const metaFile = await metaHandle.getFile();
          const metaText = await metaFile.text();
          meta = JSON.parse(metaText);
        } catch {
          metaHandle = null;
          meta = null;
        }

        const existingIndex = storedTracks.findIndex(
          (entry) => entry.fileHandle.name === name
        );

        const newTrack = GpxParseService.createTrackFromGpx(gpx, meta, baseName);
        const newStored = { fileHandle: (handle as any), metaHandle, meta };

        if (existingIndex !== -1) {
          storedTracks[existingIndex] = newStored;
          preparedTracks[existingIndex] = newTrack;
        } else {
          storedTracks.push(newStored);
          preparedTracks.push(newTrack);
        }
      } catch (e) {
        console.error('Fehler beim Lesen der Datei', name, e);
      }
    }
  }

  static async updateMeta(
    folderHandle: FileSystemDirectoryHandle,
    index: number,
    storedTracks: IStoredTrack[],
    preparedTracks: Ref<Track[]>
  ): Promise<void> {
    const storedTrackEntry = storedTracks[index];
    if (!storedTrackEntry) return;

    const baseName = storedTrackEntry.fileHandle.name.replace(/\.gpx$/i, '');
    const metaName = `${baseName}.json`;

    let metaHandle = storedTrackEntry.metaHandle;
    if (!metaHandle) {
      metaHandle = await folderHandle.getFileHandle(metaName, { create: true });
      storedTrackEntry.metaHandle = metaHandle;
    }

    const writable = await metaHandle.createWritable();
    const trackEntry = preparedTracks.value[index];
    const metaData = trackEntry.exportMeta();

    await writable.write(JSON.stringify(metaData, null, 2));
    await writable.close();

    storedTrackEntry.meta = metaData;

    // Track ersetzen und Array neu zuweisen
    preparedTracks.value = [
        ...preparedTracks.value.slice(0, index),
        new Track(trackEntry.gps, metaData, baseName),
        ...preparedTracks.value.slice(index + 1)
    ];
  }
}