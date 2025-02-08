import { SarutaLogger } from '../core/index.js'
import { Media } from '../media/media.js'
import path from 'path'
import fs from 'fs'
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
            fs.accessSync(filePath)
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
        try {
            const files = fs.readdirSync(directoryToCheck)
            var filesMatchingExtension: string[] = []

            for (const [, filePath] of files.entries()) {
                const fullPath = path.join(directoryToCheck, filePath)
                const fileExtension = path.extname(filePath)
                const stats = fs.statSync(fullPath)
            
                if (stats.isDirectory()) {
                    const nestedFiles = await FileEngine.getFilePaths(fullPath, extensionsToMatch)
                    filesMatchingExtension = filesMatchingExtension.concat(nestedFiles)
                } else {
                    const isProperFileExtension = extensionsToMatch.some(extensionToMatch => extensionToMatch === fileExtension);
                    if (isProperFileExtension) {
                        filesMatchingExtension.push(fullPath)
                        SarutaLogger.data(`Added file to be indexed`, fullPath)
                    }
                }
            }
        } catch (error) {
            throw new Error(`Failed to get file paths for: ${directoryToCheck}`, { cause: error })
        }

        return filesMatchingExtension
    }

    private static async moveStagingFilesToPath(validationResponse: ValidationResponse, landing: LandingPoints): Promise<void> {
        SarutaLogger.info(`Attempting to move files from staging to ${landing}...`)

        var count = 0
        for (const [, tableName] of Object.keys(validationResponse.tables).entries()) {
            for (var [, media] of validationResponse.tables[tableName].entries()) {
                var newFilePath: string
                if (landing === LandingPoints.Production) {
                    newFilePath = media.getProductionFilePath()
                } else if (landing === LandingPoints.Rejection) {
                    newFilePath = media.getRejectFilePath()
                } else {
                    throw new Error (`Landing point for staging files is not yet configured.`)
                }

                try {
                    fs.mkdirSync(path.dirname(newFilePath), { recursive: true })
                    fs.accessSync(media.filePath)
                    try {
                        fs.renameSync(media.filePath, newFilePath)
                    } catch {
                        SarutaLogger.info(`Cross-Disk move detected... Copying instead of renaming...`)
                        fs.copyFileSync(media.filePath, newFilePath)
                        fs.unlinkSync(media.filePath)
                    }
                    media.filePath = newFilePath
                    await FileEngine.cleanStagingDirectory()
                    count++
                } catch (error) {
                    throw new Error(`Something went wrong while trying to move staging file to ${landing}: ${media.filePath}`, { cause: error })
                }
            }
        }

        SarutaLogger.success(`${count} staging file${count > 1 ? 's' : ''} moved to production.`)
    }

    private static async cleanStagingDirectory(): Promise<void> {
        for (const [, directory] of Object.values(Configs.videoTypeDirectories.staging).entries()) {
            FileEngine.deleteEmptyDirectories(directory)
        }
    }

    private static async deleteEmptyDirectories(directory: string): Promise<boolean> {
        var files

        try {
            files = fs.readdirSync(directory)
        } catch (error) {
            return true
        }
    
        for (const file of files) {
            const fullPath = path.join(directory, file)
            var stats

            try {
                stats = fs.statSync(fullPath)
            } catch (error) {
                continue
            }
    
            if (stats.isDirectory()) {
                const isDirectoryEmpty = await FileEngine.deleteEmptyDirectories(fullPath)
                if (isDirectoryEmpty) {
                    try {
                        fs.rmdirSync(fullPath)
                    } catch {
                        // Not a genuine error
                    }
                }
            }
        }
    
        const remainingFiles = fs.readdirSync(directory)
        const isCurrentDirectoryEmpty = remainingFiles.length === 0
    
        return isCurrentDirectoryEmpty
    }
}