import express from 'express'
import asyncHandler from 'express-async-handler'
import { LintController } from '../controllers/lint.js'


const router = express.Router()

router.route(`/lint`)
    .post(asyncHandler(LintController.lintDatabases))

export default router