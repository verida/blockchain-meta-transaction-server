import express from 'express'
const cors = require('cors')
import bodyParser from 'body-parser'
import router from './routes'
const basicAuth = require('express-basic-auth')
import RequestValidator from './request-validator'

//import DbManager from './dbManager'

import dotenv from 'dotenv'
import { BigNumberish, BytesLike } from 'ethers'
dotenv.config();

// Set up the express app
const app = express();
// const validator = new RequestValidator()

const corsConfig = {}

function authentication(req:any,res:any,next:any) {
  let authHeader = req.headers.authorization;

  console.log("Authennticating: ", req.headers);

  if (!authHeader) {
    let err = new Error('You\'re not authenticated!');
    console.log('Not authenticated');
    return next(err)
  }

  if (authHeader !== 'Verida gasless transaction') {
    let err = new Error('Wrong authentication!');
    console.log('Wrong authentication');
    return next(err)
  }

  next()
}


// Parse incoming requests data
app.use(cors(corsConfig))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
// Commenting out authorization for now
/*app.use(basicAuth({
  authorizer: validator.authorize,
  authorizeAsync: true,
  unauthorizedResponse: validator.getUnauthorizedResponse
}))*/

// Add basic authentication
app.use(authentication)

app.use(router)

//DbManager.ensureDb(process.env.DB_DOC_NAME)

/**
 * EndPoints for APIs
 */
app.get('/', (req, res) => res.send('Welcome to Verida-DID-Registry API!'));

const PORT = process.env.SERVER_PORT ? process.env.SERVER_PORT : 5021;
app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
});