import { NextFunction, Request, Response } from 'express'
import { VideoFactory, VideoTypes } from '../../media/video/index.js'
import { Database, FileEngine, GAI, SarutaLogger, Validators } from '../../core/index.js'
import { Media } from '../../media/media.js'
import { Configs } from '../../configuration/configs.js'


export class IndexController {

  public static async indexStagingDatabase(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {
      const VIDEO_TYPE = req.params.videoType

      if (! VIDEO_TYPE) {
        res.sendStatus(200)
        await IndexController.indexAllStagingDirectories()
      } else if (Validators.isVideoType(VIDEO_TYPE)) {
        const NULL_VIDEO = VideoFactory.createNullFromVideoType(VIDEO_TYPE)
        res.sendStatus(200)
        await IndexController.indexOneStagingDirectory(NULL_VIDEO)
      } else {
        res.sendStatus(500)
        next(new Error('Passed an invalid video type.'))
      }

    } catch (error) {
      res.sendStatus(500)
      next(error)
    }
  }



  private static async indexAllStagingDirectories(): Promise<number> {
    let count = 0

    const NULL_ANIMATION = VideoFactory.createNullFromVideoType(VideoTypes.Animation)
    count += await this.indexOneStagingDirectory(NULL_ANIMATION)

    const NULL_ANIME = VideoFactory.createNullFromVideoType(VideoTypes.Anime)
    count += await this.indexOneStagingDirectory(NULL_ANIME)

    const NULL_MOVIE = VideoFactory.createNullFromVideoType(VideoTypes.Movie)
    count += await this.indexOneStagingDirectory(NULL_MOVIE)

    const NULL_SHOW = VideoFactory.createNullFromVideoType(VideoTypes.Show)
    count += await this.indexOneStagingDirectory(NULL_SHOW)

    const NULL_STANDUP = VideoFactory.createNullFromVideoType(VideoTypes.Standup)
    count += await this.indexOneStagingDirectory(NULL_STANDUP)

    const NULL_MISC_VIDEO = VideoFactory.createNullFromVideoType(VideoTypes.Misc)
    count += await this.indexOneStagingDirectory(NULL_MISC_VIDEO)

    const PLURAL = count > 1 ? 's' : ''
    SarutaLogger.success(`${count} staging file${PLURAL} indexed in total.`)

    return count
  }



  private static async indexOneStagingDirectory(nullMedia: Media): Promise<number> {
    let count = 0

    try {
      const FILE_PATHS = await FileEngine.getFilePaths(nullMedia.getStagingDirectory(), nullMedia.getFileExtensions())
      const FILTERED_FILE_PATHS =
        await Database.removeAlreadyIndexedFilePaths(Configs.databaseNames.staging, FILE_PATHS)
      if (FILE_PATHS.length > 0) {
        const MEDIA = await GAI.parseAllMediaData(FILTERED_FILE_PATHS, nullMedia.getPrompt())
        if (MEDIA.length > 0) {
          const INDEX_COUNT = await Database.indexFilesIntoStagingDatabase(MEDIA)
          INDEX_COUNT ? count = INDEX_COUNT : undefined
        }
      }

    } catch (error) {
      throw new Error(`Unable to index staging directory: ${nullMedia.getStagingDirectory()}`, { cause: error })
    }

    SarutaLogger.data(
      `Staging file${count === 1 ? '' : 's'} indexed in "${nullMedia.getStagingDirectory()}":`,
      String(count)
    )

    return count
  }
}
