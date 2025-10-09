export class VentaDTO {

    delivered_to!: string;
    delivery_date!: string;
    delivery_note!: string;
    transaction!: Transaction;
    actual_role!: string;
    with: string[] = [];

    constructor() {

    }
}

export class Transaction {
    transaction_datetime!: string;
    person_uuid!: string;
    vat_after_discount!: boolean;
    discount1!: string;
    discount2!: string;
    others!: string;
    perceptionIB!: string;
    perceptionRG3337!: string;
    possible_transaction_state_uuid!: string;
    currency_uuid!: string;
    exchange_rate!: number;

    constructor() {

    }
}