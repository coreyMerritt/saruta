import { NextFunction, Request, Response } from 'express'
import { Database, FileEngine, SarutaLogger, ValidationRequest, Validators } from '../../core/index.js'
import { DatabaseTableNames } from '../../configuration/db/index.js'
import { VideoFactory } from '../../media/video/index.js'
import { Configs } from '../../configuration/configs.js'



export class ValidationController {

  public static async getValidationRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const VALIDATION_REQUEST: ValidationRequest = { tables: {} }

      for (const [, TABLE_NAME] of Object.values(DatabaseTableNames).entries()) {
        VALIDATION_REQUEST.tables[TABLE_NAME] = []
        const RESULTS = await Database.getDatabaseEntriesFromTable(Configs.databaseNames.staging, TABLE_NAME)
        for (const [, MEDIA] of RESULTS.entries()) {
          if (Validators.isMedia(MEDIA)) {
            VALIDATION_REQUEST.tables[TABLE_NAME].push(MEDIA)
          }
        }
      }

      res.status(200).send(VALIDATION_REQUEST)
      SarutaLogger.success('Sent validation request.')

    } catch (error) {
      res.sendStatus(500)
      next(error)
    }
  }



  public static async postAcceptedValidationResponse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ORIGINAL_VALIDATION_RESPONSE = VideoFactory.buildVideosInValidationResponse(structuredClone(req.body))
      const VAL_RES_WITH_UPDATE_FILE_PATHS = VideoFactory.buildVideosInValidationResponse(structuredClone(req.body))
      if (Validators.isAcceptedValidationResponse(ORIGINAL_VALIDATION_RESPONSE)) {
        res.sendStatus(200)
        await FileEngine.moveStagingFilesToProduction(VAL_RES_WITH_UPDATE_FILE_PATHS)
        await Database.moveStagingDatabaseEntriesToProduction(
          ORIGINAL_VALIDATION_RESPONSE,
          VAL_RES_WITH_UPDATE_FILE_PATHS
        )
      } else {
        res.status(500).send('Invalid data type.\n')
        next('Data sent is not a proper validation request.')
      }

    } catch (error) {
      next(error)
    }
  }



  public static async postRejectedValidationResponse(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ORIGINAL_VALIDATION_RESPONSE = VideoFactory.buildVideosInValidationResponse(structuredClone(req.body))
      const VAL_RES_WITH_UPDATE_FILE_PATHS = VideoFactory.buildVideosInValidationResponse(structuredClone(req.body))
      if (Validators.isValidationResponse(ORIGINAL_VALIDATION_RESPONSE)) {
        res.sendStatus(200)
        await FileEngine.moveStagingFilesToRejected(VAL_RES_WITH_UPDATE_FILE_PATHS)
        await Database.moveStagingDatabaseEntriesToRejected(
          ORIGINAL_VALIDATION_RESPONSE,
          VAL_RES_WITH_UPDATE_FILE_PATHS
        )
      } else {
        res.status(500).send('Invalid data.\n')
        next('Data sent is not a proper validation request.')
      }

    } catch (error) {
      next(error)
    }
  }
}
