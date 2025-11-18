import { EnumClimbCat } from '../enums/EnumClimbCat';
import type { GpsData } from '../models/GpsData';
import type { IMark } from '../interfaces/IMark'
import { ClimbCalculationService } from '../services/ClimbCalculationService';
import { TrackDrawService } from '../services/TrackDrawService';

export class Climb implements IMark {
  label: string;
  souvenir: string;
  position: number;
  startPosition: number;
  startPoint: GpsData;
  gpsPoint: GpsData;
  gradient: number;
  category: EnumClimbCat | null;
  type: string;
  isFinalClimb: boolean;
  shallMoveKmLabel: boolean;

  constructor(name: string, souvenir: string, position: number, startPosition: number, gpsPoint: GpsData, startPoint: GpsData, 
    category: EnumClimbCat | null, totalTrackKM: number) {
    this.type = "Climb";
    this.label = name;
    this.souvenir = souvenir;
    this.position = position;
    this.startPosition = startPosition;
    this.startPoint = startPoint;
    this.gpsPoint = gpsPoint;
    this.shallMoveKmLabel = false;

    this.gradient = ClimbCalculationService.getGradient(this.startPoint, this.gpsPoint);
    this.category = category == null ? ClimbCalculationService.getCategory(this.startPoint, this.gpsPoint) : category;
    this.isFinalClimb = totalTrackKM - position < 2;
  }

  renderSpecific(g: d3.Selection<SVGGElement, unknown, null, undefined>, markerX: number, markerY: number, h: number, onSelectMark: (mark: IMark) => void) {
    
    if (this.isFinalClimb) return;

    var textY = markerY - 30;

    if (this.category && this.category != EnumClimbCat.N) {
      TrackDrawService.createMarkSymbol(g, markerX, textY, "white", "red", this.category);
      textY = markerY - 55;
    }

    const textLines = [
      `${this.label} ${this.gpsPoint.elevation.toFixed(0)}m`
    ];
    
    const hasSouvenir = this.souvenir && this.souvenir.trim() !== "";
    if (hasSouvenir) {
      textLines.push(`Souvenir ${this.souvenir}`);
    }
    textLines.push(`(${(this.position - this.startPosition).toFixed(1)}km à ${this.gradient.toFixed(1)}%)`);

    g.append("text")
      .attr("x", markerX)
      .attr("y", textY)
      .attr("transform", `rotate(-90, ${markerX}, ${textY})`)
      .style("dominant-baseline", "middle")
      .style("fill", "white")
      .selectAll("tspan")
      .data(textLines)
      .enter()
      .append("tspan")
      .attr("x", markerX)
      .attr("dy", (_d, i) => {
        if (i === 0) {
          return hasSouvenir ? "-1.2em" : "-0.6em";
        }
        return "1.2em";
      })
      .style("font-size", (_d, i) =>
        hasSouvenir && i === textLines.length - 1 ? "14px" : "14px"
      )
      .text(d => d)
      .style("cursor", "pointer")
      .on("click", (event) => {
        event.stopPropagation();
        onSelectMark(this);
      });

    TrackDrawService.createDashedLine(g, markerX, markerY, h);
    TrackDrawService.createKmLabel(g, markerX, h, this.position, this.shallMoveKmLabel, this, onSelectMark);
  }
}



          