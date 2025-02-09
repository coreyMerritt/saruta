export class SarutaTime {

  public static getCurrentDateTime(fileFormat?: boolean): string {
    const NOW = new Date()

    const YEAR = NOW.getFullYear()
    const MONTH = String(NOW.getMonth() + 1).padStart(2, '0')
    const DAY = String(NOW.getDate()).padStart(2, '0')

    const HOURS = String(NOW.getHours()).padStart(2, '0')
    const MINUTES = String(NOW.getMinutes()).padStart(2, '0')
    const SECONDS = String(NOW.getSeconds()).padStart(2, '0')
    const MILISECONDS = String(NOW.getMilliseconds()).padStart(3, '0')
    if (fileFormat) {
      return `${YEAR}-${MONTH}-${DAY}__${HOURS}-${MINUTES}-${SECONDS}.${MILISECONDS}`
    } else {
      return `${YEAR}/${MONTH}/${DAY} ${HOURS}:${MINUTES}:${SECONDS}.${MILISECONDS}`
    }
  }



  public static getCurrentTime(fileFormat?: boolean): string {
    const NOW = new Date()

    const HOURS = String(NOW.getHours()).padStart(2, '0')
    const MINUTES = String(NOW.getMinutes()).padStart(2, '0')
    const SECONDS = String(NOW.getSeconds()).padStart(2, '0')
    const MILISECONDS = String(NOW.getMilliseconds()).padStart(3, '0')
    if (fileFormat) {
      return `${HOURS}-${MINUTES}-${SECONDS}.${MILISECONDS}`
    } else {
      return `${HOURS}:${MINUTES}:${SECONDS}.${MILISECONDS}`
    }
  }
}
