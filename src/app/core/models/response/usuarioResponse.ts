import { PosicionResponse } from "./posicionResponse";
import { Rol } from "./rol";

export class UsuarioResponse {

    id!: number;
    nombre!: string;
    email!: string;
    organizacion!: string;
    estado!: boolean;
    celular!: string;
    posicionResponse!: PosicionResponse;
    roles: Rol[] = [];
    isAdmin!: boolean;

    constructor() {

    }
}