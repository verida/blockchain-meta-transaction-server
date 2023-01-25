import { BytesLike } from 'ethers';
import {stringToBytes32, getCurrentNet} from '../../helpers'

require('dotenv').config()

/** Interface representing parameters to add/revoke delegates operations */
interface DelegateParamType {
    /** delegate type */
    delegateType: string
}

/** Interface representing parameters to add/revoke attributes operation */
interface AttributeParamType {
    /** name of attribute */
    name: string;
    /** string value of attribute */
    value: string;
}

/** Class representing configuration for VeridaDIDRegistry smart contract */
export default class Config {
    /**
     * Parse parameters from http request and adjust before interacting with smart contract
     * @param paramName - parameter name in HTTP POST body
     * @param paramData - parameter value in HTTP POST body
     * @returns adjusted parameter value
     */
    public static customParams(paramName: any, paramData: any) {
        /*
        switch(paramName) {
            case 'delegateType':
                paramData = stringToBytes32(paramData as string)
                break;
            case 'name': //Attribute name
                paramData = paramData.startsWith('0x') ? paramData : stringToBytes32(paramData)
            case 'value': //Attribute value
                paramData = paramData.startsWith('0x') ? paramData : '0x' + Buffer.from(paramData, 'utf-8').toString('hex')
                break;
            case 'delegateParams':
                paramData = paramData.map((item: DelegateParamType) => ({
                    ...item,
                    delegateType: stringToBytes32(item.delegateType)
                }))
                break;
            case 'attributeParams':
                paramData = paramData.map((item: AttributeParamType) => ({
                    ...item,
                    name: item.name.startsWith('0x') ? item.name : stringToBytes32(item.name),
                    value: item.value.startsWith('0x') ? item.value : '0x' + Buffer.from(item.value, 'utf-8').toString('hex')
                }))
                break;
        }*/

        // console.log('---------------')
        // console.log(paramName)
        // console.log(paramData)
        // console.log('---------------')

        return paramData
    }

    /**
     * Check out validity of http request
     * @param req - requested body of incoming http request.
     * @returns {boolean} validity of request
     */
    public static async isRequestValid(req: any) {
        // @todo: validate the request (ie: authentication, valid user-agent etc.)

        // console.log("Authenticating: ", req.headers);

        if (!(req.headers['user-agent'].includes('Verida-Vault'))) {
            console.log('No authentication info')
            return false
        }

        return true
    }
}