import express from 'express'
import serverless from 'serverless-http'
const cors = require('cors')
import bodyParser from 'body-parser'
import router from './routes'

//import DbManager from './dbManager'

import dotenv from 'dotenv'
dotenv.config();

// Set up the express app
const app = express();

const corsConfig = {}

// Parse incoming requests data
app.use(cors(corsConfig))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(router)

//DbManager.ensureDb(process.env.DB_DOC_NAME)

/**
 * EndPoints for APIs
 */
app.get('/', (req, res) => {
  res.send('Welcome to Verida-DID-Registry API!')
})

export const handler = serverless(app)