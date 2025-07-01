export class ParametrosIndex {

    with: string[] = [];
    paging!: number;
    page!: number;
    order_by: any;
    filters: any;
    extraDateFilters: any[] = [];
    distinct: boolean = false;

    constructor() {

    }

}