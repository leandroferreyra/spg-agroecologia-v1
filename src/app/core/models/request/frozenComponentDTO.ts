export class FrozenComponentDTO {

    origin!: string;
    stock_uuid!: string | null;
    supplier_uuid!: string | null;
    product_instances?: string[] | null;
    note!: string;
    with: string[] = [];
    actual_role!: string;

    constructor() {

    }
}