const assert = require("assert")
import Axios from 'axios'
import { Network, EnvironmentType, Context } from '@verida/client-ts'
import { AutoAccount } from '@verida/account-node'

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
const SERVER_URL = `http://localhost:${PORT}/NameRegistry`

const testSignature = "0x67de2d20880a7d27b71cdcb38817ba95800ca82dff557cedd91b96aacb9062e80b9e0b8cb9614fd61ce364502349e9079c26abaa21890d7bc2f1f6c8ff77f6261c"
const badSignature = "0xf157fd349172fa8bb84710d871724091947289182373198723918cabcc888ef888ff8876956050565d5757a57d868b8676876e7678687686f95419238191488923"

let server

const testNames = [
    "John.verida",
    "Smith Elba.verida",
    "Bill Clin.verida",
    "Jerry Smith.verida",

    "Jerry Smith.test",
    "Billy.test",
  ];

const newSuffix = "test";

const testDIDs = [
    "0x181aB2d2F0143cd2046253c56379f7eDb1E9C133",
    "0x2b3f34e9d4b127797ce6244ea341a83733ddd6e4",
    "0x327c1FEd75440d4c3fA067E633A3983D211f0dfD",
    "0x4f41ce9d745404acd3f068E632A1781Da11f0dfD",
  ];

const zeroAddress = "0x0000000000000000000000000000000000000000";


// Authentication header for http requests
const auth_header = {
    headers: {
        'user-agent': 'Verida-Vault'
    }
}

const checkFunctionCall = async (fnName: string, isSuccess: boolean, param: any) => {
    const response: any = await server.post(
        SERVER_URL + `/${fnName}`, 
        param, 
        auth_header                        
    )
    assert.ok(response && response.data, 'Have a response')

    // console.log("Response", response)

    assert.equal(response.data.success, isSuccess, 'Have a success response')
}

describe("NameRegistry Tests", function() {
    before(async () =>{
        this.timeout(100000)
        server = await getAxios()
    })

    describe("Register()",async () => {
        it("Should fail - Bad Signature", async () => {
            await checkFunctionCall(
                'register',
                false,
                {
                    name: testNames[0],
                    did: testDIDs[0],
                    signature: badSignature
                }
            )
        })

        it("Should fail - Invalid zero address", async () => {
            await checkFunctionCall(
                'register',
                false,
                {
                    name: testNames[0],
                    did: zeroAddress,
                    signature: testSignature
                }
            )
        })

        it("Should fail - Unregistered suffix", async () => {
            await checkFunctionCall(
                'register',
                false,
                {
                    name: "tester.unknown",
                    did: testDIDs[0],
                    signature: testSignature
                }
            )
        })        

        it("Register successfully", async () => {
            await checkFunctionCall(
                'register',
                true,
                {
                    name: testNames[0],
                    did: testDIDs[0],
                    signature: testSignature
                }
            )
        })

        it("Should fail - Name already registered", async () => {
            await checkFunctionCall(
                'register',
                false,
                {
                    name: testNames[0],
                    did: testDIDs[0],
                    signature: testSignature
                }
            )

            await checkFunctionCall(
                'register',
                false,
                {
                    name: testNames[0],
                    did: testDIDs[1],
                    signature: testSignature
                }
            )
        })

        it("Add multiple user names successfully",async () => {
            for (let i = 1; i <= 2; i++) {
                await checkFunctionCall(
                    'register',
                    true,
                    {
                        name: testNames[i],
                        did: testDIDs[0],
                        signature: testSignature
                    }
                )
            }
        })
    })
    
    describe("Find a DID", async () => {
        it("Should fail - Unregistered name", async () => {
            await checkFunctionCall(
                'findDid',
                false,
                {
                    name: testNames[3],
                }
            )
        })

        it("Successfully get DID",async () => {
            for (let i = 0; i <= 2; i++) {
                await checkFunctionCall(
                    'findDid',
                    true,
                    {
                        name: testNames[i],
                    }
                )
            }
        })
    })

    describe("getUserNameList", async() => {
        it("Successfully get userNameList",async () => {
            await checkFunctionCall(
                'getUserNameList',
                true,
                {
                    did: testDIDs[0],
                    signature: testSignature
                }
            )
        })
    })

    describe("Unregister", async () => {
        it("Should fail - unregistered name", async() => {
            await checkFunctionCall(
                'unregister',
                false,
                {
                    name: testNames[3],
                    did: testDIDs[0],
                    signature: testSignature
                }
            )
        })

        it("Should fail - Invalid DID", async() => {
            await checkFunctionCall(
                'unregister',
                false,
                {
                    name: testNames[0],
                    did: testDIDs[1],
                    signature: testSignature
                }
            )

            await checkFunctionCall(
                'unregister',
                false,
                {
                    name: testNames[0],
                    did: testDIDs[2],
                    signature: testSignature
                }
            )

            await checkFunctionCall(
                'unregister',
                false,
                {
                    name: testNames[1],
                    did: testDIDs[2],
                    signature: testSignature
                }
            )
        })

        it("Unregister successfly", async () => {
            for (let i = 0; i <= 2; i++) {
                await checkFunctionCall(
                    'unregister',
                    true,
                    {
                        name: testNames[i],
                        did: testDIDs[0],
                        signature: testSignature
                    }
                )
            }
        })
    })
    
    describe("Add suffix", async () => {
        it ("Add suffix successfully",async () => {
            /*
            // This must be called once for test, as there is no removing function
            // Since 2nd time of this call, it will be rejected by "Already registered"
            // And this must be called by owner of contract
            await checkFunctionCall(
                'addSufix',
                true,
                {
                    suffix: newSuffix,
                }
            )
            */
    
            await checkFunctionCall(
                'register',
                true,
                {
                    name: testNames[4],
                    did: testDIDs[0],
                    signature: testSignature
                }
            )
    
            await checkFunctionCall(
                'unregister',
                true,
                {
                    name: testNames[4],
                    did: testDIDs[0],
                    signature: testSignature
                }
            )
        })
    })    
});