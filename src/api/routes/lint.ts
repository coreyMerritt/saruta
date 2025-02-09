import express from 'express'
import asyncHandler from 'express-async-handler'
import { LintController } from '../controllers/lint.js'


const ROUTER = express.Router()

ROUTER.route('/lint')
  .post(asyncHandler(LintController.lintDatabases))

export default ROUTER
