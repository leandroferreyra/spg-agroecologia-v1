
export class QuintaDTO {

	organizacion!: string;
	direccion!: string;
	nombreProductor!: string;
	superficieTotalInvernaculo!: number;
	superficieTotalCampo!: number;
	superficieAgroecologiaInvernaculo!: number;
	superficieAgroecologiaCampo!: number;
	comentarios!: string;
    usuarioOperacion!: string;
	file!: FormData;
	selloGarantia!: string;

    constructor() {
    }
}