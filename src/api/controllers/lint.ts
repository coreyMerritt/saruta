import { NextFunction, Request, Response } from 'express'
import { Media, MediaTypes } from '../../media/media.js'
import { DatabaseNames, DatabaseTableNames } from '../../configuration/db/index.js'
import { Database, FileEngine, SarutaLogger, Validators } from '../../core/index.js'
import { Video, VideoFactory, VideoTypes } from '../../media/video/index.js'
import { Configs } from '../../configuration/configs.js'
import { VideoTypeDirectories } from '../../configuration/directories/video_type_directories.js'


export class LintController {
    
    public static async lintDatabases(req: Request, res: Response, next: NextFunction) {

        for (const [, databaseName] of Object.values(Configs.databaseNames).entries()) {
            for (const [, mediaType] of Object.values(MediaTypes).entries()) {
                switch (mediaType) {
                    case MediaTypes.Video:
                        for (const [, videoType] of Object.values(VideoTypes).entries()) {
                            switch (videoType) {
                                case VideoTypes.Animation:
                                    await LintController.removeEntriesThatNoLongerHaveCorrespondingFiles(databaseName, DatabaseTableNames.Animation)
                                    break
                                case VideoTypes.Anime:
                                    await LintController.removeEntriesThatNoLongerHaveCorrespondingFiles(databaseName, DatabaseTableNames.Anime)
                                    break
                                case VideoTypes.Misc:
                                    await LintController.removeEntriesThatNoLongerHaveCorrespondingFiles(databaseName, DatabaseTableNames.MiscVideo)
                                    break
                                case VideoTypes.Movie:
                                    await LintController.removeEntriesThatNoLongerHaveCorrespondingFiles(databaseName, DatabaseTableNames.Movies)
                                    break
                                case VideoTypes.Show:
                                    await LintController.removeEntriesThatNoLongerHaveCorrespondingFiles(databaseName, DatabaseTableNames.Shows)
                                    break
                                case VideoTypes.Standup:
                                    await LintController.removeEntriesThatNoLongerHaveCorrespondingFiles(databaseName, DatabaseTableNames.Standup)
                                    break
                                default:
                                    console.debug(videoType)
                                    next(new Error(`Trying to lint an undefined videoType.`))
                            }
                        }
                        break
                    default:
                        next(new Error(`Trying to lint an undefined mediaType.`))
                }
            }
        }
        SarutaLogger.success('Successfully linted all tables in all databases.')
        res.sendStatus(200)
    }

    private static async removeEntriesThatNoLongerHaveCorrespondingFiles(databaseName: DatabaseNames, tableName: DatabaseTableNames): Promise<void> {
        try {
            const mediaToCheck = await Database.getDatabaseEntriesFromTable(databaseName, tableName)

            for (const [, media] of mediaToCheck.entries()) {
                console.debug(`media.filePath ${media.filePath}`)
                if (! await FileEngine.fileExists(media.filePath)) {
                    console.debug("~~~~~~~~~ DOES NOT EXIST ~~~~~~~~~~~~~~~~~")
                    const trueMedia = VideoFactory.createVideoFromObject(media)
                    await Database.removeMediaFromTable(databaseName, trueMedia)
                }
            }

            SarutaLogger.data('Linted', `${databaseName} -> ${tableName}`)
        } catch (error) {
            throw new Error(`Unable to lint database: ${databaseName}`, { cause: error })
        }
    }
}