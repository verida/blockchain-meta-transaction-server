const assert = require("assert")
import Axios from 'axios'
import { Network, EnvironmentType, Context } from '@verida/client-ts'
import { AutoAccount } from '@verida/account-node'

import {
    arrayify,
    concat,
    formatBytes32String,
    hexConcat,
    hexlify,
    hexZeroPad,
    keccak256,
    parseBytes32String,
    SigningKey,
    toUtf8Bytes,
    zeroPad,
  } from 'ethers/lib/utils'

import dotenv from 'dotenv'
dotenv.config()

const SENDER_CONTEXT = 'Verida Test: Any sending app'

const getAxios = async () => {
    const config: any = {
        headers: {
            "context-name": SENDER_CONTEXT,
        },
    }

    /*
    context = await Network.connect({
        context: {
            name: SENDER_CONTEXT
        },
        client: {
            environment: VERIDA_ENVIRONMENT
        },
        account
    })
    */

    /*
    SENDER_DID = (await account.did()).toLowerCase()
    const keyring = await account.keyring(SENDER_CONTEXT)
    SENDER_SIG = await keyring.sign(`Access the "generic" service using context: "${SENDER_CONTEXT}"?\n\n${SENDER_DID}`)
    
    config["auth"] = {
        username: SENDER_DID.replace(/:/g, "_"),
        password: SENDER_SIG,
    }*/
    
    return Axios.create(config)
}

const PORT = process.env.SERVER_PORT ? process.env.SERVER_PORT : 5021;
const SERVER_URL_HOME = `http://localhost:${PORT}`
const SERVER_URL = `http://localhost:${PORT}/vda-did-registry`


const identity = "0x268c970A5FBFdaFfdf671Fa9d88eA86Ee33e14B1"

const privateKey = arrayify('0xa285ab66393c5fdda46d6fbad9e27fafd438254ab72ad5acb681a0e9f20f5d7b')
const signerAddress = '0x2036C6CD85692F0Fb2C26E6c6B2ECed9e4478Dfd'

const privateKey2 = arrayify('0xa285ab66393c5fdda46d6fbad9e27fafd438254ab72ad5acb681a0e9f20f5d7a')
const signerAddress2 = '0xEA91e58E9Fa466786726F0a947e8583c7c5B3185'

let server

describe("Generic Server Tests", function() {
    before(async () =>{
        this.timeout(100000)
        server = await getAxios()
    })

    describe("Basic endpoints", async () => {
        it("Basic End Point", async () => {
            const response: any = await server.get(SERVER_URL_HOME)

            // console.log("Returned: ", response.data)
            assert.ok(response && response.data, 'Have a response')
            // assert.equal(response.data.status, 'success', 'Have a success response')
        })
    });

    describe("identityOwner",async () => {
        it("Success", async () => {
            const response: any = await server.get(
                SERVER_URL + 
                "/identityOwner?identity=" + identity
                )
            assert.ok(response && response.data, 'Have a response')

            // console.log("Response", response)

            assert.equal(response.data.success, true, 'Have a success response')
            assert.equal(response.data.owner, identity, 'Owner itself')
        })
    })

    describe("identityOwner",async () => {
        it("Success", async () => {
            const response: any = await server.get(
                SERVER_URL + 
                "/identityOwner?identity=" + identity
                )
            assert.ok(response && response.data, 'Have a response')

            // console.log("Response", response)

            assert.equal(response.data.success, true, 'Have a success response')
            assert.equal(response.data.owner, identity, 'Owner itself')
        })
    })

});