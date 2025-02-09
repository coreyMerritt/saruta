import { SarutaLogger } from '../core/saruta_logger.js'



export class ErrorMiddleware {
  public static async execute(error: Error): Promise<void> {
    SarutaLogger.error(error)
  }
}
