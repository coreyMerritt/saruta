import { DatabaseTableNames } from '../db/database_table_names.js'

export enum VideoTypeDirectories {
  Animation = `${DatabaseTableNames.Animation}`,
  Anime = `${DatabaseTableNames.Anime}`,
  MiscVideo = `${DatabaseTableNames.MiscVideo}`,
  Movies = `${DatabaseTableNames.Movies}`,
  Shows = `${DatabaseTableNames.Shows}`,
  Standup = `${DatabaseTableNames.Standup}`
}
