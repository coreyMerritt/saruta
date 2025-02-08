import yaml from 'yaml'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'
import { Paths } from './configuration.js'
import { SarutaTime } from '../../src/core/saruta_time.js'


export class FileEngine {

    public async readYamlFileToObject(path: Paths): Promise<object> {
        try {
            const fileContents = (await fs.readFile(path)).toString()
            const fileContentsObject = await yaml.parse(fileContents)
            return fileContentsObject
        } catch (error) {
            throw new Error(`Failed to read accepted media. Likely bad path or path is not yaml.`, { cause: error })
        }
    }

    public async backupAcceptedValidationFile(): Promise<void> {
        try {
            this.backupFile(Paths.PendingValidation, Paths.PendingValidationBackup)
            this.backupFile(Paths.AcceptedValidation, Paths.AcceptedValidationBackup)
        } catch {
            // File does not exist, no need to back up.
        }
    }

    public async backupRejectedValidationFile(): Promise<void> {
        try {
            this.backupFile(Paths.PendingValidation, Paths.PendingValidationBackup)
            this.backupFile(Paths.RejectedValidation, Paths.RejectedValidationBackup)
        } catch {
            // File does not exist, no need to back up.
        }
    }

    public async backupAllValidationFiles(): Promise<void> {
        try {
            this.backupFile(Paths.PendingValidation, Paths.PendingValidationBackup)
            this.backupFile(Paths.AcceptedValidation, Paths.AcceptedValidationBackup)
            this.backupFile(Paths.RejectedValidation, Paths.RejectedValidationBackup)
        } catch {
            // File does not exist, no need to back up.
        }
    }

    public async truncateAcceptedValidationFile(): Promise<void> {
        fsSync.truncateSync(Paths.PendingValidation)
        fsSync.truncateSync(Paths.AcceptedValidation)
    }

    public async truncateRejectedValidationFile(): Promise<void> {
        fsSync.truncateSync(Paths.PendingValidation)
        fsSync.truncateSync(Paths.RejectedValidation)
    }

    public async truncateAllValidationFiles(): Promise<void> {
        fsSync.truncateSync(Paths.PendingValidation)
        fsSync.truncateSync(Paths.AcceptedValidation)
        fsSync.truncateSync(Paths.RejectedValidation)
    }

    public async writeObjectAsYaml(object: object): Promise<void> {
        try {
            const pendingStagingMediaAsYamlString = yaml.stringify(object)
            await fs.writeFile(Paths.PendingValidation, pendingStagingMediaAsYamlString)
            console.log(`Wrote pending staging media to: ${Paths.PendingValidation}`)
        } catch (error) {
            throw new Error(`Unable to write pending staging media to: ${Paths.PendingValidation}`, { cause: error })
        }
    }

    private async isPopulatedYaml(filePath: string): Promise<boolean> {
        if (this.isYaml(filePath)) {
            try {
                const fileInfo = await fs.stat(filePath)
                if (fileInfo.size > 0) {
                    return true
                } else {
                    return false
                }
            } catch (error) {
                throw new Error(`Unable to check info on file: ${filePath}`, { cause: error })
            }
        } else {
            return false
        }
    }

    private backupFile(originalPath: Paths, backupPath: Paths): void {
        try {
            const originalFileContent = this.readFileAsString(originalPath)
            const newFileDirectory = path.dirname(backupPath)
            const newFileName = path.basename(backupPath)
            const newFilePath = `${newFileDirectory}/${SarutaTime.getCurrentDateTime(true)}---${newFileName}`
            fsSync.writeFileSync(newFilePath, originalFileContent)
        } catch (error) {
            throw new Error(`Failed to back up file: ${originalPath} to ${backupPath}`, { cause: error })
        }
    }

    private readFileAsString(path: Paths): string {
        try {
            const fileBuffer = fsSync.readFileSync(path)
            const fileString = String(fileBuffer)
            return fileString
        } catch (error) {
            throw new Error(`Unable to read as string: ${path}`, { cause: error })
        }
    }

    private fileExists(filePath: string): boolean {
        try {
            fsSync.accessSync(filePath)
            return true
        } catch {
            return false
        }
    }

    private isYaml(filePath: string): boolean {
        if (this.fileExists(filePath)) {
            try {
                yaml.parse(filePath)
                return true
            } catch {
                return false
            }
        } else {
            return false
        }
    }
}