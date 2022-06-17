require('dotenv').config()
import {getCurrentNet} from '../../helpers'

export default class Config {

    public static customParams(paramName: any, paramData: any) {
        // switch (paramName) {
        //     case 'bulkAdd':
        //         // @todo, custom stuff for bulk Add that changes paramData
        // }

        return paramData
    }

    public static async isRequestValid(req: any) {
        // @todo: validate the request (ie: authentication, valid user-agent etc.)

        // console.log("Authenticating: ", req.headers);

        if (!(req.headers['user-agent'].includes('Verida-Vault'))) {
            console.log('No authentication info')
            return false
        }

        return true
    }

    public static getContractAddress() {
        const netName = getCurrentNet();
        const address = process.env[`CONTRACT_ADDRESS_${netName}_NameRegistry`];
        if (address == undefined) {
            throw new Error("No contract address in .env file.")
        }
        return address;
    }

}