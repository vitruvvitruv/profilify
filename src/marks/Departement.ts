import type { GpsData } from '../models/GpsData';
import type { IMark } from '../interfaces/IMark';

export class Departement implements IMark {
  label: string;
  position: number;
  gpsPoint: GpsData;
  type: string;
  shallMoveKmLabel: boolean;

  constructor(name: string, position: number, gpsPoint: GpsData) {
    this.type = "Departement";
    this.label = name;
    this.position = position;
    this.gpsPoint = gpsPoint;
    this.shallMoveKmLabel = false;
  }

  renderSpecific(g: d3.Selection<SVGGElement, unknown, null, undefined>, markerX: number, _markerY: number, h: number, onSelectMark: (mark: IMark) => void) {
    
    g.append("text")
      .attr("x", markerX)
      .attr("y", h + 50)
      .style("text-anchor", "start")
      .call(text => {
        text.append("tspan")
          .style("fill", "#DDDD00")
          .style("font-weight", "bold")
          .style("font-size", "16px")
          .text("|");

        text.append("tspan")
          .attr("dx", "3")
          .style("fill", "white")
          .style("font-size", "14px")
          .text(this.label);
      })
      .style("cursor", "pointer")
      .on("click", (event) => {
        event.stopPropagation();
        onSelectMark(this);
      });
  }
}



          