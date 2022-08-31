const assert = require("assert")
import Axios from 'axios'

import dotenv from 'dotenv'
import { ethers, Wallet } from 'ethers'
dotenv.config()

import {
    getVeridaSign, 
    getVeridaSignWithNonce, 
    badSigner, 
    delegates, 
    attributes, 
    attributeToHex, 
    stringToBytes32, 
    pubKeyList,
    AttributeType,
    DelegateType
} from './const'

const publicKeyToAddress = require('ethereum-public-key-to-address')

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

// Authentication header for http requests
const auth_header = {
    headers: {
        'user-agent': 'Verida-Vault'
    }
}

let privateKey = process.env.PRIVATE_KEY
if (privateKey === undefined) {
    throw new Error('Define PRIVATE_KEY in .env file')
}
const did = new Wallet(privateKey!).address
if (!privateKey.startsWith('0x'))
    privateKey = '0x' + privateKey



const getNonce = async (did: string) => {
    const response: any = await server.post(
        SERVER_URL + "/getNonce", 
        {
            did,
        }, 
        auth_header                        
    )
    if (!response.data.success)
        return ''
    return response.data.data
}

describe("Generic Server Tests", function() {
    before(async () =>{
        this.timeout(100000)
        server = await getAxios()
    })

    describe("Http POST requests test", async () => {
        describe("changed() - Test for storage variable", async () => {
            it("Call success",async () => {
                const response = await server.post(
                    SERVER_URL + "/changed",
                    {
                        'param_1' : did
                    },
                    auth_header
                )
                // console.log("Changed = ", response.data)
            }) 
        })
        
        describe("changeOwner()",async () => {
            const identity1 = Wallet.createRandom();
            const identity2 = Wallet.createRandom();
            const identity3 = Wallet.createRandom();

            const did = identity1.address
            
            describe("Correct Signature", async () => {
                it("Change Success", async () => {
                    const rawMsg = ethers.utils.solidityPack(
                        ['address', 'address'],
                        [did, identity2.address]
                    )
                    const signature = getVeridaSignWithNonce(rawMsg, identity1.privateKey, await getNonce(did))
                    const response: any = await server.post(
                        SERVER_URL + "/changeOwner", 
                        {
                            identity: did,
                            newOwner: identity2.address,
                            signature
                        }, 
                        auth_header                        
                    )
                    assert.ok(response && response.data, 'Have a response')
        
                    // console.log("Response", response)
        
                    assert.equal(response.data.success, true, 'Have a success response')
                })

                it("Identity Changed correctly", async () => {
                    await sleep(1000)
                    await checkOwnerPOST(did, identity2.address)
                })
            });

            describe("Bad Signature", async () => {
                it("Should Fail", async () => {
                    await sleep(1000)
                    const rawMsg = ethers.utils.solidityPack(
                        ['address', 'address'],
                        [did, identity3.address]
                    )
                    // Owner of DID is identity2
                    const signature = getVeridaSignWithNonce(rawMsg, identity3.privateKey, await getNonce(did))
                    const response: any = await server.post(
                        SERVER_URL + "/changeOwner", 
                        {
                            identity: did,
                            newOwner: identity2.address,
                            signature
                        }, 
                        auth_header                        
                    )
                    assert.ok(response && response.data, 'Have a response')
        
                    // console.log("Response", response)
        
                    assert.equal(response.data.success, false, 'Have a success response')
                })
            });
        })

        describe("delegate test", async () => {
            const delegate = delegates[0]
            describe("addDelegate()", async() => {
                const getDelegateSignature = async (key: string) => {
                    const nonce = await getNonce(did)
    
                    const rawMsg = ethers.utils.solidityPack(
                        ['address', 'bytes32', 'address', 'uint256', 'uint256'],
                        [did, delegate.delegateType, delegate.delegate, delegate.validity, nonce]
                    )
                    return getVeridaSign(rawMsg, key)
                }
                it("validDelegate should be false", async () => {
                    await sleep(1000)
                    await checkValidDelegatePOST(
                        did,
                        delegate.delegateType,
                        delegate.delegate,
                        false
                        )
                })
    
                describe("Correct Signature", async() => {
                    it("delegate added successfully", async() => {
                        await checkOwnerPOST(did, did)
                        const signature = await getDelegateSignature(privateKey!)
                        const response: any = await server.post(
                            SERVER_URL + "/addDelegate", 
                            {
                                identity: did,
                                delegateType: delegate.delegateType,
                                delegate: delegate.delegate,
                                validity: delegate.validity,
                                signature
                            },
                            auth_header)
                        assert.ok(response && response.data, 'Have a response')
                        assert.equal(response.data.success, true, 'Have a success response')
                    })
    
                    it("validDelegate should be true", async () => {
                        await sleep(1000)
                        await checkValidDelegatePOST(
                            did,
                            delegate.delegateType,
                            delegate.delegate,
                            true
                            )
                    })
                })
    
                describe("Bad Signature", async() => {
                    it("should fail", async() => {
                        const signature = await getDelegateSignature(badSigner.privateKey)
                        const response: any = await server.post(
                            SERVER_URL + "/addDelegate", 
                            {
                                identity: did,
                                delegateType: delegate.delegateType,
                                delegate: delegate.delegate,
                                validity: delegate.validity,
                                signature
                            },
                            auth_header)
                        assert.ok(response && response.data, 'Have a response')
                        assert.equal(response.data.success, false, 'Failed to add delegate')
                    })
                })
            })
    
            describe("revokeDelegate()", async() => {
                const getDelegateSignature = async (key: string) => {
                    const nonce = await getNonce(did)
    
                    const rawMsg = ethers.utils.solidityPack(
                        ['address', 'bytes32', 'address', 'uint256'],
                        [did, delegate.delegateType, delegate.delegate, nonce]
                    )
                    return getVeridaSign(rawMsg, key)
                }
                it("validDelegate should be true", async () => {
                    await sleep(1000)
                    await checkValidDelegatePOST(
                        did,
                        delegate.delegateType,
                        delegate.delegate,
                        true
                        )
                })

                describe("Bad Signature", async() => {
                    it("should fail", async() => {
                        const signature = await getDelegateSignature(badSigner.privateKey)
                        const response: any = await server.post(
                            SERVER_URL + "/revokeDelegate", 
                            {
                                identity: did,
                                delegateType: delegate.delegateType,
                                delegate: delegate.delegate,
                                signature 
                            },
                            auth_header)
                        assert.ok(response && response.data, 'Have a response')
                        assert.equal(response.data.success, false, 'Failed to add delegate')
                    })
                })
    
                describe("Correct Signature", async() => {
                    it("delegate revoke successfully", async() => {
                        const signature = await getDelegateSignature(privateKey!)
                        const response: any = await server.post(
                            SERVER_URL + "/revokeDelegate", 
                            {
                                identity: did,
                                delegateType: delegate.delegateType,
                                delegate: delegate.delegate,
                                signature 
                            },
                            auth_header)
                        assert.ok(response && response.data, 'Have a response')
                        assert.equal(response.data.success, true, 'Have a success response')
                    })
    
                    it("validDelegate should be false", async () => {
                        await sleep(1000)
                        await checkValidDelegatePOST(
                            did,
                            delegate.delegateType,
                            delegate.delegate,
                            false
                            )
                    })
                })
            })
        })

        describe('attribute test', async () => {
            const attribute = attributes[0]
            const attributeName = stringToBytes32(attribute.name)
            const attributeValue = attributeToHex(attribute.name, attribute.value)

            const publicKey = pubKeyList[0]
            const providerAddress = publicKeyToAddress(publicKey)
            
            const rawProof = ethers.utils.solidityPack(
                ['address', 'address'],
                [did, providerAddress]
            )
            const proofSignature = getVeridaSign(rawProof, privateKey!)

            const getAttributeSignature = async (rawMsg: string, key:string) => {
                const nonce = await getNonce(did)
                return getVeridaSignWithNonce(rawMsg, key, nonce)
            }

            describe("setAttribute()", async () => {
                const rawMsg = ethers.utils.solidityPack(
                    ['address', 'bytes32', 'bytes', 'uint', 'bytes'],
                    [did, attributeName, attributeValue, attribute.validity, proofSignature]
                )

                describe("Bad Signature", async() => {
                    it("Should fail", async() => {
                        await sleep(1000)
                        const signature = await getAttributeSignature(rawMsg, badSigner.privateKey!)
                        const response: any = await server.post(
                            SERVER_URL + "/setAttribute", 
                            {
                                identity: did,
                                name: attribute.name,
                                value: attribute.value,
                                validity: attribute.validity,
                                proof: proofSignature,
                                signature
                            },
                            auth_header)
                        assert.ok(response && response.data, 'Have a response')    
                        assert.equal(response.data.success, false, 'Failed to set attribute')
                    })
                })

                describe("Correct Signature", async() => {
                    it("Set attribute successfully", async() => {
                        await sleep(1000)
                        const signature = await getAttributeSignature(rawMsg, privateKey!)
                        const response: any = await server.post(
                            SERVER_URL + "/setAttribute", 
                            {
                                identity: did,
                                name: attributeName,
                                value: attributeValue,
                                validity: attribute.validity,
                                proof: proofSignature,
                                signature
                            },
                            auth_header)
                        assert.ok(response && response.data, 'Have a response')    
                        assert.equal(response.data.success, true, 'Have a success response')
                    })
                })
            })

            describe("revokeAttribute()", async () => {
                const rawMsg = ethers.utils.solidityPack(
                    ['address', 'bytes32', 'bytes'],
                    [did, attributeName, attributeValue]
                )
                describe("Bad Signature", async() => {
                    it("Should fail", async() => {
                        await sleep(1000)
                        const signature = await getAttributeSignature(rawMsg, badSigner.privateKey)
                        const response: any = await server.post(
                            SERVER_URL + "/revokeAttribute", 
                            {
                                identity: did,
                                name: attributeName,
                                value: attributeValue,
                                signature
                            },
                            auth_header)
                        assert.ok(response && response.data, 'Have a response')    
                        assert.equal(response.data.success, false, 'Failed to revoke attribute')
                    })
                })
    
                describe("Correct Signature", async() => {
    
                    it("Revoke attribute successfully", async() => {
                        await sleep(1000)
                        const signature = await getAttributeSignature(rawMsg, privateKey!)
                        const response: any = await server.post(
                            SERVER_URL + "/revokeAttribute", 
                            {
                                identity: did,
                                name: attributeName,
                                value: attributeValue,
                                signature
                            },
                            auth_header)
                        assert.ok(response && response.data, 'Have a response')    
                        assert.equal(response.data.success, true, 'Have a success response')
                    })
                })
            })
        })

        describe("bulk test", async () => {

            const publicKey = pubKeyList[0]
            const providerAddress = publicKeyToAddress(publicKey)

            const rawProof = ethers.utils.solidityPack(
                ['address', 'address'],
                [did, providerAddress]
            )
            const proofSignature = getVeridaSign(rawProof, privateKey!)

            const delegateParams : DelegateType[] = []
            
            const attributeParams : AttributeType[] = []
            
            const revokeDelegateParams : DelegateType[] = []
            
            const revokeAttributeParams : AttributeType[] = []

            const getBulkRawMsg = (delegateParams: DelegateType[], attrParams: AttributeType[]) => {
                let rawMsg = ethers.utils.solidityPack(['address'], [did])
                delegateParams.forEach(item => {
                    if (item.validity === undefined) {
                        rawMsg = ethers.utils.solidityPack(
                            ['bytes','bytes32','address'],
                            [rawMsg, item.delegateType, item.delegate]
                          )
                    } else {
                        rawMsg = ethers.utils.solidityPack(
                            ['bytes','bytes32','address','uint'],
                            [rawMsg, item.delegateType, item.delegate, item.validity]
                          )
                    }
                })
                attrParams.forEach(item => {
                    if (item.validity === undefined) {
                        rawMsg = ethers.utils.solidityPack(
                            ['bytes','bytes32','bytes'],
                            [rawMsg, item.name, item.value]
                          )
                    } else {
                        rawMsg = ethers.utils.solidityPack(
                            ['bytes','bytes32','bytes','uint','bytes'],
                            [rawMsg, item.name, item.value, item.validity, proofSignature]
                          )
                    }
                })
                return rawMsg
            }

            before(async () => {
                for (let i = 0; i < 2; i++) {
                    delegateParams.push(delegates[i])
                    revokeDelegateParams.push({
                        delegateType: delegates[i].delegateType,
                        delegate: delegates[i].delegate
                    })
                }

                const attributeName = stringToBytes32(<string>attributes[0].name)
                const attributeValue = attributeToHex(<string>attributes[0].name, <string>attributes[0].value)

                attributeParams.push({
                    name: attributeName,
                    value: attributeValue,
                    validity: attributes[0].validity!,
                    proof: proofSignature
                })

                revokeAttributeParams.push({
                    name: attributeName,
                    value: attributeValue,
                })
            })

            describe("bulkAdd()",async () => {
                it("validity of delegates should be false", async () => {
                    for (let i = 0; i < delegateParams.length; i++) {
                        await checkValidDelegatePOST(
                            did,
                            <string>delegateParams[i].delegateType,
                            <string>delegateParams[i].delegate,
                            false
                        )
                    }
                })
                
                describe("Correct signature",async () => {
                    it ("Failed because of inavlid arguments", async() => {
                        const response: any = await server.post(
                            SERVER_URL + "/bulkAdd", 
                            {
                                identity: did,
                                delegateParams: "InvalidArgs",
                                attributeParams: "InvalidArgs",
                                signature: "" 
                            },
                            auth_header)
                        // console.log("bulkAdd Response:", response)
                        assert.ok(response && response.data, 'Have a response')
                        assert.equal(response.data.success, false, 'Failed by invalid arguments')
                    })
    
                    it("bulkAdd success for empty values", async() => {
                        const rawMsg = getBulkRawMsg([], [])
                        const signature = getVeridaSignWithNonce(rawMsg, privateKey!, await getNonce(did))
                        const response: any = await server.post(
                            SERVER_URL + "/bulkAdd", 
                            {
                                identity: did,
                                delegateParams: [],
                                attributeParams: [],
                                signature
                            },
                            auth_header)
                        // console.log("bulkAdd Response:", response)
                        assert.ok(response && response.data, 'Have a response')    
                        assert.equal(response.data.success, true, 'Have a success response')
                    })
    
                    it("bulkAdd success", async() => {
                        const rawMsg = getBulkRawMsg(delegateParams, attributeParams);
                        const signature = getVeridaSignWithNonce(rawMsg, privateKey!, await getNonce(did))
                        const response: any = await server.post(
                            SERVER_URL + "/bulkAdd", 
                            {
                                identity: did,
                                delegateParams: delegateParams,
                                attributeParams: attributeParams,
                                signature 
                            },
                            auth_header)
                        // console.log("bulkAdd Response:", response)
                        assert.ok(response && response.data, 'Have a response')    
                        assert.equal(response.data.success, true, 'Have a success response')
                    })
    
                    it("validity of delegates should be true",async () => {
                        // await sleep(2000)
                        for (let i = 0; i < delegateParams.length; i++) {
                            await checkValidDelegatePOST(
                                did,
                                <string>delegateParams[i].delegateType,
                                <string>delegateParams[i].delegate,
                                true
                            )
                        }
                    })
                })
    
                describe("Bad signature", async() => {
                    const rawMsg = getBulkRawMsg(delegateParams, attributeParams);
                    const signature = getVeridaSignWithNonce(rawMsg, badSigner.privateKey, await getNonce(did))
                    it("should fail", async() => {
                        const response: any = await server.post(
                            SERVER_URL + "/bulkAdd", 
                            {
                                identity: did,
                                delegateParams: delegateParams,
                                attributeParams: attributeParams,
                                signature
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
                    for (let i = 0; i < delegateParams.length; i++) {
                        await checkValidDelegatePOST(
                            did,
                            <string>delegateParams[i].delegateType,
                            <string>delegateParams[i].delegate,
                            true
                        )
                    }
                })
    
                describe("Bad signature", async() => {
                    it("should fail", async() => {
                        const rawMsg = getBulkRawMsg(revokeDelegateParams, revokeAttributeParams);
                        const signature = getVeridaSignWithNonce(rawMsg, badSigner.privateKey, await getNonce(did))
                        const response: any = await server.post(
                            SERVER_URL + "/bulkRevoke", 
                            {
                                identity: did,
                                delegateParams: revokeDelegateParams,
                                attributeParams: revokeAttributeParams,
                                signature
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
                                identity: did,
                                delegateParams: "InvalidArgs",
                                attributeParams: "InvalidArgs",
                                signature: "" 
                            },
                            auth_header)
                        // console.log("bulkAdd Response:", response)
                        assert.ok(response && response.data, 'Have a response')    
                        assert.equal(response.data.success, false, 'Failed by invalid arguments')
                    })
    
                    it("bulkRevoke success for empty values", async() => {
                        const rawMsg = getBulkRawMsg([], [])
                        const signature = getVeridaSignWithNonce(rawMsg, privateKey!, await getNonce(did))
                        const response: any = await server.post(
                            SERVER_URL + "/bulkRevoke", 
                            {
                                identity: did,
                                delegateParams: [],
                                attributeParams: [],
                                signature
                            },
                            auth_header)
                        // console.log("bulkAdd Response:", response)
                        assert.ok(response && response.data, 'Have a response')    
                        assert.equal(response.data.success, true, 'Have a success response')
                    })
    
                    it("bulkRevoke success", async() => {
                        await sleep(1000)
                        const rawMsg = getBulkRawMsg(revokeDelegateParams, revokeAttributeParams);
                        const signature = getVeridaSignWithNonce(rawMsg, privateKey!, await getNonce(did))
                        const response: any = await server.post(
                            SERVER_URL + "/bulkRevoke", 
                            {
                                identity: did,
                                delegateParams: revokeDelegateParams,
                                attributeParams: revokeAttributeParams,
                                signature
                            },
                            auth_header)
                        // console.log("bulkAdd Response:", response)
                        assert.ok(response && response.data, 'Have a response')    
                        assert.equal(response.data.success, true, 'Have a success response')
                    })
    
                    it("validity of delegates should be false",async () => {
                        await sleep(1000)
                        for (let i = 0; i < delegateParams.length; i++) {
                            await checkValidDelegatePOST(
                                did,
                                <string>delegateParams[i].delegateType,
                                <string>delegateParams[i].delegate,
                                false
                            )
                        }
                    })
                })     
            })
        })       
    })
});