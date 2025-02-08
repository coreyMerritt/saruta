import { SarutaLogger } from './saruta_logger.js'
import { Validators } from './validators.js'
import { OpenAI } from 'openai'
import { Prompt } from './prompt.js'
import { Media } from '../media/media.js'
import { MediaFactory } from '../media/media_factory.js'


export class AI {
    
    private model: OpenAI

    constructor() {
        this.model = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }

    public static async parseAllMediaData(filePaths: string[], prompt: Prompt): Promise<Media[]> {
        // This structure is to optimize token usage on OpenAI API calls.
        var videoFiles: Media[] = [] 
        var workingArray: string[] = []
        for (const [i, filePath] of filePaths.entries()) {
            workingArray.push(filePath)
            if (((i+1) % 30) === 0) {
                SarutaLogger.info(`Attempting to parse files ${i-28}-${i+1} of ${filePaths.length}...`)
                const tenVideoFiles = await this.parseSomeMediaData(workingArray, prompt)
                videoFiles = videoFiles.concat(tenVideoFiles)
                workingArray = []
            } else if (i+1 === filePaths.length) {
                SarutaLogger.info(`Attempting to parse files ${(Math.floor(i/30)*30)+1}-${i+1} of ${filePaths.length}...`)
                const upToNineVideoFiles = await this.parseSomeMediaData(workingArray, prompt)
                videoFiles = videoFiles.concat(upToNineVideoFiles)
            }
        }
        return videoFiles
    }

    private async evaluate(prompt: string, data: string[]): Promise<string> {
        try {
            const result = await this.model.chat.completions.create({
                model: `gpt-3.5-turbo-0125`,
                messages: [
                    { role: `system`, content: prompt},
                    { role: 'user', content: data.toString()}
                ],
                max_tokens: 3500,
                temperature: 0,
                presence_penalty: -2
            })
            if (result.choices[0].message.content) {
                return result.choices[0].message.content
            } else {
                throw new Error(`OpenAI API returned null.`)
            }
        } catch (error) {
            throw new Error(`Failed to recieve a response from the OpenAI API.\n`, { cause: error })
        }
    }

    private static async parseSomeMediaData(filePaths: string[], prompt: Prompt): Promise<Media[]> {
        try {
            const ai = new AI()
            const aiResult = await ai.evaluate(prompt.value, filePaths)
            const jsonArray = await this.stringToObjectArray(aiResult)
            if (Validators.isMediaArray(jsonArray)) {
                var media = []
                for (const [, object] of jsonArray.entries()) {
                    const objectAsMedia = MediaFactory.createMedia(object)
                    if (objectAsMedia) {
                        media.push(objectAsMedia)
                    }
                }
                return media
            } else {
                throw new Error(`JSON array is not a Media array.`)
            }
        } catch (error) {
            throw new Error(`Failed to parse ${filePaths.length} files.`, { cause: error })
        }
    }


    private static async stringToObjectArray(someString: string): Promise<object[]> {
        try {
            const arrayAsString = await this.stringToJsonArrayString(someString)
            const arrayAsObject = JSON.parse(arrayAsString)
            return arrayAsObject
        } catch (error) {
            throw new Error(`Unable to convert string to object.`, { cause: error })
        }
    }

    private static async stringToJsonArrayString(someString: string): Promise<string> {
        try {
            const jsonArrayRegex = /\[(\s*{[\s\S]*?}\s*,?\s*)+\]/g
            var match: any
            var potentialArray: any
            
            while ((match = jsonArrayRegex.exec(someString)) !== null) {
                potentialArray = match[0]

                try {
                    const parsedArray = JSON.parse(potentialArray)

                    if (Array.isArray(parsedArray) && parsedArray.some(item => typeof item === 'object')) {
                        return potentialArray
                    }
                } catch {
                    continue
                }   
            }

            return potentialArray

        } catch (error) {
            throw new Error(`Unable to parse string as a JSON string.`, { cause: error })
        }
    }
}