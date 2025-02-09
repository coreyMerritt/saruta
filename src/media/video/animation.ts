import { DataTypes, Model, ModelStatic } from 'sequelize'
import { Prompt } from '../../core/prompt.js'
import { DatabaseTableNames } from '../../configuration/db/index.js'
import { Video, VideoModel, VideoTypes } from './video.js'
import { MediaTypes } from '../media.js'
import path from 'path'
import { Configs } from '../../configuration/configs.js'



class AnimationModel extends VideoModel {
  public seasonNumber!: number
  public episodeNumber!: number
}



export class Animation extends Video {

  public mediaType = MediaTypes.Video
  public videoType = VideoTypes.Animation
  public filePath: string
  public title: string
  public seasonNumber: number
  public episodeNumber: number



  constructor(filePath: string, title: string, seasonNumber: number, episodeNumber: number) {
    super()
    this.filePath = filePath
    this.title = title
    this.seasonNumber = seasonNumber
    this.episodeNumber = episodeNumber
  }



  getTableName(): DatabaseTableNames {
    return DatabaseTableNames.Animation
  }



  getStagingDirectory(): string {
    return Configs.videoTypeDirectories.staging.animation
  }



  getPrompt(): Prompt {
    return new Prompt(this.videoType)
  }



  getModel(): ModelStatic<Model> {
    return AnimationModel
  }



  getAttributes(): any {
    return {
      mediaType: { type: DataTypes.STRING, allownull: false },
      videoType: { type: DataTypes.STRING, allownull: false },
      filePath: { type: DataTypes.STRING, allownull: false, unique: true },
      title: { type: DataTypes.STRING, allownull: false },
      seasonNumber: { type: DataTypes.INTEGER, allowNull: false },
      episodeNumber: { type: DataTypes.INTEGER, allowNull: false }
    }
  }



  getProductionFilePath(): string {
    const NEW_BASE_PATH = `${Configs.coreDirectories.productionVideos}/${this.getTableName()}`
    const CURRENT_FILE_EXT = path.extname(this.filePath)
    const TITLE = this.prepStringForFileName(this.title)
    const SEASON_NUM = String(this.seasonNumber).padStart(2, '0')
    const EPISODE_NUM = String(this.episodeNumber).padStart(2, '0')

    return `${NEW_BASE_PATH}/${TITLE}/s${SEASON_NUM}e${EPISODE_NUM}${CURRENT_FILE_EXT}`
  }



  getRejectFilePath(): string {
    const NEW_BASE_PATH = `${Configs.coreDirectories.rejectionVideos}/${this.getTableName()}`
    const CURRENT_FILE_EXT = path.extname(this.filePath)
    const TITLE = this.prepStringForFileName(this.title)
    const SEASON_NUM = String(this.seasonNumber).padStart(2, '0')
    const EPISODE_NUM = String(this.episodeNumber).padStart(2, '0')

    return `${NEW_BASE_PATH}/${TITLE}/s${SEASON_NUM}e${EPISODE_NUM}${CURRENT_FILE_EXT}`
  }
}
