export class AuthResponse {

    success!: string;
    message!: string;
    data: any;
    token!: string;
    meta?: any;

    constructor() {
        
    }
}