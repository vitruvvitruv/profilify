export class GpsData {
  elevation: number;
  smoothedElevation: number;
  distance: number;

  constructor(elevation: number, distance: number) {
    this.elevation = elevation;
    this.distance = distance;
    this.smoothedElevation = 0;
  }
}