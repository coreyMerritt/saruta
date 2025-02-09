export enum Directories {
    ClientDirectory = '/mnt/z/saruta/test-client',
    ClientDirectoryBackup = `${ClientDirectory}/backup`
}



export enum Files {
    PendingValidation = 'pending.yml',
    AcceptedValidation = 'accepted.yml',
    RejectedValidation = 'rejected.yml'
}



export enum Paths {
    PendingValidation = `${Directories.ClientDirectory}/${Files.PendingValidation}`,
    AcceptedValidation = `${Directories.ClientDirectory}/${Files.AcceptedValidation}`,
    RejectedValidation = `${Directories.ClientDirectory}/${Files.RejectedValidation}`,
    PendingValidationBackup = `${Directories.ClientDirectoryBackup}/${Files.PendingValidation}`,
    AcceptedValidationBackup = `${Directories.ClientDirectoryBackup}/${Files.AcceptedValidation}`,
    RejectedValidationBackup = `${Directories.ClientDirectoryBackup}/${Files.RejectedValidation}`
}
