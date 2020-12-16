import {User} from "../classes/User";
import {Permissions} from "../classes/Permissions";

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
        userId: number,
        jwtId: number,
        permissions: Permissions
    }

}