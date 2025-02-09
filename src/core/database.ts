import { SarutaLogger } from './saruta_logger.js'
import { SarutaTime } from './saruta_time.js'
import { DatabaseNames, DatabaseTableNames } from '../configuration/db/index.js'
import { Sequelize, QueryTypes } from 'sequelize'
import { promisify } from 'util'
import { exec } from 'child_process'
import { Media } from '../media/media.js'
import { MediaFactory } from '../media/media_factory.js'
import { Validators } from './validators.js'
import { ValidationResponse } from './file_engine.js'
import { Configs } from '../configuration/configs.js'



export class Database {

  private static stagingDatabase: Sequelize
  private static productionDatabase: Sequelize
  private static rejectionDatabase: Sequelize



  public static async initialize(): Promise<void> {
    Database.stagingDatabase = await Database.loadDatabase(Configs.databaseNames.staging)
    Database.productionDatabase = await Database.loadDatabase(Configs.databaseNames.production)
    Database.rejectionDatabase = await Database.loadDatabase(Configs.databaseNames.rejection)
  }



  public static async backupAll(): Promise<void> {
    for (const [, DATABASE_NAME] of Object.values(Configs.databaseNames).entries()) {
      Database.backup(DATABASE_NAME)
    }
  }



  public static async backup(databaseName: DatabaseNames): Promise<void> {
    const EXEC_ASYNC = promisify(exec)
    try {
      // TODO: May have broken this.
      await EXEC_ASYNC(
        `mysqldump -u ${Configs.databaseInfo.username}` +
        `-p${Configs.databaseInfo.password} ${databaseName} ` +
        `> "${Configs.backupDirectories.out}/${databaseName}___${SarutaTime.getCurrentDateTime(true)}".sql`
      )
      SarutaLogger.success(`Backed up database: ${databaseName}.`)
    } catch (error) {
      throw new Error(`Failed to back up database: ${databaseName}`, { cause: error })
    }
  }



  public static async removeMediaFromTable(databaseName: DatabaseNames, media: Media): Promise<void> {
    try {
      await Database.deleteFromTableWhereOneEqualsTwo(
        databaseName,
        media.getTableName(),
        'filePath',
        media.filePath
      )
    } catch (error) {
      throw new Error(`Unable to remove ${media.filePath} from ${media.getTableName()}`, { cause: error })
    }
  }



  public static async indexFilesIntoStagingDatabase(media: Media[]): Promise<number> {
    try {
      const TABLE_NAME = media[0].getTableName()
      const TABLE_EXISTS_IN_STAGING = await Database.tableExists(Configs.databaseNames.staging, TABLE_NAME)
      if (! TABLE_EXISTS_IN_STAGING) {
        await Database.initAndSyncModel(Configs.databaseNames.staging, media[0])
      }

      if (media.length > 0) {
        for (const [, SINGLE_MEDIA] of media.entries()) {
          await Database.insertMediaIntoTable(Configs.databaseNames.staging, SINGLE_MEDIA)
        }
      }

      return media.length
    } catch (error) {
      throw new Error(`Failed to add indexes to table: ${media[0].getTableName()}`, { cause: error })
    }
  }



  public static async moveStagingDatabaseEntriesToProduction(
    validationResponse: ValidationResponse,
    validationResponseWithUpdatedFilePaths: ValidationResponse
  ): Promise<void> {

    await Database.moveDatabaseOneEntriesToDatabaseTwo(
      validationResponse,
      validationResponseWithUpdatedFilePaths,
      Configs.databaseNames.staging,
      Configs.databaseNames.production
    )
  }



  public static async moveStagingDatabaseEntriesToRejected(
    validationResponse: ValidationResponse,
    validationResponseWithUpdatedFilePaths: ValidationResponse
  ): Promise<void> {

    await Database.moveDatabaseOneEntriesToDatabaseTwo(
      validationResponse,
      validationResponseWithUpdatedFilePaths,
      Configs.databaseNames.staging,
      Configs.databaseNames.rejection
    )
  }



  public static async getDatabaseEntriesFromTable(
    databaseName: DatabaseNames,
    tableName: DatabaseTableNames
  ): Promise<Media[]> {

    const ENTRIES = await Database.selectAllFromTable(databaseName, tableName)
    if (Validators.isMediaArray(ENTRIES)) {
      return ENTRIES
    } else {
      throw new Error('Pulled invalid media from database.')
    }
  }



  private static async selectAllFromTable(
    databaseName: DatabaseNames,
    tableName: DatabaseTableNames
  ): Promise <object[]> {

    const DATABASE = Database.determineDatabase(databaseName)
    if (await Database.tableExists(databaseName, tableName)) {
      const RESULT_OF_QUERY = await DATABASE.query(
        `SELECT * FROM ${tableName};`,
        {
          type: QueryTypes.SELECT,
        }
      )

      return RESULT_OF_QUERY

    }  else {
      return []
    }
  }



  private static async selectAllFromTableWhereColumnEqualsMatch(
    databaseName: DatabaseNames,
    tableName: DatabaseTableNames,
    column: string,
    match: string
  ): Promise<object[]> {

    const DATABASE = Database.determineDatabase(databaseName)
    if (await Database.tableExists(databaseName, tableName)) {
      const RESULT_OF_QUERY = await DATABASE.query(
        `SELECT * 
        FROM ${tableName}
        WHERE :column = :match;`,
        {
          replacements: {
            column: column,
            match: match
          },
          type: QueryTypes.SELECT,
        }
      )

      return RESULT_OF_QUERY
    } else {
      return []
    }
  }



  private static async deleteFromTableWhereOneEqualsTwo(
    databaseName: DatabaseNames,
    tableName: DatabaseTableNames,
    column: string,
    match: string
  ): Promise<void> {

    const DATABASE = Database.determineDatabase(databaseName)
    if (await Database.tableExists(databaseName, tableName)) {
      await DATABASE.query(
        `DELETE FROM ${tableName}
        WHERE ${column} = :match;`,
        {
          type: QueryTypes.DELETE,
          replacements: {
            match: match
          }
        }
      ) as unknown as [number, unknown]

    } else {
      throw new Error(`Tried to delete from table that doesn't exist: ${tableName}`)
    }
  }



  private static async insertMediaIntoTable(
    databaseName: DatabaseNames,
    media: Media, tableName?: DatabaseTableNames
  ): Promise<void> {

    const DATABASE = Database.determineDatabase(databaseName)
    try {
      const ADJUSTED_TABLE_NAME = tableName ? tableName : media.getTableName()
      const COLUMNS: string[] = ['createdAt', 'updatedAt']
      const VALUES: string[] = [':createdAt', ':updatedAt']

      // Not sure why but .query() complains when this is upper
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const replacements: any = {
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      for (const [, KEY] of Object.keys(media).entries()) {
        COLUMNS.push(KEY)
        VALUES.push(`:${KEY}`)
        replacements[KEY] = media[KEY as keyof Media]
      }

      const QUERY =
        `INSERT INTO ${ADJUSTED_TABLE_NAME} (${COLUMNS.join(', ')})
        VALUES (${VALUES.join(', ')});
        `

      await DATABASE.query(QUERY, {
        replacements,
        type: QueryTypes.INSERT
      })

    } catch (error) {
      throw new Error(`Failed to index: ${media.filePath} in database: ${DATABASE.getDatabaseName()}`, { cause: error })
    }
  }



  public static async removeAlreadyIndexedFilePaths(
    databaseName: DatabaseNames,
    filePaths: string[]
  ): Promise<string[]> {

    const FILE_PATHS_TO_TOSS: string[] = []

    try {
      for (const [, FILE_PATH] of filePaths.entries()) {
        if (await Database.filePathInDatabase(databaseName, FILE_PATH)) {
          SarutaLogger.data('Tossing already indexed file', FILE_PATH)
          FILE_PATHS_TO_TOSS.push(FILE_PATH)
        }
      }
      filePaths = filePaths.filter((FILE_PATH: string) => ! FILE_PATHS_TO_TOSS.includes(FILE_PATH))
      if (FILE_PATHS_TO_TOSS.length > 0) {
        SarutaLogger.important(`${FILE_PATHS_TO_TOSS.length} staging files were tossed due to already being indexed.`)
      }

      return filePaths
    } catch (error) {
      throw new Error('Error while removing already indexed media.', { cause: error })
    }
  }



  private static async loadDatabase(databaseName: DatabaseNames): Promise<Sequelize> {
    try {
      const USERNAME = Configs.databaseInfo.username
      const PASSWORD = Configs.databaseInfo.password
      const HOST = Configs.databaseInfo.host
      const PORT = Configs.databaseInfo.port

      const SEQUELIZE = new Sequelize(
        `mysql://${USERNAME}:${PASSWORD}@${HOST}:${PORT}`
      )
      await SEQUELIZE.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``, { logging: false })
      const DATABASE = new Sequelize(databaseName, Configs.databaseInfo.username, Configs.databaseInfo.password, {
        host: 'localhost',
        dialect: 'mysql',
        logging: false,
      })

      return DATABASE
    } catch (error) {
      throw new Error(`Failed to load database: ${databaseName}`, { cause: error })
    }
  }



  private static async tableExists(databaseName: DatabaseNames, tableName: DatabaseTableNames): Promise<boolean> {
    const DATABASE = Database.determineDatabase(databaseName)
    try {
      await DATABASE.query(
        `SELECT * FROM ${tableName};`,
        {
          type: QueryTypes.SELECT,
        }
      )

      return true

    } catch {
      return false
    }
  }



  private static async filePathInDatabase(databaseName: DatabaseNames, filePath: string): Promise<boolean> {
    const DATABASE = Database.determineDatabase(databaseName)
    for (const [, TABLE_NAME] of Object.values(DatabaseTableNames).entries()) {
      try {
        const TABLE_EXISTS_IN_STAGING = await Database.tableExists(databaseName, TABLE_NAME)
        if (TABLE_EXISTS_IN_STAGING) {
          const RESULT_OF_QUERY = await DATABASE.query(`
                    SELECT *
                    FROM ${TABLE_NAME}
                    WHERE filePath = :filePath;
                    `,
          {
            replacements: {
              filePath: filePath
            }
          })

          if (RESULT_OF_QUERY[0].length > 0) {
            return true
          }
        }
      } catch (error) {
        throw new Error(`Failed to verify if in ${TABLE_NAME}: ${filePath}\n${error}`)
      }
    }

    return false
  }



  private static async initAndSyncModel(databaseName: DatabaseNames, media: Media): Promise<void> {
    const DATABASE = Database.determineDatabase(databaseName)
    try {
      const MODEL = media.getModel()
      MODEL.init(media.getAttributes(), { sequelize: DATABASE, tableName: media.getTableName() })
      await MODEL.sync()
    } catch (error) {
      throw new Error(`Failed to init & sync model to table: ${media.getTableName()}`, { cause: error })
    }
  }



  private static determineDatabase(databaseName: DatabaseNames): Sequelize {
    switch (databaseName) {
      case DatabaseNames.Staging:
      case DatabaseNames.TestStaging:
        return Database.stagingDatabase
      case DatabaseNames.Production:
      case DatabaseNames.TestProduction:
        return Database.productionDatabase
      case DatabaseNames.Rejection:
      case DatabaseNames.TestRejection:
        return Database.rejectionDatabase
    }
  }



  private static async moveDatabaseOneEntriesToDatabaseTwo(
    originalValidationResponse: ValidationResponse,
    validationResponseWithUpdatedFilePaths: ValidationResponse,
    databaseOne: DatabaseNames,
    databaseTwo: DatabaseNames
  ): Promise<void> {

    let count = 0

    try {
      for (const [, TABLE_NAME] of Object.keys(validationResponseWithUpdatedFilePaths.tables).entries()) {
        console.debug(`~~~~~~~~~~~~~~~~~~~~~~${TABLE_NAME}~~~~~~~~~~~~~~~~~~~`)
        for (const [INDEX, MEDIA] of validationResponseWithUpdatedFilePaths.tables[TABLE_NAME].entries()) {
          const INITIAL_FILE_PATH = originalValidationResponse.tables[TABLE_NAME][INDEX].filePath
          if (INITIAL_FILE_PATH !== MEDIA.filePath) {
            const TRUE_MEDIA = MediaFactory.createMediaFromTableName(MEDIA, TABLE_NAME as DatabaseTableNames)
            await Database.initAndSyncModel(databaseTwo, TRUE_MEDIA)
            await Database.insertMediaIntoTable(databaseTwo, TRUE_MEDIA)
            await Database.deleteFromTableWhereOneEqualsTwo(
              databaseOne,
              TABLE_NAME as DatabaseTableNames,
              'filepath',
              INITIAL_FILE_PATH
            )
            count ++
          } else {
            throw new Error(`filePath was not updated for ${databaseTwo}.\nDatabase indexes were not changed.`)
          }
        }
      }
      const PLURAL = count > 1 ? 'es' : ''
      SarutaLogger.success(
        `${count} production index${PLURAL} created and ${count} staging index${PLURAL} removed.`
      )

    } catch (error) {
      throw new Error(
        `Error while moving ${databaseOne} database entry into ${databaseTwo}. State unclear.`,
        { cause: error }
      )
    }
  }
}
