export interface NoteImage {
  id: string;
  url: string;
  file: File;
  base64: string;
}

export enum AppState {
  Upload = 'upload',
  Processing = 'processing',
  Result = 'result',
  Error = 'error'
}

export interface TranscriptionResult {
  text: string;
  timestamp: Date;
}