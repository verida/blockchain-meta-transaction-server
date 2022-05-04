import express from 'express'
import DemoController from './demoController'
import GenericController from "./genericController"

//import didRegistryRouter from './vda-did-registry'

const router = express.Router()

//router.use('/vda-did-registry', didRegistryRouter)
router.post('/:contract/:method', GenericController.contract)

router.post('/echo', DemoController.echo)
router.get('/error', DemoController.error)

export default router