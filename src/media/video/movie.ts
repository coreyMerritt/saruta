import { DataTypes, Model, ModelStatic } from 'sequelize'
import { DatabaseTableNames } from '../../configuration/db/index.js'
import { Prompt } from '../../core/prompt.js'
import { Video, VideoModel, VideoTypes } from './video.js'
import { MediaTypes } from '../media.js'
import path from 'path'
import { Configs } from '../../configuration/configs.js'



class MovieModel extends VideoModel {
  public releaseYear!: number
}



export class Movie extends Video {

  public mediaType = MediaTypes.Video
  public videoType = VideoTypes.Movie
  public filePath: string
  public title: string
  public releaseYear: number



  constructor(filePath: string, title: string, releaseYear: number) {
    super()
    this.filePath = filePath
    this.title = title
    this.releaseYear = releaseYear
  }



  getTableName(): DatabaseTableNames {
    return DatabaseTableNames.Movies
  }



  getStagingDirectory(): string {
    return Configs.videoTypeDirectories.staging.movies
  }



  getPrompt(): Prompt {
    return new Prompt(this.videoType)
  }



  getModel(): ModelStatic<Model> {
    return MovieModel
  }



  getAttributes(): any {
    return {
      mediaType: { type: DataTypes.STRING, allownull: false },
      videoType: { type: DataTypes.STRING, allownull: false },
      filePath: { type: DataTypes.STRING, allownull: false, unique: true },
      title: { type: DataTypes.STRING, allownull: false },
      releaseYear: { type: DataTypes.INTEGER, allowNull: false }
    }
  }



  getProductionFilePath(): string {
    const NEW_BASE_PATH = `${Configs.coreDirectories.productionVideos}/${this.getTableName()}`
    const RELEASE_YEAR = this.releaseYear
    const CURRENT_FILE_EXT = path.extname(this.filePath)
    const TITLE = this.prepStringForFileName(this.title)

    return `${NEW_BASE_PATH}/${RELEASE_YEAR}-${TITLE}${CURRENT_FILE_EXT}`
  }



  getRejectFilePath(): string {
    const NEW_BASE_PATH = `${Configs.coreDirectories.rejectionVideos}/${this.getTableName()}`
    const RELEASE_YEAR = this.releaseYear
    const CURRENT_FILE_EXT = path.extname(this.filePath)
    const TITLE = this.prepStringForFileName(this.title)

    return `${NEW_BASE_PATH}/${RELEASE_YEAR}-${TITLE}${CURRENT_FILE_EXT}`
  }
}
