export class ProduccionDTO {

    product_uuid!: string;
    quantity!: string;
    "user->responsible_uuid": string;
    production_datetime!: string;
    with: string[] = [];
    actual_role!: string;

    constructor() {

    }

}
