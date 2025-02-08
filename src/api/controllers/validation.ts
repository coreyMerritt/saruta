import { NextFunction, Request, Response } from 'express'
import { Database, FileEngine, SarutaLogger, ValidationRequest, Validators } from '../../core/index.js'
import { DatabaseTableNames } from '../../configuration/db/index.js'
import { VideoFactory } from '../../media/video/index.js'
import { Configs } from '../../configuration/configs.js'


export class ValidationController {

    public static async getValidationRequest(req: Request, res: Response, next: NextFunction) {
        try {
            var validationRequest: ValidationRequest = { tables: {} }
        
           for (const [, tableName] of Object.values(DatabaseTableNames).entries()) {
                validationRequest.tables[tableName] = []
                const results = await Database.getDatabaseEntriesFromTable(Configs.databaseNames.staging, tableName)
                for (const [, media] of results.entries()) {
                    if (Validators.isMedia(media)) {
                        validationRequest.tables[tableName].push(media)
                    }
                }
            }

            res.status(200).send(validationRequest)
            SarutaLogger.success(`Sent validation request.`)

        } catch (error) {
            res.sendStatus(500)
            next(error)
        }
    }

    public static async postAcceptedValidationResponse(req: Request, res: Response, next: NextFunction) {
        try {

            const originalValidationResponse = VideoFactory.buildVideosInValidationResponse(structuredClone(req.body))
            const validationResponseWithUpdatedFilePaths = VideoFactory.buildVideosInValidationResponse(structuredClone(req.body))
            if (Validators.isAcceptedValidationResponse(originalValidationResponse)) {
                await FileEngine.moveStagingFilesToProduction(validationResponseWithUpdatedFilePaths)
                await Database.moveStagingDatabaseEntriesToProduction(originalValidationResponse, validationResponseWithUpdatedFilePaths)
                res.status(200).send('Successfully processed accepted entries.\n')
            } else {
                res.status(500).send(`Invalid data type.\n`)
                next(`Data sent is not a proper validation request.`)
            }

        } catch (error) {
            res.sendStatus(500)
            next(error)
        }
    }

    public static async postRejectedValidationResponse(req: Request, res: Response, next: NextFunction) {
        try {
            const originalValidationResponse = VideoFactory.buildVideosInValidationResponse(structuredClone(req.body))
            const validationResponseWithUpdatedFilePaths = VideoFactory.buildVideosInValidationResponse(structuredClone(req.body))
            if (Validators.isValidationResponse(originalValidationResponse)) {
                await FileEngine.moveStagingFilesToRejected(validationResponseWithUpdatedFilePaths)
                await Database.moveStagingDatabaseEntriesToRejected(originalValidationResponse, validationResponseWithUpdatedFilePaths)
                res.status(200).send('Successfully processed rejected entries.\n')
            } else {
                res.status(500).send(`Invalid data type.\n`)
                next(`Data sent is not a proper validation request.`)
            }

        } catch (error) {
            res.sendStatus(500)
            next(error)
        }
    }
}