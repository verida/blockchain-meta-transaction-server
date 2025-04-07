import { Request, Response } from 'express'
import { getCurrentNet, getMaticFee } from './helpers'

import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet'
import { BigNumber } from 'ethers';

import {
     CONTRACT_ABI, 
     getContractInfoForBlockchainAnchor, 
     getDefaultRpcUrl
    } from "@verida/vda-common"
import Config from './config'
import { TContractNames } from '@verida/types';

require('dotenv').config()

/** Verida company wallet accoutn that pays for gass fees */
const privateKey = process.env.PRIVATE_KEY;

const targetNet = getCurrentNet();
// Force an RPC URL if it is specified in the environment variables
const rpcURL = process.env.RPC_URL ? process.env.RPC_URL : getDefaultRpcUrl(targetNet);

const provider = new JsonRpcProvider(rpcURL);
const txSigner = new Wallet(privateKey, provider)

const eip1559gasStationUrl = process.env.eip1559gasStationUrl ? process.env.eip1559gasStationUrl : undefined
const eip1559Mode = process.env.eip1559Mode ? process.env.eip1559Mode : undefined
const gasLimit = process.env.gasLimit ? process.env.gasLimit : undefined

/**
 * Class that process incoming http requests
 */
export default class GenericController {
    /**
     * Parse parameters from http request body and convert them affordable to smart contract
     * @param contractName - Contract name
     * @param req - HTTP request
     * @param abiMethod - method info extracted from contract abi file
     * @returns 
     */
    private static parseParams(contractName:TContractNames, req:Request, abiMethod:any) : any | never {
        // Loop through all the parameters and convert to the correct type
        const finalParams :  any[]= [];
        try {
            let paramIndex = 1;
            abiMethod.inputs.forEach((param: any) => {
                // console.log(param)
                let paramData : any
                switch (param.type) {
                    // @todo: convert types from string to correct type
                    // case 'address':{
                    //     break;
                    // }
                    // case 'bytes32':{
                    //     break;
                    // }
                    // case 'tuple[]':{
                    //     paramData = JSON.parse(req.body[param.name]);
                    //     break;                    
                    // }
                    default: {
                        paramData = req.body[param.name]
                        break;
                    }
                        
                }
                if (param.name === '') {
                    paramData = req.body['param_' + paramIndex]
                    paramIndex++;
                }
                // finalParams.push(Config.customParams(contractName, param.name, paramData))
                finalParams.push(paramData)
            })
        } catch(e: any) {
            console.error(e)
            throw e
        }
        return finalParams
    }

    /**
     * Perform smart contract interaction
     * @param abi - Contract abi file
     * @param address - Contract address deployed on blockchain
     * @param abiMethod - Method abi extracted from contract abi file
     * @param finalParams - Parameters that are converted for smart contract interaction
     * @returns - Transaction response that contains transaction hash
     */
    private static async callContractFunction(abi: any, address: string, abiMethod: any, finalParams: any) {
        console.info(`callContractFunction(${abiMethod})`)
        
        const contract = new Contract(address, abi.abi, txSigner);

        let ret;
        
        try {
            if (abiMethod.stateMutability === 'view') {
                // View Function
                ret = await contract.callStatic[abiMethod.name](...finalParams)
            } 
            else {
                // Make transaction
                if (eip1559gasStationUrl && eip1559Mode) {
                    const gasConfig = await getMaticFee(eip1559gasStationUrl, eip1559Mode);
                    finalParams.push(gasConfig)
                }

                if (gasLimit) {
                    finalParams.gasLimit = gasLimit
                }

                const transaction = await contract.functions[abiMethod.name](...finalParams)                
                ret = await transaction.wait(1)
                // console.log(`Transaction`, transaction)
                // console.log(`Receipt`, ret)
            }
        } catch(e: any) {
            console.error(e)
            console.error('Contract Error! Here is the method and params:')
            console.error(abiMethod)
            console.error(finalParams)
            throw e
        }

        if (BigNumber.isBigNumber(ret))
            ret = ret.toNumber()

        return ret
    }

    /**
     * Accept http request and perform smart contract interaction by calling sub functions
     * @param {*} req - http request object
     * @param {*} res - http response object
     */
    public static async contract(req: Request, res: Response) {
        let { contract, method } = req.params
        let contractJson: any

        // @todo: try / catch to check if invalid contract specified
        try {
            contractJson = CONTRACT_ABI[contract as TContractNames];

            if (!contractJson) {
                throw new Error(`Unable to locate contract ABI (${contract})`)
            }
        } catch (e) {
            console.error('contract() error:')
            console.error(e)

            return res.status(400).send({
                success: false,
                error: `Invalid contract (${contract})`
            })
        }

        // console.log("GenericController", "Valid")

        // Find method in contract
        const abi = contractJson.abi
        let abiMethod: any = false
        abi.forEach((item: any) => {
            if (item.type == 'function' && item.name == method) {
                abiMethod = item
                return;
            }
        });

        if (!abiMethod) {
            return res.status(400).send({
                success: false,
                error: 'Method not found on contract'
            })
        }

        if (abiMethod.stateMutability !== 'view') {
            // Check RequestValidity if calling function is not View type.
            // console.log("Checking request validity");
            
            const isValid = await Config.isRequestValid(contract as TContractNames, req)
            if (!isValid) {
                return res.status(400).send({
                    // status: "fail",
                    success: false,
                    error: 'Permission denied for this request'
                })
            }
        }
        
        // console.log("Found abiMethod definition", abiMethod)

        let finalParams : any
        try {
            finalParams = GenericController.parseParams(
                contract as TContractNames,
                req, 
                abiMethod
            )
        } catch (e) {
            // console.log("***ParseParam Failed", e)
            return res.status(200).send({
                success: false,
                error: 'Invalid Parameters'
            })
        }
        // console.log("Params: ", finalParams)

        // @todo: actually call the smart contract
        // const address = config.getContractAddress()
        const address = getContractInfoForBlockchainAnchor(targetNet, contract as TContractNames).address;

        let ret;
        try {
            ret = await GenericController.callContractFunction(contractJson, address, abiMethod, finalParams)
        } catch(e) {
            let reason = e.reason ? e.reason : 'Unknown'
            reason = e.error && e.error.reason ? e.error.reason : reason
            reason = reason.replace('execution reverted: ','')

            console.error(`Failed transaction: ${e.message} (${reason})`)

            return res.status(200).send({
                success: false,
                message: e.message,
                error: e.toString(),
                reason
            })
        }

        return res.status(200).send({
            success: true,
            data: ret // finalParams
        })
    }

}