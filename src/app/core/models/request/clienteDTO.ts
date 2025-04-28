export class ClienteDTO {

    vat_percent!: string;
    comments!: string;
    person!: Person;
    with: string[] = [];
    actual_role!: string;
    possible_person_state_uuid!: string;
    vat_condition_uuid!: string;
    constructor() {

    }
}

export class Person {
    street_name!: string;
    door_number!: string;
    address_detail!: string;
    city_uuid!: string;
    possible_person_state_uuid!: string;
    state_comments!: string;
    legal_entity!: LegalEntity;
    human!: Human
}

export class LegalEntity {
    company_name!: string;
    cuit!: string;
}

export class Human {
    document_type_uuid!: string;
    document_number!: string;
    cuit!: string;
    gender_uuid!: string;
    firstname!: string;
    lastname!: string;
}