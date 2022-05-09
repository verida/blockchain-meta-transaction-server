
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
        return "0x1e48398CB21E4C228De595859598cdE12D1A0435"
    }

}