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
    type?: string; // e.g., "Earthone", "Geolander"
    quantity: number;
}

export interface WarrantyRecord {
    id: string;
    buyerName: string;
    mobile: string;
    brand: string;
    size: string;
    type: string;
    quantity: number;
    purchaseDate: string;
    warrantyDate: string;
    status: 'Pending' | 'Done';
}

export interface ClaimRecord {
    id: string;
    buyerName: string;
    mobile: string;
    brand: string;
    size: string;
    type: string;
    quantity: number;
    warrantyDate: string; // The original warranty date
    claimDate: string;    // The date the claim was made
    defectType: string;
    status: 'Pending' | 'Accepted' | 'Rejected';
}
