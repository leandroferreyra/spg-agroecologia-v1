export class PagoDTO {

    transaction_uuid!: string;
    payment_datetime!: string;
    payment_method!: string;
    amount!: number;
    detail!: string;
    currency_uuid!: string;
    exchange_rate!: number;
    actual_role!: string;
    with: string[] = [];

    constructor() {

    }
}
