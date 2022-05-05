
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

        return true
    }

    public static getContractAddress() {
        return "0x2862BC860f55D389bFBd1A37477651bc1642A20B"
    }

}