
export class Token {


    token: string;
    usuario: string;
    authorities: string [] = [];

    constructor(res: any) {
        this.token = res.token;
        this.usuario = res.usuario;
        this.authorities = res.authorities
    }


}