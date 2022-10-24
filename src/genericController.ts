import { Console } from 'console';
import { Request, Response } from 'express'
import { getCurrentNet, getRPCURLofNet } from './helpers'

import { ContractFactory } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet'
import { BigNumber } from 'ethers';

require('dotenv').config()

/**
 * Configure logging
 */
const appenders = require('@barchart/log4js-node-appenders');
const log4js = require("log4js")

if (process.env.LOG_LAMBDA) {
    log4js.configure({
        categories: {
            default: { appenders: [ 'lambda' ], level: 'trace' }
        },
        appenders: {
            lambda: {
                type: appenders.lambda,
                layout: {
                    type: 'pattern',
                    pattern: '%c - %m%'
                }
            }
        }
    });
}

const logger = log4js.getLogger()
logger.level = process.env.LOG_LEVEL;

/** Verida company wallet accoutn that pays for gass fees */
const privateKey = process.env.PRIVATE_KEY;

const targetNet = getCurrentNet();
const rpcURL = getRPCURLofNet(targetNet);

const provider = new JsonRpcProvider(rpcURL);
const txSigner = new Wallet(privateKey, provider)

/** Function parameter type. Defined in config.ts file for each smart contract */
type fnParameterConfig = (paramName: any, paramData: any) => any

/**
 * Class that process incoming http requests
 */
export default class GenericController {
    /**
     * Parse parameters from http request body and convert them affordable to smart contract
     * @param req - HTTP request
     * @param abiMethod - method infor extracted from contract abi file
     * @param fnConfig - Function parameter that adjust request parameters affordable to smart contract
     * @returns 
     */
    private static parseParams(req:Request, abiMethod:any, fnConfig: fnParameterConfig) : any | never {
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
                // finalParams.push(fnConfig(param.name, paramData))
                finalParams.push(paramData)
            })
        } catch(e: any) {
            logger.error(e.getMessage())
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
        logger.trace(`callContractFunction(${abiMethod})`)

        const contract = ContractFactory.fromSolidity(abi)
            .attach(address)
            .connect(provider)
            .connect(txSigner)
        let ret;
        
        try {
            if (abiMethod.stateMutability === 'view') {
                // View Function
                ret = await contract.callStatic[abiMethod.name](...finalParams)
            } 
            else {
                // Make transaction
                const transaction = await contract.functions[abiMethod.name](...finalParams)
                
                ret = await transaction.wait(1)
                logger.debug(`Transaction`, transaction)
                logger.debug(`Receipt`, ret)
            }
        } catch(e: any) {
            logger.error(e.getMessage())
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
        const { contract, method } = req.params
        let contractJson: any
        let config: any

        // @todo: try / catch to check if invalid contract specified
        try {
            contractJson = require(`./contracts/${contract}/abi.json`)
            // const config = require(`./contracts/${contract}/config`)
            config = (await import(`./contracts/${contract}/config`)).default
            // console.log("GenericController config = ", config)
        } catch (e) {
            logger.error('contract()', e.getMessage())

            return res.status(400).send({
                success: false,
                error: 'Invalid contract'
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
            
            const isValid = await config.isRequestValid(req)
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
            finalParams = GenericController.parseParams(req, abiMethod, config.customParams)
        } catch (e) {
            // console.log("***ParseParam Failed", e)
            return res.status(200).send({
                success: false,
                error: 'Invalid Parameters'
            })
        }
        // console.log("Params: ", finalParams)

        // @todo: actually call the smart contract
        const address = config.getContractAddress()

        let ret;
        try {
            ret = await GenericController.callContractFunction(contractJson, address, abiMethod, finalParams)
        } catch(e) {
            logger.error(`Failed transaction: ${e.getMessage()}`)

            return res.status(200).send({
                success: false,
                error: e.toString()
            })
        }
``
        return res.status(200).send({
            success: true,
            data: ret // finalParams
        })
    }

}