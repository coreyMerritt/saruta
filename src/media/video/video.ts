import { DatabaseTableNames } from '../../configuration/db/database_table_names.js'
import { Media, MediaModel } from '../media.js'



export class VideoModel extends MediaModel {
  public videoType!: string
}



export enum VideoTypes {
    Animation = 'animation',
    Anime = 'anime',
    Misc = 'misc_video',
    Movie = 'movie',
    Show = 'show',
    Standup = 'standup'
}



export abstract class Video extends Media {

  public abstract videoType: VideoTypes



  public getFileExtensions(): string[] {
    return ['.mkv', '.avi', '.mp4', '.mov', '.m4v']
  }



  public prepStringForFileName(someString: string): string {
    const NEW_STRING =
      someString.toLowerCase()
        .replace(/ /g, '-')
        .replace(':', '')
        .replace('\'', '')
        .replace(';', '')
        .replace('"', '')
        .replace('?', '')
        .replace('>', '')
        .replace('<', '')
        .replace('\\', '/')
        .replace('|', '')
        .replace('*', '')

    return NEW_STRING
  }



  public static getTableNameFromVideoType(videoType: VideoTypes): DatabaseTableNames {
    switch (videoType) {
      case VideoTypes.Animation:
        return DatabaseTableNames.Animation
      case VideoTypes.Anime:
        return DatabaseTableNames.Anime
      case VideoTypes.Movie:
        return DatabaseTableNames.Movies
      case VideoTypes.Show:
        return DatabaseTableNames.Shows
      case VideoTypes.Standup:
        return DatabaseTableNames.Standup
      case VideoTypes.Misc:
        return DatabaseTableNames.MiscVideo

    }
  }
}
