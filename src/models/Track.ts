import type { IMark } from '../interfaces/IMark';
import { GpsData } from './GpsData';
import { Climb } from '../marks/Climb';
import { Departement } from '../marks/Departement';
import { Intermediate } from '../marks/Intermediate';
import { Sector } from '../marks/Sector';
import { Sprint } from '../marks/Sprint';
import { SteepPart } from '../marks/SteepPart';
import { Town } from '../marks/Town';
import type { ITrackMetaData } from '../interfaces/ITrackMetaData';

export class Track {
  departure: string;
  arrival: string;
  isTimeTrial: boolean;
  marks: IMark[];
  gps: GpsData[];
  totalKM: number;
  name: string;

  constructor(gps: GpsData[], meta: ITrackMetaData | null, name: string) {
    this.gps = gps;
    this.departure = "";
    this.arrival = "";
    this.isTimeTrial = false;
    this.marks = [];
    this.totalKM = 0.001 * gps[gps.length - 1].distance;
    this.name = name;

    if (meta) {
      this.loadMeta(meta);
    }
  }

  public loadMeta(meta: ITrackMetaData): void {
    if (meta.departure) this.departure = meta.departure;
    if (meta.arrival) this.arrival = meta.arrival;
    if (meta.isTimeTrial) this.isTimeTrial = meta.isTimeTrial;
    this.marks = (meta.marks ?? []).map(m => this.createMarkFromJson(m));
    this.marks.sort((a, b) => a.position - b.position);
  }

  public exportMeta(): ITrackMetaData {
    return {
      departure: this.departure,
      arrival: this.arrival,
      isTimeTrial: this.isTimeTrial,
      marks: this.marks.map(m => Track.exportMarkToJson(m))
    };
  }

  private createMarkFromJson(json: any): IMark {
    const nearestPoint = this.getNearestPoint(json.position);
    switch (json.type) {
      case 'Climb':
        return new Climb(json.name, json.souvenir, json.position, json.startPosition,
          nearestPoint, this.getNearestPoint(json.startPosition), json.category, this.totalKM);
      case 'Departement':
        return new Departement(json.name, json.position, nearestPoint);
      case 'Intermediate':
        return new Intermediate(json.name, json.position, nearestPoint);
      case 'Sector':
        return new Sector(json.name, json.position, json.endPosition, nearestPoint, this.getNearestPoint(json.endPosition));
      case 'Sprint':
        return new Sprint(json.name, json.position, nearestPoint);
      case 'SteepPart':
        return new SteepPart(json.name, json.position, json.endPosition, nearestPoint, this.getNearestPoint(json.endPosition));
      case 'Town':
        return new Town(json.name, json.position, nearestPoint);
      default:
        console.warn('Unbekannter Mark-Typ:', json.type);
        return {
          label: json.name,
          position: json.position,
          gpsPoint: nearestPoint,
          type: json.type,
          renderSpecific: () => {},
          shallMoveKmLabel: false
        } as IMark;
    }
  }

  public getNearestPoint(km: number): GpsData {
    return this.gps.reduce((prev, curr) =>
      Math.abs(curr.distance - km * 1000) < Math.abs(prev.distance - km * 1000)
        ? curr
        : prev
    );
  }

  private static exportMarkToJson(mark: IMark): any {

    return {
      type: mark.type,
      name: mark.label,
      position: mark.position,
      ...(mark instanceof SteepPart || mark instanceof Sector ? { endPosition: mark.endPosition } : {}),
      ...(mark instanceof Climb ? { souvenir: mark.souvenir, startPosition: mark.startPosition, category: mark.category } : {})
    };
  }

  public getFinalClimbOrNull(): Climb | null {
    const found = this.marks.find(
      (m): m is Climb => m instanceof Climb && m.isFinalClimb
    );
    return found ?? null;
  }
}