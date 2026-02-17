import { useState, useEffect } from 'react';
import type { Tyre, Store, Transaction } from '../types';
import { PREDEFINED_BRANDS } from '../constants';

const STORAGE_KEY_INVENTORY = 'tyre-inventory-data';
const STORAGE_KEY_STORES = 'tyre-stores-data';
const STORAGE_KEY_TRANSACTIONS = 'tyre-transactions-data';
const STORAGE_KEY_BRANDS = 'tyre-brands-list';

const initialStores: Store[] = [];

const initialInventory: Tyre[] = [];

export const useInventory = () => {
    const [inventory, setInventory] = useState<Tyre[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY_INVENTORY);
        return stored ? JSON.parse(stored) : [];
    });

    const [stores, setStores] = useState<Store[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY_STORES);
        return stored ? JSON.parse(stored) : [];
    });

    const [transactions, setTransactions] = useState<Transaction[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
        return stored ? JSON.parse(stored) : [];
    });

    const [managedBrands, setManagedBrands] = useState<string[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY_BRANDS);
        return stored ? JSON.parse(stored) : PREDEFINED_BRANDS;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(inventory));
    }, [inventory]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_STORES, JSON.stringify(stores));
    }, [stores]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
    }, [transactions]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_BRANDS, JSON.stringify(managedBrands));
    }, [managedBrands]);

    const addStore = (store: Omit<Store, 'id'>) => {
        const newStore = { ...store, id: crypto.randomUUID() };
        setStores([...stores, newStore]);
    };

    const addTyre = (tyre: Omit<Tyre, 'id'>, date?: string) => {
        const id = crypto.randomUUID();
        const newTyre = { ...tyre, id };
        setInventory([...inventory, newTyre]);

        // Add initial transaction
        const transaction: Transaction = {
            id: crypto.randomUUID(),
            tyreId: id,
            type: 'IN',
            quantity: tyre.quantity,
            date: date || new Date().toISOString(),
            storeId: tyre.storeId
        };
        setTransactions([...transactions, transaction]);
    };

    const updateTyre = (id: string, updatedTyre: Omit<Tyre, 'id'>, date?: string) => {
        setInventory(inventory.map(t => {
            if (t.id === id) {
                const diff = updatedTyre.quantity - t.quantity;
                if (diff !== 0) {
                    const transaction: Transaction = {
                        id: crypto.randomUUID(),
                        tyreId: id,
                        type: diff > 0 ? 'IN' : 'OUT',
                        quantity: Math.abs(diff),
                        date: date || new Date().toISOString(),
                        storeId: updatedTyre.storeId
                    };
                    setTransactions(prev => [transaction, ...prev]);
                }
                return { ...t, ...updatedTyre, id };
            }
            return t;
        }));
    };

    const deleteTyre = (id: string) => {
        setInventory(inventory.filter(t => t.id !== id));
    };

    const updateStore = (id: string, updatedStore: Omit<Store, 'id'>) => {
        setStores(stores.map(s => s.id === id ? { ...s, ...updatedStore } : s));
    };

    const deleteStore = (id: string) => {
        setStores(stores.filter(s => s.id !== id));
    };

    const addBrand = (brand: string) => {
        if (!managedBrands.includes(brand)) {
            setManagedBrands([...managedBrands, brand].sort());
        }
    };

    const removeBrand = (brand: string) => {
        setManagedBrands(managedBrands.filter(b => b !== brand));
    };

    const clearAllData = () => {
        setInventory([]);
        setStores([]);
        setTransactions([]);
        setManagedBrands(PREDEFINED_BRANDS);
        localStorage.removeItem(STORAGE_KEY_INVENTORY);
        localStorage.removeItem(STORAGE_KEY_STORES);
        localStorage.removeItem(STORAGE_KEY_TRANSACTIONS);
        localStorage.removeItem(STORAGE_KEY_BRANDS);
    };

    const importData = (data: any) => {
        if (data.inventory) setInventory(data.inventory);
        if (data.stores) setStores(data.stores);
        if (data.transactions) setTransactions(data.transactions);
        if (data.managedBrands) setManagedBrands(data.managedBrands);
    };

    const STORAGE_KEY_SHOP_DETAILS = 'tyre-shop-details';

    const [shopDetails, setShopDetails] = useState<{ phone: string }>(() => {
        const stored = localStorage.getItem(STORAGE_KEY_SHOP_DETAILS);
        return stored ? JSON.parse(stored) : { phone: '' };
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_SHOP_DETAILS, JSON.stringify(shopDetails));
    }, [shopDetails]);

    const updateShopDetails = (details: Partial<{ phone: string }>) => {
        setShopDetails(prev => ({ ...prev, ...details }));
    };

    // ... (rest of the file functions)

    return {
        inventory,
        stores,
        transactions,
        managedBrands,
        shopDetails,
        addTyre,
        updateTyre,
        deleteTyre,
        addStore,
        updateStore,
        deleteStore,
        addBrand,
        removeBrand,
        updateShopDetails,
        clearAllData,
        importData
    };
};
