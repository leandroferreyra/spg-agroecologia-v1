export class CompraDTO {

    qualification_option_uuid!: string;
    qualification_comments!: string;
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

    constructor() {

    }
}