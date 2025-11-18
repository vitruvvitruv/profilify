import type { GpsData } from '../models/GpsData';
import type { IMark } from '../interfaces/IMark'
import { TrackDrawService } from '../services/TrackDrawService';

export class Sector implements IMark {
  label: string;
  position: number;
  endPosition: number;
  endPoint: GpsData;
  gpsPoint: GpsData;
  type: string;
  shallMoveKmLabel: boolean;

  constructor(name: string, position: number, endPosition: number, gpsPoint: GpsData, endPoint: GpsData) {
    this.type = "Sector";
    this.label = name;
    this.position = position;
    this.endPosition = endPosition;
    this.endPoint = endPoint;
    this.gpsPoint = gpsPoint;
    this.shallMoveKmLabel = false;
  }

  renderSpecific(g: d3.Selection<SVGGElement, unknown, null, undefined>, markerX: number, markerY: number, h: number, onSelectMark: (mark: IMark) => void) {
    
    g.append("text")
        .attr("x", markerX)
        .attr("y", markerY - 30)
        .style("text-anchor", "middle")
        .style("dominant-baseline", "middle")
        .style("font-size", "20px")
        .text("🧱");

    TrackDrawService.createOneLineMarkText(g, markerX, markerY - 55, this.label + " " + this.gpsPoint.elevation.toFixed(0) + "m (" + parseFloat((this.endPosition - this.position).toFixed(1)) * 1000 + "m)", this, onSelectMark);
    TrackDrawService.createDashedLine(g, markerX, markerY, h);
    TrackDrawService.createKmLabel(g, markerX, h, this.position, this.shallMoveKmLabel, this, onSelectMark);
  }
}



          