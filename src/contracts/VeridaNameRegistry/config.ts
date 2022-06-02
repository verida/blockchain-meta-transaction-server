require('dotenv').config()

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

        console.log("Authennticating: ", req.headers);

        if (!(req.headers['user-agent'].includes('Verida-Vault'))) {
            console.log('No authentication info')
            return false
        }

        return true
    }

    public static getContractAddress() {
        return process.env.CONTRACT_ADDRESS_NameRegistry;
    }

}