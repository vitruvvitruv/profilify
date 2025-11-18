import type { GpsData } from '../models/GpsData';
import type { IMark } from '../interfaces/IMark'
import { TrackDrawService } from '../services/TrackDrawService';

export class Sprint implements IMark {
  label: string;
  position: number;
  gpsPoint: GpsData;
  type: string;
  shallMoveKmLabel: boolean;

  constructor(name: string, position: number, gpsPoint: GpsData) {
    this.type = "Sprint";
    this.label = name;
    this.position = position;
    this.gpsPoint = gpsPoint;
    this.shallMoveKmLabel = false;
  }

  renderSpecific(g: d3.Selection<SVGGElement, unknown, null, undefined>, markerX: number, markerY: number, h: number, onSelectMark: (mark: IMark) => void) {
    TrackDrawService.createMarkSymbol(g, markerX, markerY - 30, "white", "green", "S");
    TrackDrawService.createOneLineMarkText(g, markerX, markerY - 55, this.label + " " + this.gpsPoint.elevation.toFixed(0) + "m", this, onSelectMark);
    TrackDrawService.createDashedLine(g, markerX, markerY, h);
    TrackDrawService.createKmLabel(g, markerX, h, this.position, this.shallMoveKmLabel, this, onSelectMark);
  }
}



          