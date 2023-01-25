const assert = require("assert")
import Axios from 'axios'

import dotenv from 'dotenv'
import { ethers, Wallet } from 'ethers'
dotenv.config()

import { generateProof, SignInfo } from './utils-keyring'
import EncryptionUtils from "@verida/encryption-utils";

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
const SERVER_URL = `http://localhost:${PORT}/VeridaDIDLinkage`
//const SERVER_URL = `https://meta-tx-server1.tn.verida.tech/VeridaDIDLinkage`

let server

// Authentication header for http requests
const auth_header = {
    headers: {
        'user-agent': 'Verida-Vault'
    }
}

const getNonce = async (did: string) => {
    const response: any = await server.post(
        SERVER_URL + "/nonce", 
        {
            did,
        }, 
        auth_header                        
    )
    console.log("GetNonce Result : ", did, response.data)
    if (!response.data.success)
        return ''
    return response.data.data
}

let signInfo : SignInfo

interface IdentifierTypeInfo {
    name: string
    isSelfSigner: boolean
}
const identifierTypes : IdentifierTypeInfo[] = [
    { name: "facebook", isSelfSigner: false },
    { name: "twitter", isSelfSigner: false },
    { name: "blockchain:eip155", isSelfSigner: true },
]

// Helper function
const getLinkRequestSignature = async(
    didAddr: string, 
    identifier: string, 
    signedData: string, 
    signedProof: string) => 
{
    
    const nonce = await getNonce(didAddr)

    const rawMsg = ethers.utils.solidityPack(
        ['address', 'string', 'bytes', 'bytes', 'uint'],
        [didAddr, identifier, signedData, signedProof, nonce]
    )

    return await signInfo.userKeyring.sign(rawMsg)
}

const getUnlinkRequestSignature = async(
    didAddr: string, 
    identifier: string) => 
{
    const nonce = await getNonce(didAddr)

    const strDID = `did:vda:${didAddr.toLowerCase()}`
    const msg = `${strDID}|${identifier}`

    const rawMsg = ethers.utils.solidityPack(
        ['string' ,'uint'],
        [msg, nonce]
    )

    return await signInfo.userKeyring.sign(rawMsg)
}

const callLinkAPI = async (
    identifier: string, 
    signedData: string, 
    signedProof: string,
    isSuccessful = true
) => {
    const requestSignature = await getLinkRequestSignature(
        signInfo.userAddress!,
        identifier,
        signedData,
        signedProof
    )

    const response = await server.post(
        SERVER_URL + "/link",
        {
            didAddr: signInfo.userAddress!,
            info: {
                identifier,
                signedData,
                signedProof
            },
            requestSignature,
            requestProof: signInfo.userProof!
        },
        auth_header
    )

    assert.ok(response && response.data, 'Have a response')
    assert.equal(response.data.success, isSuccessful, 'Have a success response')
}

const callIsLinkedAPI = async (
    did: string,
    identifier: string,
    isLinked = true,
) => {
    const response = await server.post(
        SERVER_URL + "/isLinked",
        {
            did,
            identifier
        },
        auth_header
    )
    
    assert.ok(response && response.data, 'Have a response')
    assert.equal(response.data.success, true, 'Have a success response')
    assert.equal(response.data.data, isLinked, 'Linked')
}

const callLookupAPI = async(
    identifier: string,
    isSuccessful = true,
    did = ''
) => {
    const response = await server.post(
        SERVER_URL + "/lookup",
        {
            identifier
        },
        auth_header
    )
    
    assert.ok(response && response.data, 'Have a response')
    assert.equal(response.data.success, isSuccessful, 'Have a success response')    
    if (isSuccessful) {
        assert.equal(response.data.data, did, 'Get correct did')
    }
}

const callGetLinksAPI = async(
    did: string,
    isSuccessful = true,
    expectedResult : string[] = []
) => {
    const response = await server.post(
        SERVER_URL + "/getLinks",
        {
            did
        },
        auth_header
    )
    
    assert.ok(response && response.data, 'Have a response')
    assert.equal(response.data.success, isSuccessful, 'Have a success response')    
    if (isSuccessful) {
        assert.deepEqual(response.data.data, expectedResult, 'Get links correctly')
    }
}

const callUnlinkAPI = async(
    didAddr: string,
    identifier: string,
    isSuccessful = true,
) => {
    const requestSignature = await getUnlinkRequestSignature(didAddr, identifier)
    const response = await server.post(
        SERVER_URL + "/unlink",
        {
            didAddr,
            identifier,
            requestSignature,
            requestProof: signInfo.userProof!
        },
        auth_header
    )
    
    assert.ok(response && response.data, 'Have a response')
    assert.equal(response.data.success, isSuccessful, 'Have a success response')
}


describe("DIDLinkage Tests", () => {
    const eip155Signer = Wallet.createRandom()
    const identifiers = [
        'facebook|872cen0247c09247',
        // `blockchain:eip155|${eip155Signer.address.toLowerCase()}`
    ]

    const unlinkedIdentifier = 'facebook|1111'


    before(async () => {
        signInfo = await generateProof()
        // console.log("SignInfo : ", signInfo)
        server = await getAxios()
    })

    describe("Link", () => {

        const getSelfSignedData = (didAddr: string, signWallet : Wallet) => {
            const contextSigner = Wallet.createRandom()
            
            const did = `did:vda:${didAddr}`.toLowerCase()
            const identifier = `blockchain:eip155|${signWallet.address.toLowerCase()}`
            const msg = `${did}|${identifier}`

            let privateKeyArray = new Uint8Array(
                Buffer.from(contextSigner.privateKey.slice(2), "hex")
              );
            const signedData = EncryptionUtils.signData(msg, privateKeyArray)

            const proofMsg = `${signWallet.address}${contextSigner.address}`.toLowerCase()
            privateKeyArray = new Uint8Array(
                Buffer.from(signWallet.privateKey.slice(2), "hex")
            )
            const signedProof = EncryptionUtils.signData(proofMsg, privateKeyArray)

            return {identifier, signedData, signedProof}
        }

        const getTrustedSignedData = async (didAddr : string, identifier: string) => {
            const did = `did:vda:${didAddr}`.toLowerCase()
            const msg = `${did}|${identifier}`

            const signedData = await signInfo.signKeyring.sign(msg)
            return {signedData, signedProof: signInfo.signerProof!}
        }

        it("Should reject for invalid identifier types", async() => {
            const invalidIdentifiers = [
                'facebook|ab345|df15',  // Double `|` symbols
                'facebook',             // No `|` symbol
                'facebook|',            // No identifier
                '|facebook',            // No identifier type
                'telegram|25fg57',      // Unregistered identifier type
            ]

            for (const identifier of invalidIdentifiers) {
                const response = await server.post(
                    SERVER_URL + "/link",
                    {
                        didAddr: signInfo.userAddress!,
                        info: {
                            identifier,
                            signedData: '0x12',
                            signedProof: '0x12'
                        },
                        requestSignature: '0x13',
                        requestProof: '0x13'
                    },
                    auth_header
                )
            
                assert.ok(response && response.data, 'Have a response')
                assert.equal(response.data.success, false, 'Rejected')
            }
        })

        it("Success for 'Trusted' signer type", async () => {
            const identifier = identifiers[0]
            const { signedData, signedProof } = await getTrustedSignedData(signInfo.userAddress, identifier)
            
            await callLinkAPI(identifier, signedData, signedProof, true)
        })

        // Faild - To-do
        it("Success for `Self` signer type", async () => {
            const {identifier, signedData, signedProof} = getSelfSignedData(signInfo.userAddress, eip155Signer)
            await callLinkAPI(identifier, signedData, signedProof, true)
        })

        it("Should reject for already linked identifier", async () => {
            const identifier = identifiers[0]
            const { signedData, signedProof } = await getTrustedSignedData(signInfo.userAddress, identifier)
            
            await callLinkAPI(identifier, signedData, signedProof, false)
        })
    })

    describe("isLinked", () => {
        it("true for linked identifier & did pairs", async () => {
            const did = `did:vda:${signInfo.userAddress.toLowerCase()}`
            for(const identifier of identifiers) {
                await callIsLinkedAPI(did, identifier, true)
            }
        })

        it("false for unlinked identifier & did pairs",async () => {
            let did = `did:vda:${Wallet.createRandom().address.toLowerCase()}`
            await callIsLinkedAPI(did, identifiers[0], false)
            
            did = `did:vda:${signInfo.userAddress.toLowerCase()}`
            await callIsLinkedAPI(did, unlinkedIdentifier, false)
        })
    })

    describe("Lookup", () => {
        // Faild need to check again
        it("Should return controller for linked identifiers", async () => {
            const did = `did:vda:${signInfo.userAddress}`

            for(const identifier of identifiers) {
                await callLookupAPI(identifier, true, did)
            }
        })

        it("No controller for unlinked identifiers", async () => {
            await callLookupAPI(unlinkedIdentifier, true, '')
        })
    })

    describe("getLinks", () => {
        it("Should return identifier list of linked did", async () => {
            const did = `did:vda:${signInfo.userAddress.toLowerCase()}`
            await callGetLinksAPI(did, true, identifiers)
        })

        it("Should return empty array for unlinked did", async () => {
            const did = `did:vda:${Wallet.createRandom().address.toLowerCase()}`
            await callGetLinksAPI(did, true, [])
        })
    })

    describe("Unlink", () => {
        // Need test
        it("Should reject for unlinked pairs", async () => {
            const response = await server.post(
                SERVER_URL + "/unlink",
                {
                    didAddr: signInfo.userAddress,
                    identifier: unlinkedIdentifier,
                    requestSignature: "0x12",
                    requestProof: "0x12"
                },
                auth_header
            )
            
            assert.ok(response && response.data, 'Have a response')
            assert.equal(response.data.success, false, 'Trasaction failed')
        })

        // Need test
        it("Successfully unlink", async () => {
            const did = `did:vda:${signInfo.userAddress}`
            for (const identifier of identifiers) {
                await callUnlinkAPI(signInfo.userAddress, identifier, true)
            }
        })
    })
})