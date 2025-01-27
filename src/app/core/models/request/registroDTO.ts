export class RegistroDTO {
    
    email!: string;
    user_name!: string;
    password!: string;
    password_confirmation!: string;
    firstname!: string;
    lastname!: string;
    gender_uuid!: string;
    CUIT!: string;
    document_number!: string;
    document_type_uuid!: string;
    city_uuid!: string;
    address_detail!: any;
    door_number?: string;
    street_name?: boolean;

    actual_role!: string;
    hash!: string;
    created_by_admin!: boolean;
    with: string [] = [];

    constructor() {
        
    }
}


