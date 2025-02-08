import { DatabaseNames } from "./db/database_names.js"
import { BackupDirectories } from "./directories/backup_directories.js"
import { CoreDirectories } from "./directories/core_directories.js"
import { LogFiles } from "./directories/logs_paths.js"
import { RootDirectories } from './directories/root_directories.js'
import { VideoTypeDirectories } from "./directories/video_type_directories.js"

interface DatabaseInfo {
    username: string
    password: string
    host: string
    port: number
}

interface ActiveDatabaseNames {
    staging: DatabaseNames
    production: DatabaseNames
    rejection: DatabaseNames
}

interface ActiveBackupDirectories {
    in: string
    out: string
}

interface ActiveCoreDirectories {
    logs: string
    stagingVideos: string
    productionVideos: string
    rejectionVideos: string   
}

interface ActiveLogPaths {
    errors: string
    general: string
    incomingRequest: string
}

interface someVideoTypeDirectories {
    animation: string
    anime: string
    movies: string
    shows: string
    standup: string
    misc: string
}

interface ActiveVideoTypeDirectories {
    staging: someVideoTypeDirectories
    production: someVideoTypeDirectories
    rejection: someVideoTypeDirectories
}

export class Configs {

    public static rootDirectory: RootDirectories
    public static sarutaFilesDirectory: RootDirectories
    public static databaseNames: ActiveDatabaseNames
    public static databaseInfo: DatabaseInfo
    public static backupDirectories: ActiveBackupDirectories
    public static coreDirectories: ActiveCoreDirectories
    public static logPaths: ActiveLogPaths
    public static videoTypeDirectories: ActiveVideoTypeDirectories


    public static set(test?: boolean) {
        if (test) {
            this.rootDirectory = RootDirectories.Test

            this.databaseNames = {
                staging: DatabaseNames.TestStaging,
                production: DatabaseNames.TestProduction,
                rejection: DatabaseNames.TestRejection
            }
        } else {
            this.rootDirectory = RootDirectories.Live
            this.databaseNames = {
                staging: DatabaseNames.Staging,
                production: DatabaseNames.Production,
                rejection: DatabaseNames.Rejection
            }
        }

        this.sarutaFilesDirectory = RootDirectories.Saruta_Files
        
        this.setDatabaseInfo()
        this.setBackupDirectories()
        this.setCoreDirectories()
        this.setLogPaths()
        this.setVideoTypeDirectories()
    }

    private static setDatabaseInfo(): void {
        if (process.env.LIKI_USERNAME && process.env.LIKI_PASSWORD) {
            this.databaseInfo = {
                username: process.env.LIKI_USERNAME,
                password: process.env.LIKI_PASSWORD,
                host: 'localhost',
                port: 3306
            }
        } else {
            throw new Error(`Credentials were not set in the environment variables.`)
        }
    }
    
    private static setBackupDirectories(): void {
        this.backupDirectories = {
            in: `${this.sarutaFilesDirectory}/${BackupDirectories.In}`,
            out: `${this.sarutaFilesDirectory}/${BackupDirectories.Out}`
        }
    }

    private static setCoreDirectories(): void {
        this.coreDirectories = {
            logs: `${this.sarutaFilesDirectory}/${CoreDirectories.Logs}`,
            stagingVideos: `${this.sarutaFilesDirectory}/${CoreDirectories.StagingVideos}`,
            productionVideos: `${this.rootDirectory}/${CoreDirectories.ProductionVideos}`,
            rejectionVideos: `${this.sarutaFilesDirectory}/${CoreDirectories.RejectionVideos}`
        }
    }

    private static setLogPaths(): void {
        this.logPaths = {
            errors: `${this.coreDirectories.logs}/${LogFiles.Errors}`,
            general: `${this.coreDirectories.logs}/${LogFiles.General}`,
            incomingRequest: `${this.coreDirectories.logs}/${LogFiles.IncomingRequest}`
        }
    }

    private static setVideoTypeDirectories(): void {
        this.videoTypeDirectories = {
            staging: {
                animation: `${this.coreDirectories.stagingVideos}/${VideoTypeDirectories.Animation}`,
                anime: `${this.coreDirectories.stagingVideos}/${VideoTypeDirectories.Anime}`,
                movies: `${this.coreDirectories.stagingVideos}/${VideoTypeDirectories.Movies}`,
                shows: `${this.coreDirectories.stagingVideos}/${VideoTypeDirectories.Shows}`,
                standup: `${this.coreDirectories.stagingVideos}/${VideoTypeDirectories.Standup}`,
                misc: `${this.coreDirectories.stagingVideos}/${VideoTypeDirectories.MiscVideo}`
            },
            production: {
                animation: `${this.coreDirectories.productionVideos}/${VideoTypeDirectories.Animation}`,
                anime: `${this.coreDirectories.productionVideos}/${VideoTypeDirectories.Anime}`,
                movies: `${this.coreDirectories.productionVideos}/${VideoTypeDirectories.Movies}`,
                shows: `${this.coreDirectories.productionVideos}/${VideoTypeDirectories.Shows}`,
                standup: `${this.coreDirectories.productionVideos}/${VideoTypeDirectories.Standup}`,
                misc: `${this.coreDirectories.productionVideos}/${VideoTypeDirectories.MiscVideo}`
            },
            rejection: {
                animation: `${this.coreDirectories.rejectionVideos}/${VideoTypeDirectories.Animation}`,
                anime: `${this.coreDirectories.rejectionVideos}/${VideoTypeDirectories.Anime}`,
                movies: `${this.coreDirectories.rejectionVideos}/${VideoTypeDirectories.Movies}`,
                shows: `${this.coreDirectories.rejectionVideos}/${VideoTypeDirectories.Shows}`,
                standup: `${this.coreDirectories.rejectionVideos}/${VideoTypeDirectories.Standup}`,
                misc: `${this.coreDirectories.rejectionVideos}/${VideoTypeDirectories.MiscVideo}`
            }
        }
    }
}