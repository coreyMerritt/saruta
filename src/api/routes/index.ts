import express from 'express'
import asyncHandler from 'express-async-handler'
import { IndexController } from '../controllers/index.js'


const ROUTER = express.Router()

ROUTER.route('/index/staging/:mediaType?/:videoType?')
  .post(asyncHandler(IndexController.indexStagingDatabase))

export default ROUTER
