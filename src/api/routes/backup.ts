import express from 'express'
import asyncHandler from 'express-async-handler'
import { BackupController } from '../controllers/backup.js'


const ROUTER = express.Router()

ROUTER.route('/backup/:databaseName?')
  .post(asyncHandler(BackupController.backupDatabase))

export default ROUTER
