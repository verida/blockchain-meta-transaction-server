
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
        return "0xC2F8162C8911218D8d052024e36a2a4Af0F3d7d9"
    }

}