import { DIDClient } from "@verida/did-client"
import { AutoAccount } from "@verida/account-node";
import { Client } from "@verida/client-ts";
import { DIDClientConfig, Network } from "@verida/types";
import { Keyring } from "@verida/keyring";

// import { Wallet } from '@ethersproject/wallet'
import { Wallet } from "ethers"
import { JsonRpcProvider } from '@ethersproject/providers'

import dotenv from 'dotenv'
dotenv.config()

if (process.env.PRIVATE_KEY === undefined) {
    throw new Error('PRIVATE_KEY not defined in env')
}
const privateKey : string = process.env.PRIVATE_KEY!

const rpcUrl = process.env[`RPC_URL`]
if (rpcUrl === undefined) {
    throw new Error('RPC url is not defined in env')
}

const provider = new JsonRpcProvider(rpcUrl);
const txSigner = new Wallet(privateKey, provider);

const test_network = Network.BANKSIA;

export async function getDIDClient(veridaAccount: Wallet) {
    
    const config: DIDClientConfig = {
        network: test_network,
        rpcUrl
    }

    const didClient = new DIDClient(config)

    console.log("DIDClient created");

    // Configure authenticate to talk directly to the blockchain
    didClient.authenticate(
        veridaAccount.privateKey,
        'web3',
        {
            privateKey
        },
        [
            `https://node1-apse2.devnet.verida.tech/did/`,
            // `https://node1-apse2.devnet.verida.tech/did/`,
            `https://node3-apse2.devnet.verida.tech/did/`,
        ]
    )

    console.log("DIDClient authenticated");

    // Configure authenticate to use meta transaction server
    /*didClient.authenticate(
        veridaAccount.privateKey,
        'gasless',
        {
            veridaKey: veridaAccount.privateKey,
            serverConfig: {
                headers: {
                    'context-name' : 'Verida Test'
                } 
              },
              postConfig: {
                  headers: {
                      'user-agent': 'Verida-Vault'
                  }
              },
              endpointUrl: 'http://localhost:5021'
        }
    )*/

    return didClient
}

export async function initVerida(didwallet: Wallet, CONTEXT_NAME: string) {
    const account = new AutoAccount({
        privateKey: didwallet.privateKey,
        network: test_network,
        didClientConfig: {
            callType: 'web3',
            web3Config: {
                privateKey,
                rpcUrl
            }
        }
    })

    const client = new Client({
        network: test_network,
        didClientConfig: {
            network: test_network,
            rpcUrl
        }
    })

    // console.log("Connecting account...")
    await client.connect(account)

    // console.log("Opening context...")
    const context = await client.openContext(CONTEXT_NAME, true)

    return {
        didwallet,
        account,
        client,
        context,
        CONTEXT_NAME
    }
}

export interface SignInfo {
    signKeyring : Keyring
    signerAddress: string
    signerProof?: string
    userKeyring: Keyring
    userAddress: string
    userProof?:  string
}

export async function generateProof() : Promise<SignInfo> {
    // signWallet can't be created by Random for VDA-DID-Linkage test
    // In the VDA-DID-Linkage, should add trusted signer.
    const signWallet = Wallet.fromMnemonic('devote biology pass disorder fit cherry grace polar wrist trash regret frame')
    const signVerida = await initVerida(signWallet, 'Facebook: FB Signing Context')
    const signAccount = signVerida.account
    const signerDid = await signAccount.did()
    const SIGN_CONTEXT_NAME = signVerida.CONTEXT_NAME
    const signKeyring = await signAccount.keyring(SIGN_CONTEXT_NAME)

    // console.log("Signer: ", signWallet.address, " - ", signerDid)

    const userVerida = await initVerida(Wallet.createRandom(), 'Verida: Test DID User Context')
    
    const userWallet = userVerida.didwallet
    const userAccount = userVerida.account
    const userDid = await userAccount.did()
    const USER_CONTEXT_NAME = userVerida.CONTEXT_NAME
    const userKeyring = await userAccount.keyring(USER_CONTEXT_NAME)

    const didClient = await signAccount.getDIDClient()

    const signerDoc = await didClient.get(signerDid)
    const signerProof = signerDoc.locateContextProof(SIGN_CONTEXT_NAME, test_network)

    const userDoc = await didClient.get(userDid)
    const userProof = userDoc.locateContextProof(USER_CONTEXT_NAME, test_network)

    return {
        signKeyring,
        signerAddress: signWallet.address.toLowerCase(),
        signerProof,
        userKeyring,
        userAddress: userWallet.address.toLowerCase(),
        userProof,
    }
}