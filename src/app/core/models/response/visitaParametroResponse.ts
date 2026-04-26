import { ParametroResponse } from "./parametroResponse";

export class VisitaParametroResponse {


     id!: number;
     parametro!: ParametroResponse;
     nombre!: string;
     cumple!: boolean;
     comentarios!: string;
     aspiracionesFamiliares!: string;
     sugerencias!: string;

     constructor() {
        
     }

}

