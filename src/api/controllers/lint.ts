import { NextFunction, Request, Response } from 'express'
import { Database, SarutaLogger } from '../../core/index.js'



export class LintController {

  public static async lintDatabases(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await Database.lintAll()
      SarutaLogger.success('Successfully linted all tables in all databases.')
      res.sendStatus(200)
    } catch (error) {
      next(error)
    }
  }

  // TODO: lintFiles
}
