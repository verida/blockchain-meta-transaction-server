import express from 'express'
import DemoController from './demoController'

import didRegistryRouter from './vda-did-registry'

const router = express.Router()

router.use('/vda-did-registry', didRegistryRouter)

router.post('/echo', DemoController.echo)
router.get('/error', DemoController.error)

export default router