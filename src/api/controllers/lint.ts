import { NextFunction, Request, Response } from 'express'
import { Media, MediaTypes } from '../../media/media'
import { DatabaseNames, DatabaseTableNames } from '../../configuration/db'
import { Database, FileEngine, SarutaLogger, Validators } from '../../core'
import { Video, VideoFactory, VideoTypes } from '../../media/video'
import { Configs } from '../../configuration/configs'


export class LintController {
    
    public static async lintDatabase(req: Request, res: Response, next: NextFunction) {
        const databaseName = req.params.databaseName
        const mediaType = req.params.mediaType
        const secondaryType = req.params.videoType

        var databaseNamesToLint: DatabaseNames[] = []
        if (databaseName && Validators.isDatabaseName(databaseName)) {
            databaseNamesToLint.push(databaseName)
        } else {
            databaseNamesToLint = Object.values(Configs.databaseNames)
        }

        for (const [, databaseName] of databaseNamesToLint.entries()) {
            if (!mediaType) {
                await this.removeEntriesThatNoLongerHaveCorrespondingFiles(databaseName)
                res.status(200).send(`Successfully linted: ${databaseName}`)
    
            } else {
                if (!Validators.isMediaType(mediaType)) {
                    res.sendStatus(500)
                    next(new Error(`Was given an invalid media type.`))
                } else if (!secondaryType) {
                    res.sendStatus(500)
                    next(new Error(`Was not given a secondary type.`))
                }
    
                switch (mediaType) {
                    case MediaTypes.Video:
                        if (!Validators.isVideoType(secondaryType)) {
                            res.sendStatus(500)
                            next(new Error(`secondary type is not a valid video type.`))
                            break
    
                        } else {
                            try {
                                await this.removeEntriesThatNoLongerHaveCorrespondingFiles(databaseName, Video.getTableNameFromVideoType(secondaryType))
                                res.status(200).send(`Successfully linted: ${secondaryType}`)
                                break
                            } catch (error) {
                                res.sendStatus(500)
                                next(new Error(`Failed to lint: ${secondaryType}`))
                                break
                            }
                        }
                }
            }
        }
    }

    private static async removeEntriesThatNoLongerHaveCorrespondingFiles(databaseName: DatabaseNames, tableName?: DatabaseTableNames): Promise<void> {
        if (!tableName) {
            SarutaLogger.info(`Removing invalid entries from: ${databaseName}`)
        }

        try {
            var mediaToCheck: Media[] = []
            
            if (tableName && Validators.isDatabaseTable(tableName)) {
                const mediaInTable = await Database.getDatabaseEntriesFromTable(databaseName, tableName)
                mediaToCheck = mediaInTable
            } else {
                var allMediaInDatabase: Media[] = []
                for (const [, tableName] of Object.values(DatabaseTableNames).entries()) {
                    allMediaInDatabase = allMediaInDatabase.concat(await Database.getDatabaseEntriesFromTable(databaseName, tableName))
                }
                mediaToCheck = allMediaInDatabase
            }

            for (const [, media] of mediaToCheck.entries()) {
                if (!FileEngine.fileExists(media.filePath)) {
                    const trueMedia = VideoFactory.createVideoFromObject(media)
                    await Database.removeMediaFromTable(databaseName, trueMedia)
                }
            }

            SarutaLogger.success(`Successfully linted database: ${databaseName}`)

        } catch (error) {
            throw new Error(`Unable to lint database: ${databaseName}`, { cause: error })
        }
    }
}