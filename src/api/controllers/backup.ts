import { Request, Response, NextFunction } from 'express'
import { Database } from '../../core/database.js'
import { Validators } from '../../core/validators.js'


export class BackupController {

  public static async backupDatabase(req: Request, res: Response, next: NextFunction): Promise<void> {

    const DATABASE_NAME = req.params.databaseName
    if (! DATABASE_NAME) {
      try {
        await Database.backupAll()
        res.status(200).send('Successfully backed up all databases.\n')
      } catch (error) {
        res.sendStatus(500)
        next(error)
      }

    } else {
      if (Validators.isDatabaseName(DATABASE_NAME)) {
        try {
          await Database.backup(DATABASE_NAME)
          res.status(200).send(`Successfully backed up database: ${DATABASE_NAME}\n`)
        } catch (error) {
          res.sendStatus(500)
          next(error)
        }

      } else {
        res.sendStatus(500)
        next('Sent an invalid database name.')
      }
    }
  }
}
