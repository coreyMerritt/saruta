import axios, { AxiosInstance } from 'axios'
import { FileEngine } from './file_engine.js'
import axiosRetry from 'axios-retry'
import { Paths } from './configuration.js'
import path from 'path'



export class AxiosEngine {

  private protocol = 'http'
  private host = 'localhost'
  private port = process.env.LIKI_PORT
  private url = `${this.protocol}://${this.host}:${this.port}`
  private instance = this.createCustomAxios()



  public async startIndexing(): Promise<void> {
    try {
      const REPLY = await this.instance.post('/index/staging')
      console.log(REPLY.data)
    } catch (error) {
      throw new Error('Failed to start indexing.', { cause: error })
    }
  }



  public async startDatabaseBackups(): Promise<void> {
    const REPLY = await this.instance.post('/backup')
    console.log(REPLY.data)
  }



  public async getMediaPendingValidation(): Promise<object> {
    try {
      const RAW_GET = await this.instance.get('/validation/pending')
      const GET_DATA = RAW_GET.data
      console.log(RAW_GET.status)

      return GET_DATA
    } catch (error) {
      throw new Error('Server did not respond to GET.', { cause: error })
    }
  }



  public async postStagingValidationResults(filePath: Paths): Promise<void> {
    const FILE_ENGINE = new FileEngine()
    const VALIDATION_RESULTS = await FILE_ENGINE.readYamlFileToObject(filePath)
    if (! VALIDATION_RESULTS) {
      console.warn(`No staging validation results to post for ${path.basename(filePath)}, trying anyway...`)
    }
    try {
      if (filePath === Paths.AcceptedValidation) {
        const REPLY = await this.instance.post('/validation/accepted', VALIDATION_RESULTS)
        console.log(`${REPLY.status}: ${REPLY.data}`)
      } else {
        const REPLY = await this.instance.post('/validation/rejected', VALIDATION_RESULTS)
        console.log(`${REPLY.status}: ${REPLY.data}`)
      }
    } catch (error) {
      throw new Error(`Unable to post ${filePath}`, { cause: error })
    }
  }



  private createCustomAxios(): AxiosInstance {
    try {
      const AXIOS_INSTANCE = axios.create({
        baseURL: this.url,
        timeout: 9999,
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      })
      axiosRetry(AXIOS_INSTANCE, { retries: 9999 })

      return AXIOS_INSTANCE
    } catch (error) {
      throw new Error('Failed to initiate an axios instance.', { cause: error })
    }
  }
}
