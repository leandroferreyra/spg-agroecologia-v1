export class HumanDTO {
    // Person
    street_name!: string;
    door_number!: string;
    address_detail!: string;
    city_uuid!: string;
    // Human
    lastname!: string;
    firstname!: string;
    document_type_uuid!:string;
    document_number!: string;
    cuit!: string;
    gender_uuid!: string;

    with: string[] = [];
    actual_role!: string;
    constructor() {

    }
}

// export class Person {
//     street_name!: string;
//     door_number!: string;
//     address_detail!: string;
//     city_uuid!: string;
//     possible_person_state_uuid!: string;
//     state_comments!: string;
//     legal_entity!: LegalEntity;
//     human!: Human
// }

// export class LegalEntity {
//     company_name!: string;
//     cuit!: string;
// }

// export class Human {
//     document_type_uuid!: string;
//     document_number!: string;
//     cuit!: string;
//     gender_uuid!: string;
//     firstname!: string;
//     lastname!: string;
// }