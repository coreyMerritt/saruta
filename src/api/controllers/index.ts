import { NextFunction, Request, Response } from 'express'
import { VideoFactory, VideoTypes } from '../../media/video/index.js'
import { AI, Database, FileEngine, SarutaLogger, Validators } from '../../core/index.js'
import { Media } from '../../media/media.js'
import { Configs } from '../../configuration/configs.js'


export class IndexController {

    public static async indexStagingDatabase(req: Request, res: Response, next: NextFunction) {
        
        try {
            const videoType = req.params.videoType
            var count: number

            if (!videoType) {
                count = await IndexController.indexAllStagingDirectories()
                res.status(200).send(`Successfully indexed ${count} files.\n`)
            } else if (Validators.isVideoType(videoType)) {
                const nullVideo = VideoFactory.createNullFromVideoType(videoType)
                count = await IndexController.indexOneStagingDirectory(nullVideo)
                res.status(200).send(`Successfully indexed ${count} files.\n`)
            } else {
                res.sendStatus(500)
                next(new Error(`Passed an invalid video type.`))
            }

        } catch (error) {
            res.sendStatus(500)
            next(error)
        }
    }



    private static async indexAllStagingDirectories(): Promise<number> {
        var count = 0

        const nullAnimation = VideoFactory.createNullFromVideoType(VideoTypes.Animation)
        count += await this.indexOneStagingDirectory(nullAnimation)

        const nullAnime = VideoFactory.createNullFromVideoType(VideoTypes.Anime)
        count += await this.indexOneStagingDirectory(nullAnime)

        const nullMovie = VideoFactory.createNullFromVideoType(VideoTypes.Movie)
        count += await this.indexOneStagingDirectory(nullMovie)

        const nullShow = VideoFactory.createNullFromVideoType(VideoTypes.Show)
        count += await this.indexOneStagingDirectory(nullShow)

        const nullStandup = VideoFactory.createNullFromVideoType(VideoTypes.Standup)
        count += await this.indexOneStagingDirectory(nullStandup)

        const nullMiscVideo = VideoFactory.createNullFromVideoType(VideoTypes.Misc)
        count += await this.indexOneStagingDirectory(nullMiscVideo)
        
        SarutaLogger.success(`${count} staging file${count === 1 ? '' : 's'} indexed in total.`)
        return count
    }

    private static async indexOneStagingDirectory(nullMedia: Media): Promise<number> {
        var count = 0

        try {
            const filePaths = await FileEngine.getFilePaths(nullMedia.getStagingDirectory(), nullMedia.getFileExtensions())
            const filteredFilePaths = await Database.removeAlreadyIndexedFilePaths(Configs.databaseNames.staging, filePaths)
            if (filePaths.length > 0) {
                const media = await AI.parseAllMediaData(filteredFilePaths, nullMedia.getPrompt())
                if (media.length > 0) {
                    const indexCount = await Database.indexFilesIntoStagingDatabase(media)
                    indexCount ? count = indexCount : undefined
                }
            }

        } catch (error) {
            throw new Error(`Unable to index staging directory: ${nullMedia.getStagingDirectory()}`, { cause: error })
        }

        SarutaLogger.success(`${count} staging file${count === 1 ? '' : 's'} indexed inside: ${nullMedia.getStagingDirectory()}`)
        return count
    }
}