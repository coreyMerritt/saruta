import { DatabaseNames } from '../configuration/db/database_names.js'
import { DatabaseTableNames } from '../configuration/db/database_table_names.js'
import { Media, MediaTypes } from '../media/media.js'
import { Anime, Animation, MiscVideo, Movie, Show, Standup, Video, VideoTypes } from '../media/video/index.js'
import { ValidationRequest, ValidationResponse } from './file_engine.js'
import { SarutaLogger } from './saruta_logger.js'


export class Validators {
   
    public static isDatabaseTable(someString: string): someString is DatabaseTableNames {
        for (const [, tableName] of Object.values(DatabaseTableNames).entries()) {
            if (someString === tableName) {
                return true
            } 
        }
        return false
    }

    public static isDatabaseName(someString: string): someString is DatabaseNames {
        for (const [, databaseName] of Object.values(DatabaseNames).entries()) {
            if (someString === databaseName) {
                return true
            } 
        }
        return false
    }

    public static isMedia(object: object): object is Media {
        return 'filePath' in object && 'title' in object && 
            object.filePath && object.title ? true : false
    }

    public static isVideo(object: object): object is Video {
        return 'filePath' in object && 'title' in object && 
            object.filePath && object.title ? true : false
    }

    public static isMovie(object: any): object is Movie {
        return 'filePath' in object && 'title' in object && 'releaseYear' in object && 
            object.filePath && object.title && object.releaseYear
    }
    
    public static isShow(object: any): object is Show {
        return 'filePath' in object && 'title' in object && 'seasonNumber' in object && 'episodeNumber' in object && 
            object.filePath && object.title && object.seasonNumber && object.episodeNumber
    }
    
    public static isStandup(object: any): object is Standup {
        return 'filePath' in object && 'title' in object && 'releaseYear' in object && 'artist' in object && 
            object.filePath && object.title && object.releaseYear && object.artist
    }
    
    public static isAnime(object: any): object is Anime {
        return 'filePath' in object && 'title' in object && 'seasonNumber' in object && 'episodeNumber' in object &&
            object.filePath && object.title && object.seasonNumber && object.episodeNumber
    }
    
    public static isAnimation(object: any): object is Animation {
        return 'filePath' in object && 'title' in object && 'seasonNumber' in object && 'episodeNumber' in object &&
            object.filePath && object.title && object.seasonNumber && object.episodeNumber
    }
    
    public static isMiscVideo(object: any): object is MiscVideo {
        return 'filePath' in object && 'title' in object &&
            object.filePath && object.title
     }

    public static isMediaArray(objectArray: object[]): objectArray is Media[] {
        for (const [, object] of objectArray.entries()) {
            if (!Validators.isMedia(object)) {
                return false
            }
        }
        return true
    }

    public static isVideoArray(objectArray: object[]): objectArray is Video[] {
        for (const [, object] of objectArray.entries()) {
            if (!Validators.isVideo(object)) {
                return false
            }
        }
        return true
    }

    public static isMediaType(someString: string): someString is MediaTypes {
        const videoTypes = Object.values(VideoTypes) as string[]
        if (videoTypes.includes(someString)) {
            return true
        } else {
            return false
        }
    }

    public static isVideoType(someString: string): someString is VideoTypes {
        const videoTypes = Object.values(VideoTypes) as string[]
        if (videoTypes.includes(someString)) {
            return true
        } else {
            return false
        }
    }

    public static isValidationRequest(object: object): object is ValidationRequest {
        if ('tables' in object && typeof object.tables === 'object' && object.tables !== null) {
            for (const [, someArray] of Object.values(object.tables).entries()) {
                if (!Validators.isMediaArray(someArray)) {
                    SarutaLogger.important(`Not a validation request... Not valid media: ${JSON.stringify(someArray)}`)
                    return false
                }
            }
            return true
        } else {
            return false
        }
    }

    public static isAcceptedValidationResponse(object: object): object is ValidationResponse {
        if ('tables' in object && typeof object.tables === 'object' && object.tables !== null) {
            for (const [, someArray] of Object.values(object.tables).entries()) {
                if (!Validators.isMediaArray(someArray)) {
                    SarutaLogger.important(`Not a validation request... Not valid media: ${JSON.stringify(someArray)}`)
                    return false
                }
                for (const [, media] of Object.values(someArray).entries()) {
                    for (const [, value] of Object.values(media).entries())
                    if (value === null || value === undefined || value === `placeholder` || value === -1) {
                        throw new Error(`Rejected media validation request. Media contains a null, undefined, placeholer, or -1 value:\n${JSON.stringify(media)}`)
                    }
                }
            }
            return true
        } else {
            return false
        }
    }

    public static isValidationResponse(object: object): object is ValidationResponse {
        if ('tables' in object && typeof object.tables === 'object' && object.tables !== null) {
            for (const [, someArray] of Object.values(object.tables).entries()) {
                if (!Validators.isMediaArray(someArray)) {
                    SarutaLogger.important(`Not a validation request... Not valid media: ${JSON.stringify(someArray)}`)
                    return false
                }
            }
            return true
        } else {
            return false
        }
    }
}