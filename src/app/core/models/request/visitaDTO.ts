import { VisitaParametroDTO } from "./visitaParametroDTO";

export class VisitaDTO {

    quintaId!: number;
    usuarioOperacion!: string;
    fechaVisita!: string;
    parametros: VisitaParametroDTO[] = [];
    integrantes!: string;
    comentarios!: string;

    constructor() {

    }
}