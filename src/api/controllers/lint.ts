import { NextFunction, Request, Response } from 'express'
import { MediaTypes } from '../../media/media.js'
import { DatabaseNames, DatabaseTableNames } from '../../configuration/db/index.js'
import { Database, FileEngine, SarutaLogger } from '../../core/index.js'
import { VideoFactory, VideoTypes } from '../../media/video/index.js'
import { Configs } from '../../configuration/configs.js'



export class LintController {

  public static async lintDatabases(req: Request, res: Response, next: NextFunction): Promise<void> {
    for (const [, DATABASE_NAME] of Object.values(Configs.databaseNames).entries()) {
      for (const [, MEDIA_TYPE] of Object.values(MediaTypes).entries()) {
        switch (MEDIA_TYPE) {
          case MediaTypes.Video:
            for (const [, VIDEO_TYPE] of Object.values(VideoTypes).entries()) {
              switch (VIDEO_TYPE) {
                case VideoTypes.Animation:
                  await LintController.removeEntriesThatNoLongerHaveCorrespondingFiles(
                    DATABASE_NAME,
                    DatabaseTableNames.Animation
                  )
                  break
                case VideoTypes.Anime:
                  await LintController.removeEntriesThatNoLongerHaveCorrespondingFiles(
                    DATABASE_NAME,
                    DatabaseTableNames.Anime
                  )
                  break
                case VideoTypes.Misc:
                  await LintController.removeEntriesThatNoLongerHaveCorrespondingFiles(
                    DATABASE_NAME,
                    DatabaseTableNames.MiscVideo
                  )
                  break
                case VideoTypes.Movie:
                  await LintController.removeEntriesThatNoLongerHaveCorrespondingFiles(
                    DATABASE_NAME,
                    DatabaseTableNames.Movies
                  )
                  break
                case VideoTypes.Show:
                  await LintController.removeEntriesThatNoLongerHaveCorrespondingFiles(
                    DATABASE_NAME,
                    DatabaseTableNames.Shows
                  )
                  break
                case VideoTypes.Standup:
                  await LintController.removeEntriesThatNoLongerHaveCorrespondingFiles(
                    DATABASE_NAME,
                    DatabaseTableNames.Standup
                  )
                  break
                default:
                  next(new Error('Trying to lint an undefined videoType.'))
              }
            }
            break
          default:
            next(new Error('Trying to lint an undefined mediaType.'))
        }
      }
    }
    SarutaLogger.success('Successfully linted all tables in all databases.')
    res.sendStatus(200)
  }


  private static async removeEntriesThatNoLongerHaveCorrespondingFiles(
    databaseName: DatabaseNames,
    tableName: DatabaseTableNames
  ): Promise<void> {
    try {
      const MEDIA_TO_CHECK = await Database.getDatabaseEntriesFromTable(databaseName, tableName)

      for (const [, MEDIA] of MEDIA_TO_CHECK.entries()) {
        if (! await FileEngine.fileExists(MEDIA.filePath)) {
          const TRUE_MEDIA = VideoFactory.createVideoFromObject(MEDIA)
          await Database.removeMediaFromTable(databaseName, TRUE_MEDIA)
        }
      }

      SarutaLogger.data('Linted', `${databaseName} -> ${tableName}`)
    } catch (error) {
      throw new Error(`Unable to lint database: ${databaseName}`, { cause: error })
    }
  }
}
