import express from 'express'
import asyncHandler from 'express-async-handler'
import { ValidationController } from '../controllers/validation.js'


const ROUTER = express.Router()

ROUTER.route('/validation/pending')
  .get(asyncHandler(ValidationController.getValidationRequest))

ROUTER.route('/validation/accepted')
  .post(asyncHandler(ValidationController.postAcceptedValidationResponse))

ROUTER.route('/validation/rejected')
  .post(asyncHandler(ValidationController.postRejectedValidationResponse))

export default ROUTER
