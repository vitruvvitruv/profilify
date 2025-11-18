export interface ITrackMetaData {
  departure: string;
  arrival: string;
  isTimeTrial: boolean;
  marks: Array<{
    type: string;
    name: string;
    position: number;
    startPosition: number;
  }>;
}