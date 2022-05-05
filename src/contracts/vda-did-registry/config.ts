
class Config {

    customParams(paramName: any, paramData: any): Promise<any> {
        // switch (paramName) {
        //     case 'bulkAdd':
        //         // @todo, custom stuff for bulk Add that changes paramData
        // }

        return paramData
    }

    async isRequestValid(req: any): Promise<boolean> {
        // @todo: validate the request (ie: authentication, valid user-agent etc.)

        return true
    }

}

export default new Config()