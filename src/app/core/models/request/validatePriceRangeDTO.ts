export class ValidatePriceRangeDTO {

    transaction_uuid!: string;
    product_uuid!: string;
    unit_price!: number;
    actual_role!: string;

    constructor() {

    }
}