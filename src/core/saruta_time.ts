export class SarutaTime {

    public static getCurrentDateTime(fileFormat?: boolean): string {
        const now = new Date()

        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
    
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        const seconds = String(now.getSeconds()).padStart(2, '0')
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0')
        if (fileFormat) {
            return `${year}-${month}-${day}__${hours}-${minutes}-${seconds}.${milliseconds}`
        } else {
            return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}.${milliseconds}`
        }
    }

    public static getCurrentTime(fileFormat?: boolean): string {
        const now = new Date()
    
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        const seconds = String(now.getSeconds()).padStart(2, '0')
        const milliseconds = String(now.getMilliseconds()).padStart(3, '0')
        if (fileFormat) {
            return `${hours}-${minutes}-${seconds}.${milliseconds}`
        } else {
            return `${hours}:${minutes}:${seconds}.${milliseconds}`
        }
    }
}