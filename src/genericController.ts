import { Console } from 'console';
import { Request, Response } from 'express'
import Web3 from 'web3'

import { getCurrentNet, getRPCURLofNet } from './helpers'

require('dotenv').config()

const log4js = require("log4js")
const logger = log4js.getLogger()
logger.level = "debug";

const targetNet = getCurrentNet();
const rpcURL = getRPCURLofNet(targetNet);

/** Web3 object that will perform contract interaction */
const web3 = new Web3(rpcURL)
/** Verida company wallet accoutn that pays for gass fees */
const privateKey = process.env.PRIVATE_KEY;
const { address: admin } = web3.eth.accounts.wallet.add(privateKey)

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
        const finalParams = {} as any
        try {
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
                finalParams[param.name as string] = fnConfig(param.name, paramData)
            })
        } catch(e) {
            console.log("Parsing Error", e)
            throw new Error()
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
        const controller = new web3.eth.Contract(abi, address)

        let ret;

        if (abiMethod.stateMutability === 'view') {
            // View Function
            // console.log("values = ", ...(Object.values(finalParams)))
            ret = await eval(`controller.methods.${abiMethod.name}(...(Object.values(finalParams))).call()`)
        } 
        else {
            // Make transaction
            try {
                const tx = eval(`controller.methods.${abiMethod.name}(...(Object.values(finalParams)))`)

                // console.log("Sending Params: ", finalParams)

                // const [gasPrice, gasCost] = await Promise.all([web3.eth.getGasPrice(), tx.estimateGas({ from: admin })])
                const gasPrice = await web3.eth.getGasPrice()
                let gasCost = await tx.estimateGas({ from: admin })
                gasCost += 100

                // const gasPrice = 10000000000
                // const gasCost = 100000

                const data = tx.encodeABI()

                const txData = {
                    from: admin,
                    to: controller.options.address,
                    data,
                    gas: gasCost,
                    gasPrice,
                }

                ret = await web3.eth.sendTransaction(txData)
            } catch(e) {
                console.log("Failed Transaction: ", e.toString())
                throw e
            }
        }
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
            return res.status(400).send({
                // status: "fail",
                success: false,
                data: {
                    message: 'Invalid contract'
                }
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
                data: {
                    message: 'Method not found on contract'
                }
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
                    data: {
                        message: 'Permission denied for this request'
                    }
                })
            }
        }
        
        // console.log("Found abiMethod definition", abiMethod)

        let finalParams : any
        try {
            finalParams = GenericController.parseParams(req, abiMethod, config.customParams)
        } catch (e) {
            console.log("***ParseParam Failed", e)
            return res.status(200).send({
                success: false,
                data: {
                    message: 'Invalid Parameters'
                } 
            })
        }
        // console.log("Params: ", finalParams)

        // @todo: actually call the smart contract
        const address = config.getContractAddress()

        let ret;
        try {
            ret = await GenericController.callContractFunction(abi, address, abiMethod, finalParams)
        } catch(e) {
            // console.log("Failed Transaction - : ", e)
            return res.status(200).send({
                success: false,
                data: {
                    message: e.toString()
                }
            })
        }
``
        return res.status(200).send({
            success: true,
            data: ret // finalParams
        })
    }

}