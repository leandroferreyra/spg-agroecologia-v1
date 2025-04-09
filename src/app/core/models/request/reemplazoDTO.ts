export class ReemplazoDTO {

    product_uuid!: string;
    "product->replacement_uuid": string;
    with: string[] = [];
    actual_role!: string;

    constructor() {

    }
}