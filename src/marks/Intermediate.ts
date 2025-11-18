import type { GpsData } from '../models/GpsData';
import type { IMark } from '../interfaces/IMark'
import { TrackDrawService } from '../services/TrackDrawService';

export class Intermediate implements IMark {
  label: string;
  position: number;
  gpsPoint: GpsData;
  type: string;
  shallMoveKmLabel: boolean;

  constructor(name: string, position: number, gpsPoint: GpsData) {
    this.type = "Intermediate";
    this.label = name;
    this.position = position;
    this.gpsPoint = gpsPoint;
    this.shallMoveKmLabel = false;
  }

  renderSpecific(g: d3.Selection<SVGGElement, unknown, null, undefined>, markerX: number, markerY: number, h: number, onSelectMark: (mark: IMark) => void) {
    
    g.append("text")
        .attr("x", markerX)
        .attr("y", markerY - 30)
        .style("text-anchor", "middle")
        .style("dominant-baseline", "middle")
        .style("font-size", "30px")
        .text("⏱️");

    TrackDrawService.createOneLineMarkText(g, markerX, markerY - 55, this.label + " " + this.gpsPoint.elevation.toFixed(0) + "m", this, onSelectMark);
    TrackDrawService.createDashedLine(g, markerX, markerY, h);
    TrackDrawService.createKmLabel(g, markerX, h, this.position, this.shallMoveKmLabel, this, onSelectMark);
  }
}