import { BytesLike } from 'ethers';
import {stringToBytes32} from '../../helpers'
interface DelegateParamType {
    delegateType: string
}
interface AttributeParamType {
    name: string;
    value: string;
}
// type DelegateParam = {
//     delegateType: BytesLike;
//     delegate: string;
//     validity?: BigNumberish;
//   };
export default class Config {
    public static customParams(paramName: any, paramData: any) {
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
        }

        // console.log('---------------')
        // console.log(paramName)
        // console.log(paramData)
        // console.log('---------------')

        return paramData
    }

    public static async isRequestValid(req: any) {
        // @todo: validate the request (ie: authentication, valid user-agent etc.)

        console.log("Authennticating: ", req.headers);

        if (!(req.headers['user-agent'].includes('Verida-Vault'))) {
            console.log('No authentication info')
            return false
        }

        return true
    }

    public static getContractAddress() {
        return "0x2862BC860f55D389bFBd1A37477651bc1642A20B"
    }

}