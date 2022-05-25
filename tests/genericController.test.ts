const assert = require("assert")
import Axios from 'axios'
import { Network, EnvironmentType, Context } from '@verida/client-ts'
import { AutoAccount } from '@verida/account-node'

import {
    arrayify,
    BytesLike,
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
import { BigNumberish } from 'ethers'
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
const SERVER_URL = `http://localhost:${PORT}/VeridaDIDRegistry`


const identity = "0x268c970A5FBFdaFfdf671Fa9d88eA86Ee33e14B1"
const identity2 = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
const delegate = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
const delegate2 = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
const delegate3 = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
const badBoy = "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"

const delegateType = formatBytes32String("attestor")
const validity = 86400

const attributeName = formatBytes32String("encryptionKey")
const attributeValue = formatBytes32String("encryptionKey")

const testSignature = "0x67de2d20880a7d27b71cdcb38817ba95800ca82dff557cedd91b96aacb9062e80b9e0b8cb9614fd61ce364502349e9079c26abaa21890d7bc2f1f6c8ff77f6261c"
const badSignature = "0xf157fd349172fa8bb84710d871724091947289182373198723918cabcc888ef888ff8876956050565d5757a57d868b8676876e7678687686f95419238191488923"

let server

const checkOwnerPOST = async (identity:String, owner: string) => {
    const response: any = await server.post(
        SERVER_URL + 
        "/identityOwner",
        {
            identity: identity
        }
        )
    // console.log("Response", response)

    assert.equal(response.data.success, true, 'Have a success response')
    assert.equal(response.data.data, owner, 'Correct Owner')
}

const checkValidDelegatePOST = async(identity:String, delegateType:string, delegate:string, result:boolean) => {
    const response: any = await server.post(
        SERVER_URL + "/validDelegate",
        {
            identity: identity,
            delegateType: delegateType,
            delegate: delegate
        })
    assert.ok(response && response.data, 'Have a response')
    assert.equal(response.data.success, true, 'Have a success response')
    assert.equal(response.data.data, result, 'Is valid Delegate')   
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

// Params for bulk transaction
const delegateParams : {
    delegateType: BytesLike;
    delegate: string;
    validity: BigNumberish
}[] = []

const attributeParams : {
    name: BytesLike;
    value: BytesLike;
    validity: BigNumberish;
}[] = []

delegateParams.push({
    delegateType: formatBytes32String("bulktest-1"),
    delegate: delegate3,
    validity: 86400
})

delegateParams.push({
    delegateType: formatBytes32String("bulktest-2"),
    delegate: delegate2,
    validity: 86400
})

attributeParams.push({
    name: formatBytes32String("encryptionKey"),
    value: "0x12345678",
    validity: 86400
})

const revokeDelegateParams : {
    delegateType: BytesLike;
    delegate: string;
}[] = []

const revokeAttributeParams : {
    name: BytesLike;
    value: BytesLike;
}[] = []

revokeDelegateParams.push({
    delegateType: formatBytes32String("bulktest-1"),
    delegate: delegate3,
})

revokeDelegateParams.push({
    delegateType: formatBytes32String("bulktest-2"),
    delegate: delegate2,
})

revokeAttributeParams.push({
    name: formatBytes32String("encryptionKey"),
    value: "0x12345678",
})

// Authentication header for http requests
const auth_header = {
    headers: {
        'user-agent': 'Verida-Vault'
    }
}


describe("Generic Server Tests", function() {
    before(async () =>{
        this.timeout(100000)
        server = await getAxios()
    })


    /*
    // Testing while development
    describe("Develop Testing", async() => {
        // it("bulkAdd success", async() => {
        //     const response: any = await server.post(
        //         SERVER_URL + "/bulkAdd", 
        //         {
        //             identity: identity,
        //             delegateParams: JSON.stringify(delegateParams),
        //             attributeParams: JSON.stringify(attributeParams),
        //             signature: testSignature 
        //         })
        //     console.log("bulkAdd Response:", response)
        //     // assert.ok(response && response.data, 'Have a response')    
        //     // assert.equal(response.data.success, true, 'Have a success response')
        // })

        it("identityOwner", async () => {                   
            const response: any = await server.post(
                SERVER_URL + "/identityOwner", 
                {
                    identity: identity
                }
            )
    
            // assert.ok(response && response.data, 'Have a response')
            // assert.equal(response.data.success, true, 'Have a success response')
    
            console.log("Response", response)
            
        })

        it("changeOwner", async () => {                
            const response: any = await server.post(
                SERVER_URL + "/changeOwner", 
                {
                    identity: identity,
                    newOwner: delegate,
                    signature: testSignature
                }, auth_header
            )
        
            // assert.ok(response && response.data, 'Have a response')
            // assert.equal(response.data.success, true, 'Have a success response')
    
            console.log("Response", response)
            
        })
    })
    */
    
    describe("Http POST requests test",async () => {

        describe("changeOwner()",async () => {
            describe("Correct Signature", async () => {
                it("Change Success", async () => {                
                    const response: any = await server.post(
                        SERVER_URL + "/changeOwner", 
                        {
                            identity: identity,
                            newOwner: delegate,
                            signature: testSignature
                        }, 
                        auth_header                        
                    )
                    assert.ok(response && response.data, 'Have a response')
        
                    // console.log("Response", response)
        
                    assert.equal(response.data.success, true, 'Have a success response')
                })

                it("Identity Changed correctly", async () => {
                    await sleep(1000)
                    await checkOwnerPOST(identity, delegate)
                })

                it("Restore owner of identity for another test", async () => {
                    await sleep(1000)
                    const response: any = await server.post(
                        SERVER_URL + "/changeOwner", 
                        {
                            identity: identity,
                            newOwner: identity,
                            signature: testSignature 
                        },
                        auth_header)
                    // console.log("Response", response)
                    assert.ok(response && response.data, 'Have a response')   
                    assert.equal(response.data.success, true, 'Have a success response')
                    await checkOwnerPOST(identity, identity)
                })
            });

            describe("Bad Signature", async () => {
                it("Should Fail", async () => {
                    await sleep(1000)
                    const response: any = await server.post(
                        SERVER_URL + "/changeOwner", 
                        {
                            identity: identity,
                            newOwner: delegate,
                            signature: badSignature 
                        },
                        auth_header)
                    assert.ok(response && response.data, 'Have a response')
        
                    // console.log("Response", response)
        
                    assert.equal(response.data.success, false, 'Have a success response')
                })
            });
        })
        
        describe("addDelegate()", async() => {
            it("validDelegate should be false", async () => {
                await sleep(1000)
                await checkValidDelegatePOST(
                    identity,
                    delegateType,
                    delegate3,
                    false
                    )
            })

            describe("Correct Signature", async() => {
                it("delegate added successfully", async() => {
                    const response: any = await server.post(
                        SERVER_URL + "/addDelegate", 
                        {
                            identity: identity,
                            delegateType: delegateType,
                            delegate: delegate3,
                            validity: validity,
                            signature: testSignature 
                        },
                        auth_header)
                    assert.ok(response && response.data, 'Have a response')
        
                    // console.log("Response", response)
        
                    assert.equal(response.data.success, true, 'Have a success response')
                })

                it("validDelegate should be true", async () => {
                    await sleep(1000)
                    await checkValidDelegatePOST(
                        identity,
                        delegateType,
                        delegate3,
                        true
                        )
                })
            })

            describe("Bad Signature", async() => {
                it("should fail", async() => {
                    const response: any = await server.post(
                        SERVER_URL + "/addDelegate", 
                        {
                            identity: identity,
                            delegateType: delegateType,
                            delegate: delegate3,
                            validity: validity,
                            signature: badSignature 
                        },
                        auth_header)
                    assert.ok(response && response.data, 'Have a response')
        
                    // console.log("Response", response)
        
                    assert.equal(response.data.success, false, 'Failed to add delegate')
                })
            })
        })

        describe("revokeDelegate()", async() => {
            it("validDelegate should be true", async () => {
                await sleep(1000)
                await checkValidDelegatePOST(
                    identity,
                    delegateType,
                    delegate3,
                    true
                    )
            })

            describe("Correct Signature", async() => {

                it("delegate revoke successfully", async() => {
                    const response: any = await server.post(
                        SERVER_URL + "/revokeDelegate", 
                        {
                            identity: identity,
                            delegateType: delegateType,
                            delegate: delegate3,
                            signature: testSignature 
                        },
                        auth_header)
                    assert.ok(response && response.data, 'Have a response')
        
                    // console.log("RevokeDelegate Response", response)
        
                    assert.equal(response.data.success, true, 'Have a success response')
                })

                it("validDelegate should be false", async () => {
                    await sleep(1000)
                    await checkValidDelegatePOST(
                        identity,
                        delegateType,
                        delegate3,
                        false
                        )
                })
            })

            describe("Bad Signature", async() => {
                it("should fail", async() => {
                    const response: any = await server.post(
                        SERVER_URL + "/revokeDelegate", 
                        {
                            identity: identity,
                            delegateType: delegateType,
                            delegate: delegate3,
                            signature: badSignature 
                        },
                        auth_header)
                    assert.ok(response && response.data, 'Have a response')
        
                    // console.log("Response", response)
        
                    assert.equal(response.data.success, false, 'Failed to add delegate')
                })
            })
        })
        
        describe("setAttribute()", async () => {
            describe("Correct Signature", async() => {

                it("Set attribute successfully", async() => {
                    await sleep(1000)
                    const response: any = await server.post(
                        SERVER_URL + "/setAttribute", 
                        {
                            identity: identity,
                            name: attributeName,
                            value: attributeValue,
                            validity: validity,
                            signature: testSignature 
                        },
                        auth_header)
                    assert.ok(response && response.data, 'Have a response')    
                    assert.equal(response.data.success, true, 'Have a success response')
                })
            })

            describe("Bad Signature", async() => {
                it("Should fail", async() => {
                    await sleep(1000)
                    const response: any = await server.post(
                        SERVER_URL + "/setAttribute", 
                        {
                            identity: identity,
                            name: attributeName,
                            value: attributeValue,
                            validity: validity,
                            signature: badSignature 
                        },
                        auth_header)
                    assert.ok(response && response.data, 'Have a response')    
                    assert.equal(response.data.success, false, 'Failed to set attribute')
                })
            })
        })

        describe("revokeAttribute()", async () => {
            describe("Bad Signature", async() => {
                it("Should fail", async() => {
                    await sleep(1000)
                    const response: any = await server.post(
                        SERVER_URL + "/revokeAttribute", 
                        {
                            identity: identity,
                            name: attributeName,
                            value: attributeValue,
                            signature: badSignature 
                        },
                        auth_header)
                    assert.ok(response && response.data, 'Have a response')    
                    assert.equal(response.data.success, false, 'Failed to revoke attribute')
                })
            })

            describe("Correct Signature", async() => {

                it("Revoke attribute successfully", async() => {
                    await sleep(1000)
                    const response: any = await server.post(
                        SERVER_URL + "/revokeAttribute", 
                        {
                            identity: identity,
                            name: attributeName,
                            value: attributeValue,
                            signature: testSignature 
                        },
                        auth_header)
                    assert.ok(response && response.data, 'Have a response')    
                    assert.equal(response.data.success, true, 'Have a success response')
                })
            })
        })

        describe("bulkAdd()",async () => {
            it("validity of delegates should be false",async () => {
                await checkValidDelegatePOST(
                    identity,
                    formatBytes32String("bulktest-1"),
                    delegate3,
                    false                
                )

                await checkValidDelegatePOST(
                    identity,
                    formatBytes32String("bulktest-2"),
                    delegate2,
                    false                
                )
            })
            describe("Correct signature",async () => {
                it ("Failed because of inavlid arguments", async() => {
                    const response: any = await server.post(
                        SERVER_URL + "/bulkAdd", 
                        {
                            identity: identity,
                            delegateParams: "InvalidArgs",
                            attributeParams: "InvalidArgs",
                            signature: testSignature 
                        },
                        auth_header)
                    // console.log("bulkAdd Response:", response)
                    // assert.ok(response && response.data, 'Have a response')
                    // assert.equal(response.data.success, false, 'Failed by invalid arguments')
                })

                it("bulkAdd success for empty values", async() => {
                    const response: any = await server.post(
                        SERVER_URL + "/bulkAdd", 
                        {
                            identity: identity,
                            delegateParams: [],
                            attributeParams: [],
                            signature: testSignature 
                        },
                        auth_header)
                    // console.log("bulkAdd Response:", response)
                    assert.ok(response && response.data, 'Have a response')    
                    assert.equal(response.data.success, true, 'Have a success response')
                })

                it("bulkAdd success", async() => {
                    const response: any = await server.post(
                        SERVER_URL + "/bulkAdd", 
                        {
                            identity: identity,
                            delegateParams: delegateParams,
                            attributeParams: attributeParams,
                            signature: testSignature 
                        },
                        auth_header)
                    // console.log("bulkAdd Response:", response)
                    assert.ok(response && response.data, 'Have a response')    
                    assert.equal(response.data.success, true, 'Have a success response')
                })

                it("validity of delegates should be true",async () => {
                    // await sleep(2000)
                    await checkValidDelegatePOST(
                        identity,
                        formatBytes32String("bulktest-1"),
                        delegate3,
                        true
                    )
        
                    await checkValidDelegatePOST(
                        identity,
                        formatBytes32String("bulktest-2"),
                        delegate2,
                        true
                    )
                })
            })

            describe("Bad signature", async() => {
                it("should fail", async() => {
                    const response: any = await server.post(
                        SERVER_URL + "/bulkAdd", 
                        {
                            identity: identity,
                            delegateParams: delegateParams,
                            attributeParams: attributeParams,
                            signature: badSignature 
                        },
                        auth_header)
                    // console.log("bulkAdd Response:", response)
                    assert.ok(response && response.data, 'Have a response')    
                    assert.equal(response.data.success, false, 'Have a success response')
                })
            })
        })

        describe("bulkRevoke()",async () => {
            it("validity of delegates should be true",async () => {
                await checkValidDelegatePOST(
                    identity,
                    formatBytes32String("bulktest-1"),
                    delegate3,
                    true
                )

                await checkValidDelegatePOST(
                    identity,
                    formatBytes32String("bulktest-2"),
                    delegate2,
                    true
                )
            })

            describe("Bad signature", async() => {
                it("should fail", async() => {
                    const response: any = await server.post(
                        SERVER_URL + "/bulkRevoke", 
                        {
                            identity: identity,
                            delegateParams: revokeDelegateParams,
                            attributeParams: revokeAttributeParams,
                            signature: badSignature 
                        },
                        auth_header)
                    // console.log("bulkAdd Response:", response)
                    assert.ok(response && response.data, 'Have a response')    
                    assert.equal(response.data.success, false, 'Failed by bad signature')
                })
            })

            describe("Correct signature",async () => {
                it ("Failed because of inavlid arguments", async() => {
                    const response: any = await server.post(
                        SERVER_URL + "/bulkRevoke", 
                        {
                            identity: identity,
                            delegateParams: "InvalidArgs",
                            attributeParams: "InvalidArgs",
                            signature: testSignature 
                        },
                        auth_header)
                    // console.log("bulkAdd Response:", response)
                    assert.ok(response && response.data, 'Have a response')    
                    assert.equal(response.data.success, false, 'Failed by invalid arguments')
                })

                it("bulkRevoke success for empty values", async() => {
                    const response: any = await server.post(
                        SERVER_URL + "/bulkRevoke", 
                        {
                            identity: identity,
                            delegateParams: [],
                            attributeParams: [],
                            signature: testSignature 
                        },
                        auth_header)
                    // console.log("bulkAdd Response:", response)
                    assert.ok(response && response.data, 'Have a response')    
                    assert.equal(response.data.success, true, 'Have a success response')
                })

                it("bulkRevoke success", async() => {
                    await sleep(1000)
                    const response: any = await server.post(
                        SERVER_URL + "/bulkRevoke", 
                        {
                            identity: identity,
                            delegateParams: revokeDelegateParams,
                            attributeParams: revokeAttributeParams,
                            signature: testSignature 
                        },
                        auth_header)
                    // console.log("bulkAdd Response:", response)
                    assert.ok(response && response.data, 'Have a response')    
                    assert.equal(response.data.success, true, 'Have a success response')
                })

                it("validity of delegates should be false",async () => {
                    await sleep(1000)
                    await checkValidDelegatePOST(
                        identity,
                        formatBytes32String("bulktest-1"),
                        delegate3,
                        false
                    )
        
                    await checkValidDelegatePOST(
                        identity,
                        formatBytes32String("bulktest-2"),
                        delegate2,
                        false
                    )
                })
            })     
        })
    })
});