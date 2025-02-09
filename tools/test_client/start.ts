import { Directories, Paths } from './configuration.js'
import fsSync from 'fs'
import { Menus } from './menus.js'



class Startup {

  public async execute(): Promise<void> {
    try {
      this.createDirectoriesAndFiles()
      await new Menus().main()
    } catch (error) {
      console.error(error)
    }
  }



  private createDirectoriesAndFiles(): void {
    try {
      for (const [, DIR] of Object.values(Directories).entries()) {
        fsSync.mkdirSync(DIR, { recursive: true })
      }

      for (const [, FILE_PATH] of Object.values(Paths).entries()) {
        try {
          fsSync.accessSync(FILE_PATH)
        } catch {
          fsSync.writeFileSync(FILE_PATH, '')
        }
      }
    } catch (error) {
      throw new Error('Failed to create directories and files.', { cause: error })
    }
  }
}

new Startup().execute()
