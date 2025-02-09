import { SarutaLogger } from './saruta_logger.js'
import { Validators } from './validators.js'
import { OpenAI } from 'openai'
import { Prompt } from './prompt.js'
import { Media } from '../media/media.js'
import { MediaFactory } from '../media/media_factory.js'


export class GAI {

  private model: OpenAI



  constructor() {
    this.model = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }



  public static async parseAllMediaData(filePaths: string[], prompt: Prompt): Promise<Media[]> {
    // This structure is to optimize token usage on OpenAI API calls.
    let videoFiles: Media[] = []
    let workingArray: string[] = []

    for (const [INDEX, FILE_PATH] of filePaths.entries()) {
      workingArray.push(FILE_PATH)

      if (((INDEX + 1) % 30) === 0) {
        SarutaLogger.data(
          'Attempting to parse files',
          `${INDEX - 28}-${INDEX + 1} of ${filePaths.length}...`
        )
        const TEN_VIDEO_FILES = await this.parseSomeMediaData(workingArray, prompt)
        videoFiles = videoFiles.concat(TEN_VIDEO_FILES)
        workingArray = []

      } else if (INDEX + 1 === filePaths.length) {
        SarutaLogger.data(
          'Attempting to parse files',
          `${(Math.floor(INDEX / 30) * 30) + 1}-${INDEX+1} of ${filePaths.length}...`
        )
        const UP_TO_NINE_VIDEO_FILES = await this.parseSomeMediaData(workingArray, prompt)
        videoFiles = videoFiles.concat(UP_TO_NINE_VIDEO_FILES)
      }
    }

    return videoFiles
  }



  private async evaluate(prompt: string, data: string[]): Promise<string> {
    try {
      const RESULT = await this.model.chat.completions.create({
        model: 'gpt-3.5-turbo-0125',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: data.toString() }
        ],
        // eslint-disable-next-line @typescript-eslint/naming-convention
        max_tokens: 3500,
        temperature: 0,
        // eslint-disable-next-line @typescript-eslint/naming-convention, space-unary-ops
        presence_penalty: -2
      })
      if (RESULT.choices[0].message.content) {
        return RESULT.choices[0].message.content
      } else {
        throw new Error('OpenAI API returned null.')
      }
    } catch (error) {
      throw new Error('Failed to recieve a response from the OpenAI API.\n', { cause: error })
    }
  }



  private static async parseSomeMediaData(filePaths: string[], prompt: Prompt): Promise<Media[]> {
    try {
      const PARSER = new GAI()
      const PARSED_RESULT = await PARSER.evaluate(prompt.value, filePaths)
      const PARSED_ARRAY = await this.stringToObjectArray(PARSED_RESULT)
      if (Validators.isMediaArray(PARSED_ARRAY)) {
        const MEDIA = []
        for (const [, PARSED_OBJECT] of PARSED_ARRAY.entries()) {
          const PARSED_MEDIA = MediaFactory.createMedia(PARSED_OBJECT)
          if (PARSED_MEDIA) {
            MEDIA.push(PARSED_MEDIA)
          }
        }

        return MEDIA
      } else {
        throw new Error('JSON array is not a Media array.')
      }
    } catch (error) {
      throw new Error(`Failed to parse ${filePaths.length} files.`, { cause: error })
    }
  }



  private static async stringToObjectArray(someString: string): Promise<object[]> {
    try {
      const ARRAY_AS_STRING = await this.stringToJsonArrayString(someString)
      const ARRAY = JSON.parse(ARRAY_AS_STRING)

      return ARRAY
    } catch (error) {
      throw new Error('Unable to convert string to object.', { cause: error })
    }
  }



  private static async stringToJsonArrayString(someString: string): Promise<string> {
    try {
      const JSON_ARRAY_REGEX = /\[(\s*{[\s\S]*?}\s*,?\s*)+\]/g
      let match: any
      let potentialArray: any

      while ((match = JSON_ARRAY_REGEX.exec(someString)) !== null) {
        potentialArray = match[0]

        try {
          const PARSED_ARRAY = JSON.parse(potentialArray)

          if (Array.isArray(PARSED_ARRAY) && PARSED_ARRAY.some((item: any) => typeof item === 'object')) {
            return potentialArray
          }
        } catch {
          continue
        }
      }

      return potentialArray

    } catch (error) {
      throw new Error('Unable to parse string as a JSON string.', { cause: error })
    }
  }
}
