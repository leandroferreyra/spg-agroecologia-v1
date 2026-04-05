import { ImagenResponse } from "./imagenResponse";

export class QuintaResponse {

    id!: number;
	organizacion!: string;
	direccion!: string;
	nombreProductor!: string;
	superficieTotalInvernaculo!: number;
	superficieTotalCampo!: number;
	superficieAgroecologiaInvernaculo!: number;
	superficieAgroecologiaCampo!: number;
	comentarios!: string;
	imagenes!: ImagenResponse [];
	selloGarantia!: string;
	fechaUltimaVisita!: Date;

    constructor() {}
}