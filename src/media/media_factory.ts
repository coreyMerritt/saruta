import { DatabaseTableNames } from '../configuration/db/index.js'
import { Validators } from '../core/validators.js'
import { MediaTypes } from './media.js'
import { Video, VideoFactory, VideoTypes } from './video/index.js'



export class MediaFactory {

  public static createMedia(object: any): Video {
    if (Validators.isMedia(object)) {
      switch (object.mediaType) {
        case MediaTypes.Video:
          return VideoFactory.createVideoFromObject(object)
        default:
          throw new Error(`Object is not valid Media:\n${JSON.stringify(object)}`)
      }
    } else {
      throw new Error(`Object is not valid Media:\n${JSON.stringify(object)}`)
    }
  }



  public static createMediaFromTableName(object: any, tableName: DatabaseTableNames): Video {
    try {
      if (Validators.isMedia(object)) {
        switch (tableName) {
          case DatabaseTableNames.Animation:
            return VideoFactory.createVideoFromVideoType(object, VideoTypes.Animation)
          case DatabaseTableNames.Anime:
            return VideoFactory.createVideoFromVideoType(object, VideoTypes.Anime)
          case DatabaseTableNames.Movies:
            return VideoFactory.createVideoFromVideoType(object, VideoTypes.Movie)
          case DatabaseTableNames.Shows:
            return VideoFactory.createVideoFromVideoType(object, VideoTypes.Show)
          case DatabaseTableNames.Standup:
            return VideoFactory.createVideoFromVideoType(object, VideoTypes.Standup)
          default:
            return VideoFactory.createVideoFromVideoType(object, VideoTypes.Misc)
        }
      } else {
        throw new Error(`Object is not Media: ${JSON.stringify(object)}`)
      }
    } catch (error) {
      throw new Error(
        `Unable to create media from table ${tableName} with object:\n
        ${JSON.stringify(object)}`,
        { cause: error }
      )
    }
  }
}
