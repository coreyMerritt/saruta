import { SarutaLogger } from './saruta_logger.js'
import { SarutaTime } from './saruta_time.js'
import { DatabaseNames, DatabaseTableNames } from '../configuration/db/index.js'
import { Sequelize, QueryTypes } from 'sequelize'
import { exec } from 'child_process'
import { Media, MediaTypes } from '../media/media.js'
import { MediaFactory } from '../media/media_factory.js'
import { Validators } from './validators.js'
import { FileEngine, ValidationResponse } from './file_engine.js'
import { Configs } from '../configuration/configs.js'
import { VideoFactory } from '../media/video/video_factory.js'
import { VideoTypes } from '../media/video/video.js'



export class Database {

  private static stagingDatabase: Sequelize
  private static productionDatabase: Sequelize
  private static rejectionDatabase: Sequelize



  public static async initialize(): Promise<void> {
    Database.stagingDatabase = Database.loadDatabase(Configs.databaseNames.staging)
    Database.productionDatabase = Database.loadDatabase(Configs.databaseNames.production)
    Database.rejectionDatabase = Database.loadDatabase(Configs.databaseNames.rejection)
    await Database.initAndSyncAllModels(Configs.databaseNames.staging)
    await Database.initAndSyncAllModels(Configs.databaseNames.production)
    await Database.initAndSyncAllModels(Configs.databaseNames.rejection)
  }



  public static backupAll(): void {
    for (const [, DATABASE_NAME] of Object.values(Configs.databaseNames).entries()) {
      Database.backup(DATABASE_NAME)
    }
  }



  public static backup(databaseName: DatabaseNames): void {
    try {
      exec(
        `mysqldump -u ${Configs.databaseInfo.username} ` +
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

      SarutaLogger.data(`Removed from ${databaseName}`, media.filePath)
    } catch (error) {
      throw new Error(`Unable to remove ${media.filePath} from ${media.getTableName()}`, { cause: error })
    }
  }



  public static async indexFilesIntoStagingDatabase(media: Media[]): Promise<number> {
    try {
      if (media.length > 0) {
        for (const [, SINGLE_MEDIA] of media.entries()) {
          await Database.insertMediaIntoTable(Configs.databaseNames.staging, SINGLE_MEDIA)
        }
      }

      return media.length
    } catch (error) {
      throw new Error(`Failed to add entries to table: ${media[0].getTableName()}`, { cause: error })
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



  public static async lintAll(): Promise<void> {
    for (const [, DATABASE_NAME] of Object.values(Configs.databaseNames).entries()) {
      for (const [, MEDIA_TYPE] of Object.values(MediaTypes).entries()) {
        switch (MEDIA_TYPE) {
          case MediaTypes.Video:
            for (const [, VIDEO_TYPE] of Object.values(VideoTypes).entries()) {
              switch (VIDEO_TYPE) {
                case VideoTypes.Animation:
                  await Database.removeEntriesWithoutFiles(
                    DATABASE_NAME,
                    DatabaseTableNames.Animation
                  )
                  break
                case VideoTypes.Anime:
                  await Database.removeEntriesWithoutFiles(
                    DATABASE_NAME,
                    DatabaseTableNames.Anime
                  )
                  break
                case VideoTypes.Misc:
                  await Database.removeEntriesWithoutFiles(
                    DATABASE_NAME,
                    DatabaseTableNames.MiscVideo
                  )
                  break
                case VideoTypes.Movie:
                  await Database.removeEntriesWithoutFiles(
                    DATABASE_NAME,
                    DatabaseTableNames.Movies
                  )
                  break
                case VideoTypes.Show:
                  await Database.removeEntriesWithoutFiles(
                    DATABASE_NAME,
                    DatabaseTableNames.Shows
                  )
                  break
                case VideoTypes.Standup:
                  await Database.removeEntriesWithoutFiles(
                    DATABASE_NAME,
                    DatabaseTableNames.Standup
                  )
                  break
                default:
                  throw new Error('Trying to lint an undefined videoType.')
              }
            }
            break
          default:
            throw new Error('Trying to lint an undefined mediaType.')
        }
      }
    }
  }



  private static async removeEntriesWithoutFiles(
    databaseName: DatabaseNames,
    tableName: DatabaseTableNames
  ): Promise<void> {

    try {
      SarutaLogger.data('Linting Database entries:', `${databaseName} -> ${tableName}...`)
      const MEDIA_TO_CHECK = await Database.getDatabaseEntriesFromTable(databaseName, tableName)

      for (const [, MEDIA] of MEDIA_TO_CHECK.entries()) {
        if (! await FileEngine.fileExists(MEDIA.filePath)) {
          const TRUE_MEDIA = VideoFactory.createVideoFromObject(MEDIA)
          await Database.removeMediaFromTable(databaseName, TRUE_MEDIA)
        }
      }

      SarutaLogger.success('\tSuccess')
    } catch (error) {
      throw new Error(`Unable to lint database: ${databaseName}`, { cause: error })
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
    media: Media,
    tableName?: DatabaseTableNames
  ): Promise<void> {

    const DATABASE = Database.determineDatabase(databaseName)
    try {
      const ADJUSTED_TABLE_NAME = tableName ? tableName : media.getTableName()
      const COLUMNS: string[] = ['createdAt', 'updatedAt']
      const VALUES: string[] = [':createdAt', ':updatedAt']


      // if (! await Database.tableExists(databaseName, ADJUSTED_TABLE_NAME)) {
      //   Database.
      // }
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
          SarutaLogger.data('Ignoring already indexed file', FILE_PATH)
          FILE_PATHS_TO_TOSS.push(FILE_PATH)
        }
      }
      filePaths = filePaths.filter((FILE_PATH: string) => ! FILE_PATHS_TO_TOSS.includes(FILE_PATH))
      if (FILE_PATHS_TO_TOSS.length > 0) {
        SarutaLogger.important(`${FILE_PATHS_TO_TOSS.length} staging files were ignored due to already being indexed.`)
      }

      return filePaths
    } catch (error) {
      throw new Error('Error while removing already indexed media.', { cause: error })
    }
  }



  private static loadDatabase(databaseName: DatabaseNames): Sequelize {
    try {
      const USERNAME = Configs.databaseInfo.username
      const PASSWORD = Configs.databaseInfo.password
      const HOST = Configs.databaseInfo.host
      const PORT = Configs.databaseInfo.port

      const SEQUELIZE = new Sequelize(
        `mysql://${USERNAME}:${PASSWORD}@${HOST}:${PORT}`
      )
      SEQUELIZE.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``, { logging: false })
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



  private static async initAndSyncAllModels(databaseName: DatabaseNames): Promise<void> {
    const NULL_ANIMATION = VideoFactory.createNullFromVideoType(VideoTypes.Animation)
    const NULL_ANIME = VideoFactory.createNullFromVideoType(VideoTypes.Anime)
    const NULL_MISC_VIDEO = VideoFactory.createNullFromVideoType(VideoTypes.Misc)
    const NULL_MOVIE = VideoFactory.createNullFromVideoType(VideoTypes.Movie)
    const NULL_SHOW = VideoFactory.createNullFromVideoType(VideoTypes.Show)
    const NULL_STANDUP = VideoFactory.createNullFromVideoType(VideoTypes.Standup)

    await Database.initAndSyncModel(databaseName, NULL_ANIMATION)
    await Database.initAndSyncModel(databaseName, NULL_ANIME)
    await Database.initAndSyncModel(databaseName, NULL_MISC_VIDEO)
    await Database.initAndSyncModel(databaseName, NULL_MOVIE)
    await Database.initAndSyncModel(databaseName, NULL_SHOW)
    await Database.initAndSyncModel(databaseName, NULL_STANDUP)
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
      await DATABASE.authenticate()
      const MODEL = media.getModel()
      MODEL.init(
        media.getAttributes(),
        {
          sequelize: DATABASE,
          tableName: media.getTableName()
        }
      )
      await MODEL.sync({ alter: true })
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
    databaseNameOne: DatabaseNames,
    databaseNameTwo: DatabaseNames
  ): Promise<void> {

    let count = 0

    try {
      for (const [, TABLE_NAME] of Object.keys(validationResponseWithUpdatedFilePaths.tables).entries()) {
        for (const [INDEX, MEDIA] of validationResponseWithUpdatedFilePaths.tables[TABLE_NAME].entries()) {
          const INITIAL_FILE_PATH = originalValidationResponse.tables[TABLE_NAME][INDEX].filePath
          if (INITIAL_FILE_PATH !== MEDIA.filePath) {
            const TRUE_MEDIA = MediaFactory.createMediaFromTableName(MEDIA, TABLE_NAME as DatabaseTableNames)
            await Database.insertMediaIntoTable(databaseNameTwo, TRUE_MEDIA)
            await Database.deleteFromTableWhereOneEqualsTwo(
              databaseNameOne,
              TABLE_NAME as DatabaseTableNames,
              'filepath',
              INITIAL_FILE_PATH
            )
            count ++
          } else {
            throw new Error(`filePath was not updated for ${databaseNameTwo}.\nDatabase entries were not changed.`)
          }
        }
      }
      const PLURAL = count > 1 ? 'es' : ''
      SarutaLogger.success(
        `${count} ${databaseNameTwo} index${PLURAL} created and ${count} ${databaseNameOne} index${PLURAL} removed.`
      )

    } catch (error) {
      throw new Error(
        `Error while moving ${databaseNameOne} database entry into ${databaseNameTwo}. State unclear.`,
        { cause: error }
      )
    }
  }
}
