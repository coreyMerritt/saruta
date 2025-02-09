import { Animation } from './animation.js'
import { Anime } from './anime.js'
import { MiscVideo } from './misc_video.js'
import { Movie } from './movie.js'
import { Show } from './show.js'
import { Standup } from './standup.js'
import { Video, VideoTypes } from './video.js'
import { Validators } from '../../core/index.js'
import { DatabaseTableNames } from '../../configuration/db/index.js'
import { Media } from '../media.js'
import { ValidationResponse } from '../../core/file_engine.js'



export class VideoFactory {

  public static createVideoFromObject(object: any): Video {
    if ('videoType' in object && 'filePath' in object) {
      switch (object.videoType) {
        case VideoTypes.Animation:
          return new Animation(object.filePath,
            'title' in object ? object.title : undefined,
            'seasonNumber' in object ? object.seasonNumber : undefined,
            'episodeNumber' in object ? object.episodeNumber : undefined
          )
        case VideoTypes.Anime:
          return new Anime(object.filePath,
            'title' in object ? object.title : undefined,
            'seasonNumber' in object ? object.seasonNumber : undefined,
            'episodeNumber' in object ? object.episodeNumber : undefined
          )
        case VideoTypes.Movie:
          return new Movie(object.filePath,
            'title' in object ? object.title : undefined,
            'releaseYear' in object ? object.releaseYear : undefined
          )
        case VideoTypes.Show:
          return new Show(object.filePath,
            'title' in object ? object.title : undefined,
            'seasonNumber' in object ? object.seasonNumber : undefined,
            'episodeNumber' in object ? object.episodeNumber : undefined
          )
        case VideoTypes.Standup:
          return new Standup(object.filePathsMinusIndexed,
            'title' in object ? object.title : undefined,
            'artist' in object ? object.artist : undefined,
            'releaseYear' in object ? object.releaseYear : undefined
          )
        default:
          return new MiscVideo(object.filePath,
            'title' in object ? object.title : undefined
          )
      }
    } else {
      throw new Error(`Object is not a valid Video:\n${JSON.stringify(object)}`)
    }
  }



  public static createNullFromVideoType(videoType: VideoTypes): Video {
    switch (videoType) {
      case VideoTypes.Animation:
        return new Animation('', '', 0, 0)
      case VideoTypes.Anime:
        return new Anime('', '', 0, 0)
      case VideoTypes.Movie:
        return new Movie('', '', 0)
      case VideoTypes.Show:
        return new Show('', '', 0, 0)
      case VideoTypes.Standup:
        return new Standup('', '', '', 0)
      default:
        return new MiscVideo('', '')
    }
  }



  public static createVideoFromVideoType(object: any, videoType: VideoTypes): Video {
    switch (videoType) {
      case VideoTypes.Animation:
        return new Animation(object.filePath,
          'title' in object ? object.title : undefined,
          'seasonNumber' in object ? object.seasonNumber : undefined,
          'episodeNumber' in object ? object.episodeNumber : undefined
        )
      case VideoTypes.Anime:
        return new Anime(object.filePath,
          'title' in object ? object.title : undefined,
          'seasonNumber' in object ? object.seasonNumber : undefined,
          'episodeNumber' in object ? object.episodeNumber : undefined
        )
      case VideoTypes.Movie:
        return new Movie(object.filePath,
          'title' in object ? object.title : undefined,
          'releaseYear' in object ? object.releaseYear : undefined
        )
      case VideoTypes.Show:
        return new Show(object.filePath,
          'title' in object ? object.title : undefined,
          'seasonNumber' in object ? object.seasonNumber : undefined,
          'episodeNumber' in object ? object.episodeNumber : undefined
        )
      case VideoTypes.Standup:
        return new Standup(object.filePath,
          'title' in object ? object.title : undefined,
          'artist' in object ? object.artist : undefined,
          'releaseYear' in object ? object.releaseYear : undefined
        )
      default:
        return new MiscVideo(object.filePath,
          'title' in object ? object.title : undefined
        )
    }
  }



  public static createVideoFromTableName(object: any, tableName: DatabaseTableNames): Video {
    switch (tableName) {
      case DatabaseTableNames.Animation:
        return new Animation(object.filePath,
          'title' in object ? object.title : undefined,
          'seasonNumber' in object ? object.seasonNumber : undefined,
          'episodeNumber' in object ? object.episodeNumber : undefined
        )
      case DatabaseTableNames.Anime:
        return new Anime(object.filePath,
          'title' in object ? object.title : undefined,
          'seasonNumber' in object ? object.seasonNumber : undefined,
          'episodeNumber' in object ? object.episodeNumber : undefined
        )
      case DatabaseTableNames.Movies:
        return new Movie(object.filePath,
          'title' in object ? object.title : undefined,
          'releaseYear' in object ? object.releaseYear : undefined
        )
      case DatabaseTableNames.Shows:
        return new Show(object.filePath,
          'title' in object ? object.title : undefined,
          'seasonNumber' in object ? object.seasonNumber : undefined,
          'episodeNumber' in object ? object.episodeNumber : undefined
        )
      case DatabaseTableNames.Standup:
        return new Standup(object.filePath,
          'title' in object ? object.title : undefined,
          'artist' in object ? object.artist : undefined,
          'releaseYear' in object ? object.releaseYear : undefined
        )
      default:
        return new MiscVideo(object.filePath,
          'title' in object ? object.title : undefined
        )
    }
  }



  public static buildVideosInValidationResponse(validationResponse: ValidationResponse): ValidationResponse {
    const VAL_RES_WITH_TRUE_VIDEO_OBJECT: Record<string, any> = {}
    VAL_RES_WITH_TRUE_VIDEO_OBJECT.tables = {}
    for (const TABLE_NAME in validationResponse.tables) {
      VAL_RES_WITH_TRUE_VIDEO_OBJECT.tables[TABLE_NAME] = []
      for (const [, MEDIA] of validationResponse.tables[TABLE_NAME].entries()) {
        const TRUE_MEDIA = VideoFactory.createVideoFromTableName(MEDIA, TABLE_NAME as DatabaseTableNames)
        if (TRUE_MEDIA instanceof Media) {
          VAL_RES_WITH_TRUE_VIDEO_OBJECT.tables[TABLE_NAME].push(TRUE_MEDIA)
        } else {
          throw new Error('Invalid media in validation response: ${JSON.stringify(trueMedia)}')
        }
      }
    }
    if (Validators.isValidationResponse(VAL_RES_WITH_TRUE_VIDEO_OBJECT)) {
      return VAL_RES_WITH_TRUE_VIDEO_OBJECT
    } else {
      throw new Error('Validation Response was formatted incorrectly.')
    }
  }
}
