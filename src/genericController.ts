import { Console } from 'console';
import { Request, Response } from 'express'
const fs = require('fs')

const log4js = require("log4js")
const logger = log4js.getLogger()
logger.level = "debug";

export default class GenericController {

    /**
     * 
     * @param {*} req 
     * @param {*} res 
     */
    public static async contract(req: Request, res: Response) {
        const { contract, method } = req.params
        const contractData = req.body

        // @todo: try / catch to check if invalid contract specified
        const contractJson = require(`./contracts/${contract}/abi.json`)

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
                status: "fail",
                data: {
                    message: 'Method not found on contract'
                }
            })
        }

        console.log("Found abiMethod definition", abiMethod)
        console.log(req.body)

        // Loop through all the parameters and convert to the correct type
        const finalParams: any = {}
        abiMethod.inputs.forEach((param: any) => {
            console.log(param)
            switch (param.type) {
                // @todo: convert types from string to correct type
                case 'address':
                case 'bytes32':
                default:
                    finalParams[param.name] = req.body[param.name]
            }
        })

        // @todo: actually call the smart contract

        // Just return the final params to show what is happening
        return res.status(200).send({
            status: "success",
            data: finalParams
        })
    }

}