const assert = require("assert")
import Axios from 'axios'

import { formatBytes32String } from "ethers/lib/utils";
import EncryptionUtils from "@verida/encryption-utils";
import { ethers, Wallet } from 'ethers'

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
// const SERVER_URL = `https://meta-tx-server1.tn.verida.tech/NameRegistry`

let server

const testNames = [
    "helloworld1.vda",
    "hello----world--1.vda",
    "hello_world-dave1.vda",
    "JerrySmith1.vda",

    "JerrySmith1.test",
    "Billy1.test",
  ];

const newSuffix = "test";

const dids = [
    {
        address: "0x8Ec5df9Ebc9554CECaA1067F974bD34735d3e539",
        privateKey: "0x42d4c8a6b73fe84863c6f6b5a55980f9a8949e18ed20da65ca2033477ad563f0",
        publicKey: "0x042b816206dfd7c694d627ff775b9c151319b9a0e54de94d18e61619372fc713664dc677d5247adc2d4f8722b227bd9504b741ea380d5e7887a5698a7a634ec6ae",
    },
    {
        address: "0x1Ac3e26e1B5241B0aA11eB2646405BAc1919c784",
        privateKey: "0xff8ca2b935c1b9029a4f783c307e2ed543c93fa64d2c029e124d09d3409e79ec",
        publicKey: "0x04707d7adcbfc528b5f8cb7efd1dce9f5d9b32ed56a0f663d67c036d394bc8bb27e8b8bf53276e14db6e4a4b69a9f42b9e920198fc281b2668805c6fab8ee02646",
    },
    {
        address: "0xA0Bdf2665026a2C2C750EE18688625d340C0AA0f",
        privateKey: "0x0ce6e5dcecd8359bcf04162f54325681a09fe3d94ce253e97e6874bccec93a86",
        publicKey: "0x048697c917584c849de43490d73a4ca7391db3474bf1a93587eef0ddc4602de3022dfa00e5525ccb4405438de861b52915204e023984419fd87296f40a9543ad84",
    }
    // Wallet.createRandom(),
    // Wallet.createRandom(),
    // Wallet.createRandom(),
    // Wallet.createRandom(),
    // Wallet.createRandom(),
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

const getFunctionResult = async (fnName: string, param: any) => {
    const response: any = await server.post(
        SERVER_URL + `/${fnName}`, 
        param, 
        auth_header                        
    )
    return response.data.data
}

const getNonce = async (did: string) => {
    const response: any = await server.post(
        SERVER_URL + "/nonce", 
        {
            did,
        }, 
        auth_header                        
    )
    // console.log("GetNonce Result : ", did, response.data)
    if (!response.data.success)
        return ''
    return response.data.data
}

const createVeridaSign = async (
    rawMsg: any,
    privateKey: string,
    docDID: string
  ) => {
 
    const nonce = await getNonce(docDID);
    rawMsg = ethers.utils.solidityPack(["bytes", "uint256"], [rawMsg, nonce]);
    const privateKeyArray = new Uint8Array(
      Buffer.from(privateKey.slice(2), "hex")
    );
    return EncryptionUtils.signData(rawMsg, privateKeyArray);
  };

interface WalletInterface{
    address: string,
    privateKey: string,
    publicKey: string
}
const getRegisterSignature = async (name: string, did: WalletInterface) => {
    const rawMsg = ethers.utils.solidityPack(
      ["string", "address"],
      [name, did.address]
    );
    return createVeridaSign(rawMsg, did.privateKey, did.address);
  };
  

describe("NameRegistry Tests", function() {
    before(async () =>{
        this.timeout(100000)
        server = await getAxios()
    })

    describe("Register()",async () => {
        it("Should fail - Invalid zero address", async () => {
            await checkFunctionCall(
                'register',
                false,
                {
                    name: testNames[0],
                    did: zeroAddress,
                    signature: formatBytes32String("Correct signature not working")
                }
            )
        })

        it("Should fail : Invalid character specified in names", async () => {
            const invalidnames = ["hello world.vda", "hello!world.vda"];
            for (let i = 0; i < invalidnames.length; i++) {
                const name = invalidnames[i];
                const signature = await getRegisterSignature(name, dids[0]);
                await checkFunctionCall(
                    'register',
                    false,
                    {
                        name: testNames[0],
                        did: zeroAddress,
                        signature: signature
                    }
                )
              }
        })

        it("Should fail : . not permitted", async () => {
            const invalidnames = ["david.test.vda", "hello..vda"];
            for (let i = 0; i < invalidnames.length; i++) {
                const name = invalidnames[i];
                const signature = await getRegisterSignature(name, dids[0]);
                await checkFunctionCall(
                    'register',
                    false,
                    {
                        name: testNames[0],
                        did: zeroAddress,
                        signature: signature
                    }
                )
            }
        })

        it("Should fail - Unregistered suffix", async () => {
            const signature = await getRegisterSignature(testNames[4], dids[0]);
            await checkFunctionCall(
                'register',
                false,
                {
                    name: "tester.unknown",
                    did: dids[0].address,
                    signature: signature
                }
            )
        })        

        it("Should fail - Bad Signature", async () => {
            await checkFunctionCall(
                'register',
                false,
                {
                    name: testNames[0],
                    did: dids[0].address,
                    signature: formatBytes32String("Invalid Signature")
                }
            )
        })

        it("Register successfully", async () => {
            const signature = await getRegisterSignature(testNames[0], dids[0]);
            // console.log("Signature = ", signature)
            await checkFunctionCall(
                'register',
                true,
                {
                    name: testNames[0],
                    did: dids[0].address,
                    signature: signature
                }
            )
        })

        it("Should fail - Name already registered", async () => {
            let signature = await getRegisterSignature(testNames[0], dids[0]);
            await checkFunctionCall(
                'register',
                false,
                {
                    name: testNames[0],
                    did: dids[0].address,
                    signature: signature
                }
            )

            signature = await getRegisterSignature(testNames[0], dids[1]);
            await checkFunctionCall(
                'register',
                false,
                {
                    name: testNames[0],
                    did: dids[1].address,
                    signature: signature
                }
            )
        })
    })

    describe("Max names per DID", () => {
        /*
        // Only able to call when the PrivateKey of env is the owner of contract
        it("Update max names per DID",async () => {
            await checkFunctionCall(
                'updateMaxNamesPerDID',
                true,
                {
                    count: 5,
                }
            )
        })
        */

        it("Add multiple user names successfully",async () => {
            for (let i = 1; i <= 2; i++) {
                const signature = await getRegisterSignature(testNames[i], dids[0])
                await checkFunctionCall(
                    'register',
                    true,
                    {
                        name: testNames[i],
                        did: dids[0].address,
                        signature: signature
                    }
                )
            }
        })
    })
    
    describe("Find a DID", async () => {
        it("Should fail - Unregistered name", async () => {
            await checkFunctionCall(
                'findDID',
                false,
                {
                    name: testNames[3],
                }
            )
        })

        it("Successfully get DID",async () => {
            for (let i = 0; i <= 2; i++) {
                await checkFunctionCall(
                    'findDID',
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
            const result = await getFunctionResult(
                'getUserNameList',
                {
                    did: dids[0].address,
                }
            )
        })
    })

    describe("Unregister", async () => {
        it("Should fail - unregistered name", async() => {
            const signature = getRegisterSignature(testNames[3], dids[0])
            await checkFunctionCall(
                'unregister',
                false,
                {
                    name: testNames[3],
                    did: dids[0].address,
                    signature
                }
            )
        })

        it("Should fail - Invalid DID", async() => {
            let signature = getRegisterSignature(testNames[3], dids[0])
            await checkFunctionCall(
                'unregister',
                false,
                {
                    name: testNames[3],
                    did: dids[0].address,
                    signature
                }
            )

            signature = getRegisterSignature(testNames[0], dids[1])
            await checkFunctionCall(
                'unregister',
                false,
                {
                    name: testNames[0],
                    did: dids[1].address,
                    signature
                }
            )

            signature = getRegisterSignature(testNames[1], dids[2])
            await checkFunctionCall(
                'unregister',
                false,
                {
                    name: testNames[1],
                    did: dids[2].address,
                    signature
                }
            )
        })

        it("Unregister successfly", async () => {
            for (let i = 0; i <= 2; i++) {
                const signature = await getRegisterSignature(testNames[i], dids[0])
                await checkFunctionCall(
                    'unregister',
                    true,
                    {
                        name: testNames[i],
                        did: dids[0].address,
                        signature: signature
                    }
                )
            }
        })
    })
    
    /*
    describe("Add suffix", async () => {
        it ("Add suffix successfully",async () => {
            // This must be called once for test, as there is no removing function
            // Since 2nd time of this call, it will be rejected by "Already registered"
            // And this must be called by owner of contract
            // await checkFunctionCall(
            //     'addSufix',
            //     true,
            //     {
            //         suffix: newSuffix,
            //     }
            // )
    
            let signature = await getRegisterSignature(testNames[4], dids[0])
            await checkFunctionCall(
                'register',
                true,
                {
                    name: testNames[4],
                    did: dids[0].address,
                    signature
                }
            )
    
            signature = await getRegisterSignature(testNames[4], dids[0])
            await checkFunctionCall(
                'unregister',
                true,
                {
                    name: testNames[4],
                    did: dids[0].address,
                    signature
                }
            )
        })
    })
    */
});