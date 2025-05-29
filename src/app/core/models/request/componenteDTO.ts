export class ComponenteDTO {

    "product->parent_product_uuid"!: string;
    "product->child_product_uuid": string;
    quantity!: number;
    order!: number;
    supplier_uuid!: string;
    with: string[] = [];
    actual_role!: string;

    constructor() {

    }
}