import { DataTypes, Model, ModelStatic } from 'sequelize'
import { DatabaseTableNames } from '../../configuration/db/index.js'
import { Prompt } from '../../core/prompt.js'
import { Video, VideoModel, VideoTypes } from './video.js'
import { MediaTypes } from '../media.js'
import path from 'path'
import { Configs } from '../../configuration/configs.js'



class MiscVideoModel extends VideoModel {}



export class MiscVideo extends Video {

  public mediaType = MediaTypes.Video
  public videoType = VideoTypes.Misc
  public filePath: string
  public title: string



  constructor(filePath: string, title: string) {
    super()
    this.filePath = filePath
    this.title = title
  }



  getTableName(): DatabaseTableNames {
    return DatabaseTableNames.MiscVideo
  }



  getStagingDirectory(): string {
    return Configs.videoTypeDirectories.staging.misc
  }



  getPrompt(): Prompt {
    return new Prompt(this.videoType)
  }



  getModel(): ModelStatic<Model> {
    return MiscVideoModel
  }



  getAttributes(): any {
    return {
      mediaType: { type: DataTypes.STRING, allownull: false },
      videoType: { type: DataTypes.STRING, allownull: false },
      filePath: { type: DataTypes.STRING, allownull: false, unique: true },
      title: { type: DataTypes.STRING, allownull: false }
    }
  }



  getProductionFilePath(): string {
    const NEW_BASE_PATH = `${Configs.coreDirectories.productionVideos}/${this.getTableName()}`
    const CURRENT_FILE_EXT = path.extname(this.filePath)
    const TITLE = this.prepStringForFileName(this.title)

    return `${NEW_BASE_PATH}/${TITLE}${CURRENT_FILE_EXT}`
  }



  getRejectFilePath(): string {
    const NEW_BASE_PATH = `${Configs.coreDirectories.rejectionVideos}/${this.getTableName()}`
    const CURRENT_FILE_EXT = path.extname(this.filePath)
    const TITLE = this.prepStringForFileName(this.title)

    return `${NEW_BASE_PATH}/${TITLE}${CURRENT_FILE_EXT}`
  }
}
