const assert = require("assert")

import { ethers, Wallet } from 'ethers'
import { generateProof, SignInfo } from './utils-keyring'

import { Keyring } from "@verida/keyring";
import { AUTH_HEADER, getAxios, getServerURL } from './serverConfig'

const SERVER_URL = getServerURL("SBT")

const getNonce = async (did: string) => {
    const response: any = await server.post(
        SERVER_URL + "/nonce", 
        {
            did,
        }, 
        AUTH_HEADER                        
    )
    // console.log("GetNonce Result : ", did, response.data)
    if (!response.data.success)
        return ''
    return response.data.data
}


let server
let signInfo : SignInfo

// Helper function
const getClaimSBTSignature = async (
    did: string,
    sbtType: string,
    uniqueId: string,
    sbtURI: string,
    recipient: string,

    userKeyring: Keyring,
    signData: string
) => {
    const nonce = await getNonce(did)

    const rawMsg = ethers.utils.solidityPack(
        ['address', 'string', 'address', 'bytes', 'bytes', 'uint'],
        [did, `${sbtType}${uniqueId}${sbtURI}`, recipient, signData, signInfo.signerProof!, nonce]
    );
    
    return await userKeyring.sign(rawMsg)
}

const callClaimSBTAPI = async (
    sbtType: string, 
    uniqueId: string,
    sbtURI: string,
    recipient: string,

    signedData: string,
    // signedProof: string,
    isSuccessful = true
) => {
    const requestSignature = await getClaimSBTSignature(
        signInfo.userAddress!,
        sbtType,
        uniqueId,
        sbtURI,
        recipient,
        signInfo.userKeyring,
        signedData
    )

    const response = await server.post(
        SERVER_URL + "/claimSBT",
        {
            did: signInfo.userAddress!,
            sbtInfo: {
                sbtType,
                uniqueId,
                sbtURI,
                recipient,
                signedData,
                signedProof: signInfo.signerProof!
            },
            requestSignature,
            requestProof: signInfo.userProof!
        },
        AUTH_HEADER
    )

    assert.ok(response && response.data, 'Have a response')
    assert.equal(response.data.success, isSuccessful, 'Have a success response')
}

const callTokenInfoAPI = async (
    tokenId: number,
    isSuccessful = true,
    expectedResult: string[] = []
) => {
    const response = await server.post(
        SERVER_URL + "/tokenInfo",
        {
            tokenId
        },
        AUTH_HEADER
    )

    assert.ok(response && response.data, 'Have a response')
    assert.equal(response.data.success, isSuccessful, 'Have a success response')
    if (isSuccessful) {
        assert.deepEqual(response.data.data, expectedResult, 'Correct token info')
    }
}

const callTotalSupply = async() => {
    const response = await server.post(
        SERVER_URL + "/totalSupply",
        {},
        AUTH_HEADER
    )

    assert.ok(response && response.data, 'Have a response')
    assert.equal(response.data.success, true, 'Have a success response')
    return response.data.data
}

const sbtTypes = [
    "twitter",
    "facebook",
    "discord"
]

const tokenURIs = [
    "https://gateway.pinata.cloud/ipfs/QmVrTkbrzNHRhmsh88XnwJo5gBu8WqQMFTkVB4KoVLxSEY/1.json",
    "https://gateway.pinata.cloud/ipfs/QmVrTkbrzNHRhmsh88XnwJo5gBu8WqQMFTkVB4KoVLxSEY/2.json",
    "https://gateway.pinata.cloud/ipfs/QmVrTkbrzNHRhmsh88XnwJo5gBu8WqQMFTkVB4KoVLxSEY/3.json",
]

// Verida Test Account
const claimer = '0x8f6473D72d4b51B7b6147F6C6C0CC3F833d96B7a'

describe("SBT Tests", () => {
    const uniqueId = "-testId" + Wallet.createRandom().address;
    const diffId = "-diffId" + Wallet.createRandom().address;
   
    before( async () => {
        server = await getAxios("SBT")
    })

    describe("Claim SBT", () => {
        const sbtType = sbtTypes[0];
        
        
        before(async () => {
            signInfo = await generateProof()
            // console.log("SignInfo : ", signInfo)
        })

        it("Claimed one SBT", async () => {
            // contract.addTrustedSigner(signInfo.signerAddress)

            const msg = `${sbtType}-${uniqueId}-${signInfo.userAddress.toLowerCase()}`
            const signedData = await signInfo.signKeyring.sign(msg)
            
            await callClaimSBTAPI(
                sbtType, 
                uniqueId, 
                tokenURIs[0],
                claimer,
                signedData,
                true
            )
        })

        it("Claimed same SBT type with different ID", async () => {
            
            const msg = `${sbtType}-${diffId}-${signInfo.userAddress.toLowerCase()}`
            const signedData = await signInfo.signKeyring.sign(msg)

            await callClaimSBTAPI(
                sbtType,
                diffId,
                tokenURIs[0],
                claimer,
                signedData,
                true
            )
        })
    })

    describe("Get tokenInfo from claimed token Id", () => {
        it("Should return SBT type & uniqueId for claimed tokenIDs",async () => {
            const requestedTokenInfo = [
                [ 'twitter', uniqueId ],
                [ 'twitter', diffId ]
            ]

            const totalSupply = parseInt(await callTotalSupply())
            const idList = [totalSupply - 1, totalSupply]

            for(let i = 0; i < idList.length; i++) {
                await callTokenInfoAPI(idList[i], true, requestedTokenInfo[i])
            }
        })

        it("Should reject for unclaimed token ID", async () => {
            await callTokenInfoAPI(1000, false)
        })
    })
})