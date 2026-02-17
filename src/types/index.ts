export type Brand = string;



export interface Store {
    id: string;
    name: string;
    location: string;
}

export interface Transaction {
    id: string;
    tyreId: string;
    storeId: string;
    type: 'IN' | 'OUT';
    quantity: number;
    date: string; // ISO string
}

export interface Tyre {
    id: string;
    storeId: string;
    brand: Brand;
    size: string; // e.g., "205/55 R16"
    quantity: number;
}
