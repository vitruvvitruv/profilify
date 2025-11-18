import type { ParsedGPX } from '@we-gold/gpxjs';
import { calculateDistance } from '@we-gold/gpxjs';
import { GpsData } from '../models/GpsData';
import type { ITrackMetaData } from '../interfaces/ITrackMetaData';
import { Track } from '../models/Track';

export class GpxParseService {

  static createTrackFromGpx(gpx: ParsedGPX, meta: ITrackMetaData | null, name: string): Track {
    const parsedData = this.parseGpx(gpx);
    const track = new Track(parsedData, meta, name);
    this.smoothElevation(track, 15);
    return track;
  }

  private static parseGpx(gpx: ParsedGPX): GpsData[] {
    const dist = gpx.applyToTrack(0, calculateDistance);
    const points: GpsData[] = [];

    for (const track of gpx.tracks) {
      for (let i = 0; i < track.points.length; i++) {
        const point = track.points[i];
        if (point.elevation) {
          points.push(new GpsData(point.elevation, dist.cumulative[i]));
        }
      }
    }

    return points;
  }

  private static smoothElevation(track: Track, windowSize: number): void {
    for (let i = 0; i < track.gps.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2));
      const end = Math.min(track.gps.length, i + Math.ceil(windowSize / 2));
      const window = track.gps.slice(start, end);

      const avgElevation =
        window.reduce((sum, d) => sum + d.elevation, 0) / window.length;

      track.gps[i].smoothedElevation = avgElevation;
    }
  }
}

  