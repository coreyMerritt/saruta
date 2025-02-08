import { DataTypes, Model, ModelStatic } from "sequelize"
import { DatabaseTableNames } from "../../configuration/db/index.js"
import { Prompt } from '../../core/prompt.js'
import { Video, VideoModel, VideoTypes } from "./video.js"
import { MediaTypes } from "../media.js"
import path from "path"
import { Configs } from "../../configuration/configs.js"


class StandupModel extends VideoModel {
    public artist!: string
    public releaseYear!: number
}

export class Standup extends Video {
    public mediaType = MediaTypes.Video
    public videoType = VideoTypes.Standup
    public filePath: string
    public title: string
    public artist: string
    public releaseYear: number

    constructor(filePath: string, title: string, artist: string, releaseYear: number) {
        super()
        this.filePath = filePath
        this.title = title
        this.artist = artist
        this.releaseYear = releaseYear
    }

    getTableName(): DatabaseTableNames {
        return DatabaseTableNames.Standup
    }

    getStagingDirectory(): string {
        return Configs.videoTypeDirectories.staging.standup
    }

    getPrompt(): Prompt {
        return new Prompt(this.videoType)
    }

    getModel(): ModelStatic<Model> {
        return StandupModel
    }

    getAttributes(): any {
        return {
            mediaType: {type: DataTypes.STRING, allownull: false},
            videoType: {type: DataTypes.STRING, allownull: false},
            filePath: {type: DataTypes.STRING, allownull: false, unique: true},
            title: {type: DataTypes.STRING, allownull: false},
            artist: {type: DataTypes.STRING, allownull: false},
            releaseYear: {type: DataTypes.INTEGER, allowNull: false}
        }
    }

    getProductionFilePath(): string {
        var newBasePath = `${Configs.coreDirectories.productionVideos}/${this.getTableName()}`
        var currentFileExtension = path.extname(this.filePath)
        var title = this.prepStringForFileName(this.title)
        var artist = this.prepStringForFileName(String(this.artist))
        return `${newBasePath}/${artist}/${this.releaseYear}-${title}${currentFileExtension}`
    }

    getRejectFilePath(): string {
        var newBasePath = `${Configs.coreDirectories.rejectionVideos}/${this.getTableName()}`
        var currentFileExtension = path.extname(this.filePath)
        var title = this.prepStringForFileName(this.title)
        var artist = this.prepStringForFileName(String(this.artist))
        return `${newBasePath}/${artist}/${this.releaseYear}-${title}${currentFileExtension}`
    }
}