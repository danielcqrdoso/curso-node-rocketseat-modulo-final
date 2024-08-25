export enum FileType {
  PNG = 'PNG',
  JPG = 'JPG',
  JPEG = 'JPEG',
}

export interface PhotoParams {
  fileName: string
  fileType: FileType
  fileBody: Buffer
}
