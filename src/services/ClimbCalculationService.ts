import { EnumClimbCat } from '../enums/EnumClimbCat';
import { GpsData } from '../models/GpsData';
import { Climb } from '../marks/Climb';

export class ClimbCalculationService {
  
  static GRADIENT_THRESHOLD_HIGH = 1;
  static STEP_SIZE = 8;

  static getClimbValue(start: GpsData, end: GpsData): number {
    const deltaAltitude = end.elevation - start.elevation;
    const distance = end.distance - start.distance;
    return 10 * deltaAltitude * deltaAltitude / distance;
  }

  static getCategory(start: GpsData, end: GpsData): EnumClimbCat {

    const climbValue = this.getClimbValue(start, end);

    if (climbValue > 800) return EnumClimbCat.HC;
    else if (climbValue > 400) return EnumClimbCat.C1;
    else if (climbValue > 200) return EnumClimbCat.C2;
    else if (climbValue > 100) return EnumClimbCat.C3;
    else if (climbValue > 50) return EnumClimbCat.C4;

    return EnumClimbCat.N;
  }

  static getGradient(start: GpsData, end: GpsData) {
    
    const deltaAltitude = end.elevation - start.elevation;
    const distance = end.distance - start.distance;
    return 100 * deltaAltitude / distance;
  }

  static detectClimbs(origData: GpsData[]): Climb[] {

    // Präparation
    const data = origData.slice();
    const originalSize = data.length;
    const totalDistance = data[originalSize - 1].distance;
    for (var i = 1; i < this.STEP_SIZE + 1; i++) {
      data.push(new GpsData(0, totalDistance + i));
    }

    // Grobe Suche
    const candidates = this.findCandidatePairs(data, originalSize);

    // Verfeinerung und Validierung
    const detectedClimbs: Climb[] = [];
    candidates.forEach(([topIndex, bottomIndex]) => {
      
      const preciseTopIndex = this.findPreciseTopIndex(data, topIndex);
      const preciseBottomIndex = this.findPreciseBottomIndex(data, preciseTopIndex, bottomIndex);
      
      const category = this.getCategory(data[preciseBottomIndex], data[preciseTopIndex]);
      const topKm = 0.001 * data[preciseTopIndex].distance;
      const bottomKm = 0.001 * data[preciseBottomIndex].distance;
      if (category != EnumClimbCat.N && (topKm - bottomKm > 0.35)) {
        detectedClimbs.push(new Climb("Detected climb", "", topKm, bottomKm, data[preciseTopIndex], 
          data[preciseBottomIndex], category, data[data.length - 1].distance));
      }
    });

    return detectedClimbs;
  }

  private static findPreciseTopIndex(data: GpsData[], roughTopIndex: number): number {
    let maxAltitudeIndex = roughTopIndex;
    let maxAltitude = 0;

    for (var i = roughTopIndex - this.STEP_SIZE; i <= roughTopIndex + this.STEP_SIZE; i++) {
      const newAltitude = data[i].elevation;
      if (newAltitude > maxAltitude) {
        maxAltitude = newAltitude;
        maxAltitudeIndex = i;
      }
    }

    return maxAltitudeIndex;
  }

  private static findPreciseBottomIndex(data: GpsData[], preciseTopIndex: number, roughBottomIndex: number): number {
    let maxDifficultyStartIndex = roughBottomIndex;
    let maxDifficulty = 0;

    for (var i = preciseTopIndex - 1; i >= Math.max(roughBottomIndex - this.STEP_SIZE, 0); i--) {
      const newDifficulty = this.getClimbValue(data[i], data[preciseTopIndex]);
      if (newDifficulty > maxDifficulty) {
        maxDifficulty = newDifficulty;
        maxDifficultyStartIndex = i;
      }
    }

    return maxDifficultyStartIndex;
  }

  private static findCandidatePairs(data: GpsData[], size: number): [number, number][] {

    const GRADIENT_THRESHOLD_LOW = -3;
    const OFFSETS = [this.STEP_SIZE, 2 * this.STEP_SIZE, 3 * this.STEP_SIZE, 4 * this.STEP_SIZE, 
      8 * this.STEP_SIZE, 16 * this.STEP_SIZE, 24 * this.STEP_SIZE, 32 * this.STEP_SIZE];

    const pairs: [number, number][] = [];
    let index = Math.floor((size - 1) / this.STEP_SIZE) * this.STEP_SIZE;

    while (index > 0) {
      if (this.getGradient(data[index], data[index + this.STEP_SIZE]) < this.GRADIENT_THRESHOLD_HIGH 
      && index >= this.STEP_SIZE && this.getGradient(data[index - this.STEP_SIZE], data[index]) > this.GRADIENT_THRESHOLD_HIGH) {
        const topIndex = index;
        index -= this.STEP_SIZE;

        let isAscending = true;
        while (isAscending) {
          isAscending = false;

          for (const offset of OFFSETS) {
            if (index < offset) continue;

            const gradToNext = this.getGradient(data[index - offset], data[index]);
            const gradToTop = this.getGradient(data[index - offset], data[topIndex]);

            if (gradToNext > this.GRADIENT_THRESHOLD_HIGH) {
              index -= offset;
              isAscending = true;
              break;
            }
            if (gradToTop < this.GRADIENT_THRESHOLD_HIGH ||
              (offset > 6 * this.STEP_SIZE && gradToNext < GRADIENT_THRESHOLD_LOW)) {
              break;
            }
          }
        }
        pairs.push([topIndex, index]);
      }
      index -= this.STEP_SIZE;
    }

    return pairs;
  }
}

