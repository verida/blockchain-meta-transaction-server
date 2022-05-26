import express from 'express'
import GenericController from "./genericController"

const router = express.Router()

router.post('/:contract/:method', GenericController.contract)

export default router