import { ImagenResponse } from "./imagenResponse";
import { QuintaResponse } from "./quintaResponse";
import { UsuarioResponse } from "./usuarioResponse";
import { VisitaParametroResponse } from "./visitaParametroResponse";

export class VisitaResponse {

    id!: number;
    fechaActualizacion!: Date;
    fechaCreacion!: Date;
    fechaVisita!: string;
	quintaResponse!: QuintaResponse;
    usuarioOperacion!: string;
    integrantes: UsuarioResponse [] =[];
    visitaParametrosResponse: VisitaParametroResponse [] = [];
    imagenes!: ImagenResponse [];
    comentarios!: string;
    estadoVisita!: string;

    constructor() {
        
    }
}