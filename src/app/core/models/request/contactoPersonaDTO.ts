export class ContactoPersonaDTO {

    person_uuid!: string;
    "person->contact_uuid": string;
    with: string[] = [];
    actual_role!: string;

    constructor() {

    }
}