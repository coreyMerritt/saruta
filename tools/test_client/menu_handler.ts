import { AxiosEngine } from './axios_engine.js'
import { Paths } from './configuration.js'
import { FileEngine } from './file_engine.js'
import readline from 'readline/promises'



export enum MainMenuAnswers {
    Exit = 'exit',
    Backup = '0',
    Index = '1',
    GetMediaPendingValidation = '2',
    PostValidationResults = '3'
}



export class MenuHandler {

  public async getUserInput(question: string, acceptableAnswers: string[]): Promise<string> {
    try {
      const INPUT = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
      let userAnswer: string = ''
      let firstLoop = true
      while (! acceptableAnswers.includes(userAnswer)) {
        ! firstLoop ? console.error('Invalid input.') : undefined
        firstLoop = false
        userAnswer = (await INPUT.question(question)).trim().toLowerCase()
        process.stdout.write('\n')
      }
      INPUT.close()

      return userAnswer
    } catch {
      throw new Error('Unable to take in user input.\n')
    }
  }



  public exit(): Promise<void> {
    process.exit(0)
  }



  public async backupDatabases(axios: AxiosEngine): Promise<void> {
    try {
      await axios.startDatabaseBackups()
    } catch (error) {
      throw new Error('Failed to start database backups.', { cause: error })
    }
  }



  public async indexStagingMedia(axios: AxiosEngine): Promise<void> {
    try {
      await axios.startIndexing()
    } catch (error) {
      throw new Error('Failed to start indexing staged media.', { cause: error })
    }
  }



  public async getMediaPendingValidation(axios: AxiosEngine, fileEngine: FileEngine): Promise<void> {
    try {
      const MEDIA_PENDING_VALIDATION = await axios.getMediaPendingValidation()
      if (MEDIA_PENDING_VALIDATION) {
        await fileEngine.backupAllValidationFiles()
        await fileEngine.writeObjectAsYaml(MEDIA_PENDING_VALIDATION)
      } else {
        console.log('No pending staging media.')
      }
    } catch (error) {
      throw new Error('Failed to retrieve media pending validation.', { cause: error })
    }
  }



  public async postAcceptedValidationResults(axios: AxiosEngine, fileEngine: FileEngine): Promise<void> {
    try {
      await fileEngine.backupAcceptedValidationFile()
      await axios.postStagingValidationResults(Paths.AcceptedValidation)
      await fileEngine.truncateAcceptedValidationFile()
    } catch (error) {
      throw new Error('Failed to post validation results.', { cause: error })
    }
  }



  public async postRejectedValidationResults(axios: AxiosEngine, fileEngine: FileEngine): Promise<void> {
    try {
      await fileEngine.backupRejectedValidationFile()
      await axios.postStagingValidationResults(Paths.RejectedValidation)
      await fileEngine.truncateRejectedValidationFile()
    } catch (error) {
      throw new Error('Failed to post validation results.', { cause: error })
    }
  }



  public async postAllValidationResults(axios: AxiosEngine, fileEngine: FileEngine): Promise<void> {
    try {
      await fileEngine.backupAllValidationFiles()
      await axios.postStagingValidationResults(Paths.AcceptedValidation)
      await axios.postStagingValidationResults(Paths.RejectedValidation)
      await fileEngine.truncateAllValidationFiles()
    } catch (error) {
      throw new Error('Failed to post validation results.', { cause: error })
    }
  }



  public defaultMain(): void {
    console.error('Invalid Input.')
  }
}
