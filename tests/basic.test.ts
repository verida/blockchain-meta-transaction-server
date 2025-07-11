const assert = require("assert")
import Axios from 'axios'
import { Context } from '@verida/client-ts'
import { AccountNodeDIDClientConfig, Network } from '@verida/types'
import { AutoAccount } from '@verida/account-node'

import dotenv from 'dotenv'
dotenv.config()

const SENDER_CONTEXT = 'Verida Test: Any sending app'
const SENDER_PRIVATE_KEY = '0x78d3b996ec98a9a536efdffbae40e5eaaf117765a587483c69195c9460165c37'

const DID_CLIENT_CONFIG: AccountNodeDIDClientConfig = {
    callType: 'web3',
    web3Config: {
        privateKey: '',
        rpcUrl: 'https://rpc-mumbai.maticvigil.com/'
    }
},

const account = new AutoAccount({
    privateKey: SENDER_PRIVATE_KEY, 
    network: Network.DEVNET,
    didClientConfig: DID_CLIENT_CONFIG
})

let context: Context
let SENDER_DID: string
let SENDER_SIG: string

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

    SENDER_DID = (await account.did()).toLowerCase()
    const keyring = await account.keyring(SENDER_CONTEXT)
    SENDER_SIG = await keyring.sign(`Access the "generic" service using context: "${SENDER_CONTEXT}"?\n\n${SENDER_DID}`)
    
    config["auth"] = {
        username: SENDER_DID.replace(/:/g, "_"),
        password: SENDER_SIG,
    }

    return Axios.create(config)
}

const PORT = process.env.SERVER_PORT ? process.env.SERVER_PORT : 5021;
const SERVER_URL = `http://localhost:${PORT}`

/*const getAxios = async () => {
    return Axios.create()
}*/

let server

describe("Generic Server Tests", function() {

    describe("Basic endpoints", async () => {
        this.timeout(100000)

        server = await getAxios()

        it("Can echo", async () => {
            const response: any = await server.get(SERVER_URL + '/')

            console.log(response.data)

            assert.ok(response && response.data, 'Have a response')
            assert.equal(response.status, '200', 'Have a success response')
        })

        it("Can rejected", async () => {
            const promise = new Promise((resolve, rejects) => {
                server.get(SERVER_URL + '/error', {}).then(rejects, resolve)
            })

            const result: any = await promise

            assert.equal(result.response.status, 404, 'Have expected error HTTP status code')
        })
    });

});