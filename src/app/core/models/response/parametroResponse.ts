import { PrincipioAgroecologicoResponse } from "./principioAgroecologicoResponse";

export class ParametroResponse {

    id!: number; 
    nombre!: string;
    situacionEsperable!: string;
    principioAgroecologico!: PrincipioAgroecologicoResponse;
    habilitado!: boolean;

    constructor() {}
}