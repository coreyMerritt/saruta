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
import { table } from 'console'


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
        for (const [, databaseName] of Object.values(Configs.databaseNames).entries()) {
            Database.backup(databaseName)
        }
    }

    public static async backup(databaseName: DatabaseNames): Promise<void> {
        const execAsync = promisify(exec)
        try {
            await execAsync(`mysqldump -u ${Configs.databaseInfo.username} -p${Configs.databaseInfo.password} ${databaseName} > "${Configs.backupDirectories.out}/${databaseName}___${SarutaTime.getCurrentDateTime(true)}".sql`)
            SarutaLogger.success(`Backed up database: ${databaseName}.`)
        } catch (error) {
            throw new Error(`Failed to back up database: ${databaseName}`, { cause: error })
        }
    }

    public static async removeMediaFromTable(databaseName: DatabaseNames, media: Media): Promise<void> {
        try {
            await Database.deleteFromTableWhereOneEqualsTwo(databaseName, media.getTableName(), `filePath`, media.filePath)
        } catch (error) {
            throw new Error(`Unable to remove ${media.filePath} from ${media.getTableName()}`, { cause: error })
        }
    }

    public static async indexFilesIntoStagingDatabase(media: Media[]): Promise<number> {
        try {
            const tableName = media[0].getTableName()
            const tableExistsInStaging = await Database.tableExists(Configs.databaseNames.staging, tableName)
            if (!tableExistsInStaging) {
               await Database.initAndSyncModel(Configs.databaseNames.staging, media[0])
            }
            
            if (media.length > 0) {
                for (const [, singleMedia] of media.entries()) {
                    await Database.insertMediaIntoTable(Configs.databaseNames.staging, singleMedia)
                }
            }

            return media.length
        } catch (error) {
            throw new Error(`Failed to add indexes to table: ${media[0].getTableName()}`, {cause: error})
        }
    }

    public static async moveStagingDatabaseEntriesToProduction(validationResponse: ValidationResponse, validationResponseWithUpdatedFilePaths: ValidationResponse): Promise<void> {
        await Database.moveDatabaseOneEntriesToDatabaseTwo(validationResponse, validationResponseWithUpdatedFilePaths, Configs.databaseNames.staging, Configs.databaseNames.production)
    }

    public static async moveStagingDatabaseEntriesToRejected(validationResponse: ValidationResponse, validationResponseWithUpdatedFilePaths: ValidationResponse): Promise<void> {
        await Database.moveDatabaseOneEntriesToDatabaseTwo(validationResponse, validationResponseWithUpdatedFilePaths, Configs.databaseNames.staging, Configs.databaseNames.rejection)
    }

    public static async getDatabaseEntriesFromTable(databaseName: DatabaseNames, tableName: DatabaseTableNames): Promise<Media[]> {
        const entries = await Database.selectAllFromTable(databaseName, tableName)
        if (Validators.isMediaArray(entries)) {
            return entries
        } else {
            throw new Error(`Pulled invalid media from database.`)
        }
    }

    private static async selectAllFromTable(databaseName: DatabaseNames, tableName: DatabaseTableNames): Promise <object[]> {
        const database = Database.determineDatabase(databaseName)
        if (await Database.tableExists(databaseName, tableName)) {
            const resultOfQuery = await database.query(
                `SELECT * FROM ${tableName};`,
                {   
                  type: QueryTypes.SELECT,
                }
            )
            
            return resultOfQuery
        }  else {
            return []
        }
    }

    private static async selectAllFromTableWhereColumnEqualsMatch(databaseName: DatabaseNames, tableName: DatabaseTableNames, column: string, match: string): Promise<object[]> {
        const database = Database.determineDatabase(databaseName)
        if (await Database.tableExists(databaseName, tableName)) {
            const resultOfQuery = await database.query(
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
            return resultOfQuery
        } else {
            return []
        }
    }


    private static async deleteFromTableWhereOneEqualsTwo(databaseName: DatabaseNames, tableName: DatabaseTableNames, column: string, match: string): Promise<void> {
        const database = Database.determineDatabase(databaseName)
         if (await Database.tableExists(databaseName, tableName)) {
            const result = await database.query(
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


    private static async insertMediaIntoTable(databaseName: DatabaseNames, media: Media, tableName?: DatabaseTableNames): Promise<void> {
        const database = Database.determineDatabase(databaseName)
        try {
            const adjustedTableName = tableName ? tableName : media.getTableName() 
            const columns: string[] = ['createdAt', 'updatedAt']
            const values: string[] = [':createdAt', ':updatedAt']

            const replacements: any = {
                createdAt: new Date(), 
                updatedAt: new Date(),
            }

            for (const [, key] of Object.keys(media).entries()) {
                columns.push(key)
                values.push(`:${key}`)
                replacements[key] = media[key as keyof Media]
            }

            const query = `
                INSERT INTO ${adjustedTableName} (${columns.join(', ')})
                VALUES (${values.join(', ')});
            `

            await database.query(query, {
                replacements,
                type: QueryTypes.INSERT
            })

        } catch (error) {
            throw new Error(`Failed to index: ${media.filePath} in database: ${database.getDatabaseName()}`, { cause: error })
        }
    }


    public static async removeAlreadyIndexedFilePaths(databaseName: DatabaseNames, filePaths: string[]): Promise<string[]> {
        var filePathsToToss: string[] = []

        try {
            for (const [, filePath] of filePaths.entries()) {
                if (await Database.filePathInDatabase(databaseName, filePath)) {
                    SarutaLogger.data(`Tossing already indexed file`, filePath)
                    filePathsToToss.push(filePath)
                }
            }
            filePaths = filePaths.filter(filePath => !filePathsToToss.includes(filePath))
            if (filePathsToToss.length > 0) {
                SarutaLogger.important(`${filePathsToToss.length} staging files were tossed due to already being indexed.`)
            }
            return filePaths
        } catch (error) {
            throw new Error("Error while removing already indexed media", { cause: error })
        }
    }


    private static async loadDatabase(databaseName: DatabaseNames): Promise<Sequelize> {
        try {
            const sequelize = new Sequelize(`mysql://${Configs.databaseInfo.username}:${Configs.databaseInfo.password}@${Configs.databaseInfo.host}:${Configs.databaseInfo.port}`)
            await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``, { logging: false })
            const database = new Sequelize(databaseName, Configs.databaseInfo.username, Configs.databaseInfo.password, {
                host: 'localhost',
                dialect: 'mysql',
                logging: false,
            })
            return database
        } catch (error) {
            throw new Error(`Failed to load database: ${databaseName}`, { cause: error })
        }
    }

    private static async tableExists(databaseName: DatabaseNames, tableName: DatabaseTableNames): Promise<boolean> {
        const database = Database.determineDatabase(databaseName)
        try {
            await database.query(
                `SELECT * FROM ${tableName};`,
                {
                  type: QueryTypes.SELECT,
                }
            )

            return true
        } catch (error) {
            return false
        }
    }


    private static async filePathInDatabase(databaseName: DatabaseNames, filePath: string): Promise<boolean> {
        const database = Database.determineDatabase(databaseName)
        for (const [, tableName] of Object.values(DatabaseTableNames).entries()) {
            try {
                const tableExistsInStaging = await Database.tableExists(databaseName, tableName)
                if (tableExistsInStaging) {
                    const resultOfQuery = await database.query(`
                        SELECT *
                        FROM ${tableName}
                        WHERE filePath = :filePath;
                        `,
                        {
                            replacements: {
                                filePath: filePath
                            }
                        })
                
                    if (resultOfQuery[0].length > 0) {
                        return true
                    }                    
                }
            } catch (error) {
                throw new Error(`Failed to verify if in ${tableName}: ${filePath}\n${error}`)
            }
        } 
        return false
    }
    

    private static async initAndSyncModel(databaseName: DatabaseNames, media: Media): Promise<void> {
        const database = Database.determineDatabase(databaseName)
        try {
            const model = media.getModel()
            model.init(media.getAttributes(), { sequelize: database, tableName: media.getTableName() })
            await model.sync()
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

    private static async moveDatabaseOneEntriesToDatabaseTwo(originalValidationResponse: ValidationResponse, validationResponseWithUpdatedFilePaths: ValidationResponse, databaseOne: DatabaseNames, databaseTwo: DatabaseNames): Promise<void> {
        var count = 0

        try {
            for (const [, tableName] of Object.keys(validationResponseWithUpdatedFilePaths.tables).entries()) {
                for (const [i, media] of validationResponseWithUpdatedFilePaths.tables[tableName].entries()) {
                    const initialFilePath = originalValidationResponse.tables[tableName][i].filePath
                    if (initialFilePath !== media.filePath) {
                        const trueMedia = MediaFactory.createMediaFromTableName(media, tableName as DatabaseTableNames)
                        await Database.initAndSyncModel(databaseTwo, trueMedia)
                        await Database.insertMediaIntoTable(databaseTwo, trueMedia)
                        await Database.deleteFromTableWhereOneEqualsTwo(databaseOne, tableName as DatabaseTableNames, `filepath`, initialFilePath)
                        count++
                    } else {
                        throw new Error(`filePath was not updated for ${databaseTwo}.\nDatabase indexes were not changed.`)
                    }
                }
            }
            SarutaLogger.success(`${count} production index${count > 1 ? 'es' : ''} created and ${count} staging index${count > 1 ? 'es' : ''} removed.`)

        } catch (error) {
            throw new Error(`Error while moving staging database entry into production database. State unclear.`, { cause: error })
        }
    }
}