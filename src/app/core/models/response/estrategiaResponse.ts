import { PrincipioResponse } from "./principioResponse";

export class EstrategiaResponse {

    id!: number; 
    nombre!: string;
    situacionEsperable!: string;
    principioAgroecologico!: PrincipioResponse;
    habilitado!: boolean;

    constructor() {}
}