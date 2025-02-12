import { SarutaLogger } from '../core/index.js'
import { Media } from '../media/media.js'
import path from 'path'
import fs from 'fs/promises'
import { Configs } from '../configuration/configs.js'



interface TableRequest {
    [tableName: string]: Media[]
}



interface TableResponse {
    [tableName: string]: Media[]
}



export interface ValidationRequest {
    tables: TableRequest
}



export interface ValidationResponse {
    tables: TableResponse
}



enum LandingPoints {
    Staging = 'staging',
    Production = 'production',
    Rejection = 'rejection'
}



export class FileEngine {

  public static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)

      return true
    } catch {
      return false
    }
  }



  public static async moveStagingFilesToProduction(validationResponse: ValidationResponse): Promise<void> {
    await FileEngine.moveStagingFilesToPath(validationResponse, LandingPoints.Production)
  }



  public static async moveStagingFilesToRejected(validationResponse: ValidationResponse): Promise<void> {
    await FileEngine.moveStagingFilesToPath(validationResponse, LandingPoints.Rejection)
  }



  public static async getFilePaths(directoryToCheck: string, extensionsToMatch: string[]): Promise<string[]> {
    const FILE_MATCHING_EXTENSION: string[] = []

    try {
      const FILES = await fs.readdir(directoryToCheck)

      for (const [, FILE_NAME] of FILES.entries()) {
        const FILE_PATH = path.join(directoryToCheck, FILE_NAME)
        const FILE_EXT = path.extname(FILE_NAME)
        const STATS = await fs.stat(FILE_PATH)

        if (STATS.isDirectory()) {
          const NESTED_FILES = await FileEngine.getFilePaths(FILE_PATH, extensionsToMatch)
          FILE_MATCHING_EXTENSION.push(...NESTED_FILES)
        } else {
          const IS_PROPER_FILE_EXT =
            extensionsToMatch.some(
              (extensionToMatch: string) => extensionToMatch === FILE_EXT
            )
          if (IS_PROPER_FILE_EXT) {
            FILE_MATCHING_EXTENSION.push(FILE_PATH)
            SarutaLogger.data('Added file to be indexed.', FILE_PATH)
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to get file paths for: ${directoryToCheck}`, { cause: error })
    }

    return FILE_MATCHING_EXTENSION
  }



  private static async moveStagingFilesToPath(
    validationResponse: ValidationResponse,
    landing: LandingPoints
  ): Promise<void> {

    for (const [, TABLE_NAME] of Object.keys(validationResponse.tables).entries()) {
      SarutaLogger.data('Attempting to move files to', TABLE_NAME)
      let count = 0
      for (const [, MEDIA] of validationResponse.tables[TABLE_NAME].entries()) {
        let newFilePath: string
        if (landing === LandingPoints.Production) {
          newFilePath = MEDIA.getProductionFilePath()
        } else if (landing === LandingPoints.Rejection) {
          newFilePath = MEDIA.getRejectFilePath()
        } else {
          throw new Error ('Landing point for staging files is not yet configured.')
        }


        try {
          await FileEngine.moveFileTo(MEDIA.filePath, newFilePath)
          MEDIA.filePath = newFilePath
          count ++
          SarutaLogger.data(`Moved to ${landing}`, MEDIA.title)
        } catch (error) {
          SarutaLogger.error(
            Error(
              `Failed to move file: ${MEDIA.filePath}`,
              { cause: error }
            )
          )
        }
      }

      SarutaLogger.data(
        `${TABLE_NAME} file${count > 1 ? 's' : ''} moved to ${landing}`,
        String(count)
      )
    }
  }



  private static async moveFileTo(oldFilePath: string, newFilePath: string): Promise<void> {
    try {
      await fs.mkdir(path.dirname(newFilePath), { recursive: true })
      await fs.access(oldFilePath)

      try {
        await fs.rename(oldFilePath, newFilePath)
      } catch {
        SarutaLogger.info('Cross-Disk move detected... Copying instead of renaming...')
        await fs.copyFile(oldFilePath, newFilePath)
        await fs.unlink(oldFilePath)
        FileEngine.cleanStagingDirectory()
      }
    } catch (error) {
      SarutaLogger.error(Error(`File operation failed: ${newFilePath}`, { cause: error }))
      throw error
    }
  }




  private static async cleanStagingDirectory(): Promise<void> {
    for (const [, DIRECTORY] of Object.values(Configs.videoTypeDirectories.staging).entries()) {
      FileEngine.deleteEmptyDirectories(DIRECTORY)
    }
  }



  private static async deleteEmptyDirectories(directory: string): Promise<boolean> {
    let files: string[]

    try {
      files = await fs.readdir(directory)
    } catch {
      return true
    }

    for (const FILE of files) {
      const FILE_PATH = path.join(directory, FILE)
      let stats

      try {
        stats = await fs.stat(FILE_PATH)
      } catch {
        continue
      }

      if (stats.isDirectory()) {
        const IS_DIR_EMPTY = await FileEngine.deleteEmptyDirectories(FILE_PATH)
        if (IS_DIR_EMPTY) {
          try {
            await fs.rmdir(FILE_PATH)
          } catch {
            // Not a genuine error
          }
        }
      }
    }

    const REMAINING_FILES = await fs.readdir(directory)
    const IS_CURRENT_DIR_EMPTY = REMAINING_FILES.length === 0

    return IS_CURRENT_DIR_EMPTY
  }
}
