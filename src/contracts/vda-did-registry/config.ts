
export default class Config {


    customParams(paramName, paramData) {
        switch (paramName) {
            case 'bulkAdd':
                // @todo, custom stuff for bulk Add that changes paramData
        }

        return paramData
    }

    aysnc isRequestValid(req) {
        // @todo: validate the request (ie: authentication, valid user-agent etc.)

        return true
    }

}