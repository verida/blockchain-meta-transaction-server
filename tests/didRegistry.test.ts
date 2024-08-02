const assert = require("assert")

import { ethers, Wallet } from 'ethers'
import {
    dids,
    getVeridaSignWithNonce, 
} from './utils'
import { AUTH_HEADER, getAxios, getServerURL } from './serverConfig'

const SERVER_URL = getServerURL("didRegistry")

let server

const getNonce = async (did: string) => {
    const response: any = await server.post(
        SERVER_URL + "/nonce", 
        {
            didAddress: did,
        }, 
        AUTH_HEADER                        
    )

    if (!response.data.success) {
        return ''
    }
    return response.data.data
}

const getRegisterSignature = async(did : string, endpoints: string[], signKey: string) => {
    let rawMsg = ethers.utils.solidityPack(
        ['address', 'string'],
        [did, '/']
    );
    
    for (let i = 0; i < endpoints.length; i++) {
        rawMsg = ethers.utils.solidityPack(
        ['bytes', 'string', 'string'],
        [rawMsg, endpoints[i], '/']
        );
    }
    return await getVeridaSignWithNonce(rawMsg, signKey, await getNonce(did));
}
    
const getControllerSignature = async(did: string, controller: string, signKey: string) => {
    const rawMsg = ethers.utils.solidityPack(
        ['address', 'string', 'address', 'string'],
        [did, '/setController/', controller, "/"]
    )
    return await getVeridaSignWithNonce(rawMsg, signKey, await getNonce(did));
}
    
const getRevokeSignature = async(did: string, signKey: string) => {
    const rawMsg = ethers.utils.solidityPack(
        ['address', 'string'],
        [did, '/revoke/']
    )
    return  await getVeridaSignWithNonce(rawMsg, signKey, await getNonce(did));
}

// Datas for test
const did = dids[0];
const badSigner = Wallet.createRandom();

const endPoints_A = [
    'https://A_1',
    'https://A_2',
    'https://A_3'
]
  
const endPoints_B = [
    'https://B_1',
    'https://B_2'
]

const endPoints_Empty : string[] = []


// Call APIs & Check result
const callRegisterAPI = async (did: string, endpoints: string[], signKey: string, isSuccessful: boolean) => {
    const signature = await getRegisterSignature(did, endpoints, signKey);
    const response: any = await server.post(
        SERVER_URL + "/register",
        {
            didAddress: did,
            endpoints: endpoints,
            signature
        },
        AUTH_HEADER
    );

    // return response;

    // console.log("Response", response)
    assert.ok(response && response.data, 'Have a response')
    assert.equal(response.data.success, isSuccessful, 'Have a success response')
}

const callRevokeAPI = async (did: string, signKey: string, isSuccessful: boolean) => {
    const signature = await getRevokeSignature(did, signKey);
    const response: any = await server.post(
        SERVER_URL + "/revoke",
        {
            didAddress: did,
            signature
        },
        AUTH_HEADER
    );

    // return response;

    // console.log("Response", response)
    assert.ok(response && response.data, 'Have a response')
    assert.equal(response.data.success, isSuccessful, 'Have a success response')
}

const callGetControllerAPI = async (did: string, isSuccessful: boolean, controller: string = '') => {
    const response: any = await server.post(
        SERVER_URL + "/getController",
        {
            didAddress: did,
        },
        AUTH_HEADER
    );

    // console.log("Response", response)
    assert.ok(response && response.data, 'Have a response')
    assert.equal(response.data.success, isSuccessful, 'Have a success response')
    if (isSuccessful) {
        assert.equal(response.data.data, controller, 'Get correct controller')
    }
}

const callSetControllerAPI = async (did: string, controller: string, signKey: string, isSuccessful: boolean) => {
    const signature = await getControllerSignature(did, controller, signKey);
    const response: any = await server.post(
        SERVER_URL + "/setController",
        {
            didAddress: did,
            controller: controller,
            signature
        },
        AUTH_HEADER
    );

    // console.log("Response", response)
    assert.ok(response && response.data, 'Have a response')
    assert.equal(response.data.success, isSuccessful, 'Have a success response')
}


describe("DIDRegistry Test", function() {
    before(async () =>{
        this.timeout(100000)
        server = await getAxios("didRegistry")
    })

    describe("Register", () => {
        it("Failed for invalid signature", async () => {
            await callRegisterAPI(did.address, endPoints_A, badSigner.privateKey, false);
        })

        it("Success on register", async () => {
            await callRegisterAPI(did.address, endPoints_A, did.privateKey, true);
        })

        it("Success on already registered DID address", async () => {
            await callRegisterAPI(did.address, endPoints_A, did.privateKey, true);

            await callRegisterAPI(did.address, endPoints_B, did.privateKey, true);
        })

        it("Failed for revoked DID address", async () => {
            const tempDID = Wallet.createRandom()

            await callRegisterAPI(tempDID.address, endPoints_A, tempDID.privateKey, true)
            await callRevokeAPI(tempDID.address, tempDID.privateKey, true);

            await callRegisterAPI(tempDID.address, endPoints_A, tempDID.privateKey, false)
        })
    })

    describe("Lookup", () => {
        const callLookUpAPI = async (did: string, isSuccessful: boolean, result: string[] = []) => {
            const response: any = await server.post(
                SERVER_URL + "/lookup",
                {
                    didAddress: did,
                },
                AUTH_HEADER
            );
        
            
            assert.ok(response && response.data, 'Have a response')
            assert.equal(response.data.success, isSuccessful, 'Have a success response')

            if (isSuccessful) {
                assert.deepEqual(response.data.data[1], result, 'Get same endpoints registered')
            }
        }

        it("Get endpoints registered", async () => {
            await callRegisterAPI(did.address, endPoints_Empty, did.privateKey, true);
            await callLookUpAPI(did.address, true);

            await callRegisterAPI(did.address, endPoints_A, did.privateKey, true);
            await callLookUpAPI(did.address, true, endPoints_A);
        })

        it("Failed for unregistered DID address", async () => {
            const unregisteredDID = Wallet.createRandom();
            await callLookUpAPI(unregisteredDID.address, false);
        })

        it("Failed for revoked DIDs", async () => {
            const tempDID = Wallet.createRandom();
            // Register
            await callRegisterAPI(tempDID.address, endPoints_A, tempDID.privateKey, true);
            await callLookUpAPI(tempDID.address, true, endPoints_A);
            // Revoke
            await callRevokeAPI(tempDID.address, tempDID.privateKey, true);

            await callLookUpAPI(tempDID.address, false);
        })
    })

    describe("Get controller", () => {
        it("Get controller itself", async () => {
            await callGetControllerAPI(did.address, true, did.address)
        })
    })

    describe("Set controller", () => {
        const did = dids[1];
        const controller = dids[2];

        before(async () => {
            // Should register to set the controller
            await callRegisterAPI(did.address, endPoints_A, did.privateKey, true);
        })
        
        it("Failed : Unregistered DID address", async () => {
            const unregisteredDID = Wallet.createRandom();
            await callSetControllerAPI(
                unregisteredDID.address, 
                controller.address,
                unregisteredDID.privateKey,
                false 
            );
            
        })

        it("Failed : Invalid signature", async () => {
            const badSigner = Wallet.createRandom();
            await callSetControllerAPI(
                did.address,
                controller.address,
                badSigner.privateKey,
                false
            );
        })

        it("Success : Changed the controller", async () => {
            // Check original controller
            await callGetControllerAPI(did.address, true, did.address);

            // Change controller
            await callSetControllerAPI(
                did.address,
                controller.address,
                did.privateKey,
                true
            );
            // Check updated controller
            await callGetControllerAPI(did.address, true, controller.address)

            // Restore controller to original for further test
            await callSetControllerAPI(
                did.address,
                did.address,
                controller.privateKey,
                true
            );
            // Check for updates
            await callGetControllerAPI(did.address, true, did.address)
        })
    })

    describe("Revoke", () => {
        // Should test with random address. Because after revoked, it can't be registered again
        const did = Wallet.createRandom();
        const controller = Wallet.createRandom();

        before(async() => {
            await callRegisterAPI(did.address, endPoints_A, did.privateKey, true);
            // Change the controller of registered DID
            await callSetControllerAPI(did.address, controller.address, did.privateKey, true);
        })

        it("Failed : Unregistered DID address", async () => {
            const unregisteredDID = Wallet.createRandom();
            await callRevokeAPI(unregisteredDID.address, unregisteredDID.privateKey, false);
        })

        it("Failed : Invalid signature - bad signer", async () => {
            const badSigner = Wallet.createRandom();
            await callRevokeAPI(did.address, badSigner.privateKey, false);
        })

        it("Failed : Invalid signature - not a controller", async () => {
            await callRevokeAPI(did.address, did.privateKey, false);
        })

        it("Revoke successfully by correct controller", async () => {
            // Revoked with correct controller
            await callRevokeAPI(did.address, controller.privateKey, true);
        })

        it("Failed : Revoked DID", async () => {
            await callRevokeAPI(did.address, controller.privateKey, false);
        })
    })
});