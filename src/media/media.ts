import { Model, ModelStatic } from 'sequelize'
import { Prompt } from '../core/prompt.js'
import { DatabaseTableNames } from '../configuration/db/index.js'



export class MediaModel extends Model {
  public mediaType!: string
  public filePath!: string
  public title!: string
}



export abstract class Media {
  public abstract mediaType: MediaTypes

  public abstract filePath: string
  public abstract title: string

  public abstract getFileExtensions(): string[]
  public abstract getTableName(): DatabaseTableNames
  public abstract getStagingDirectory(): string
  public abstract getPrompt(): Prompt
  public abstract getModel(): ModelStatic<Model>
  public abstract getAttributes(): any
  public abstract getProductionFilePath(): string
  public abstract getRejectFilePath(): string



  public prepStringForFileName(someString: string): string {
    const NEW_STRING =
      someString.toLowerCase()
        .replaceAll(/ /g, '-')
        .replaceAll(':', '')
        .replaceAll('\'', '')
        .replaceAll(';', '')
        .replaceAll('"', '')
        .replaceAll('?', '')
        .replaceAll('>', '')
        .replaceAll('<', '')
        .replaceAll('\\', '/')
        .replaceAll('|', '')
        .replaceAll('*', '')
        .replaceAll(',', '')
        .replaceAll('.', '')

    return NEW_STRING
  }
}



export enum MediaTypes {
  Video = 'video'
}
