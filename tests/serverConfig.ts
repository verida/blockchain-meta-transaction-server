import { TContractNames } from '@verida/types';
import Axios from 'axios'
import dotenv from 'dotenv'
dotenv.config()

const PORT = process.env.SERVER_PORT ? process.env.SERVER_PORT : 5021;

export const AUTH_HEADER = {
    headers: {
        'user-agent': 'Verida-Vault'
    }
}

export function getServerURL(contractName: TContractNames, isDebug = true) {
    if (isDebug) {
        return `http://localhost:${PORT}/${contractName}`
    } else {
        return `https://meta-tx-server1.tn.verida.tech/${contractName}`
    }
}


export const getAxios = async (contractName : TContractNames) => {
    const SENDER_CONTEXT = `Verida Test: Meta-Transaction-Server (${contractName})`

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

