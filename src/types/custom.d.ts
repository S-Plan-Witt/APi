import {Permissions, User} from "../classes/user";

declare global {
    namespace Express {
        export interface Request {
            decoded: Decoded,
            user: User
        }

    }
    export interface Decoded {
        admin?: boolean,
        session: string,
        userType: string,
        username: string,
        permissions: Permissions
    }
    namespace winston {
        export interface Transports {
            DailyRotateFile: any
        }

    }
}




export interface Test {
    test: string
}