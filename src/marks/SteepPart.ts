import type { GpsData } from '../models/GpsData';
import type { IMark } from '../interfaces/IMark'
import { TrackDrawService } from '../services/TrackDrawService';
import { ClimbCalculationService } from '../services/ClimbCalculationService';

export class SteepPart implements IMark {
  label: string;
  position: number;
  endPosition: number;
  endPoint: GpsData;
  gpsPoint: GpsData;
  gradient: number;
  type: string;
  shallMoveKmLabel: boolean;

  constructor(name: string, position: number, endPosition: number, gpsPoint: GpsData, endPoint: GpsData) {
    this.type = "SteepPart";
    this.label = name;
    this.position = position;
    this.endPosition = endPosition;
    this.endPoint = endPoint;
    this.gpsPoint = gpsPoint;
    this.shallMoveKmLabel = false;
    
    this.gradient = ClimbCalculationService.getGradient(this.gpsPoint, this.endPoint);
  }

  renderSpecific(g: d3.Selection<SVGGElement, unknown, null, undefined>, markerX: number, markerY: number, h: number, onSelectMark: (mark: IMark) => void) {
    TrackDrawService.createOneLineMarkText(g, markerX, markerY - 30, "Entrée " + (this.endPosition - this.position).toFixed(1) + "km à " + this.gradient.toFixed(1) + "%", this, onSelectMark);
    TrackDrawService.createDashedLine(g, markerX, markerY, h);
    TrackDrawService.createKmLabel(g, markerX, h, this.position, this.shallMoveKmLabel, this, onSelectMark);
  }
}



          