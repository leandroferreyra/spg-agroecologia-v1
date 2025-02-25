export class ProveedorDTO {
    batch_prefix!: string;
    vat_percent!: string;
    withholding!: string;
    perception!: string;
    comments!: string;
    person!: Person;
    with: string[] = [];
    actual_role!: string;
    constructor() {

    }
}

export interface Person {
    street_name: string;
    door_number: string;
    address_detail: string;
    city_uuid: string;
    legal_entity: LegalEntity;
    human: Human
}

export interface LegalEntity {
    company_name: string;
    cuit: string;
}

export interface Human {
    document_number: string;
    cuit: string;
    gender_uuid: string;
    firstname: string;
    lastname: string;
}