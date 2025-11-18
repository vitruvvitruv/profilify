import type { GpsData } from "../models/GpsData";

export interface IMark {
  label: string;
  position: number;
  gpsPoint: GpsData;
  type: string;
  shallMoveKmLabel: boolean;

  renderSpecific: (svg: d3.Selection<SVGGElement, unknown, null, undefined>, 
    x: number, 
    y: number,
    h: number,
    onSelectMark: (mark: IMark) => void) => void;
}