import { useState, useEffect } from 'react';
import type { Tyre, Store, Transaction } from '../types';
import { PREDEFINED_BRANDS } from '../constants';

const STORAGE_KEY_INVENTORY = 'tyre-inventory-data';
const STORAGE_KEY_STORES = 'tyre-stores-data';
const STORAGE_KEY_TRANSACTIONS = 'tyre-transactions-data';
const STORAGE_KEY_BRANDS = 'tyre-brands-list';

const initialStores: Store[] = [
    { id: '1', name: 'Main Warehouse', location: 'New York' },
    { id: '2', name: 'Downtown Shop', location: 'City Center' },
];

const initialInventory: Tyre[] = [
    { id: '1', storeId: '1', brand: 'Michelin', size: '205/55 R16', quantity: 15 },
    { id: '2', storeId: '1', brand: 'Continental', size: '225/45 R17', quantity: 8 },
    { id: '3', storeId: '2', brand: 'Yokohama', size: '195/65 R15', quantity: 20 },
    { id: '4', storeId: '2', brand: 'Bridgestone', size: '215/60 R16', quantity: 5 },
    { id: '5', storeId: '1', brand: 'Apollo', size: '185/65 R14', quantity: 30 },
];

export const useInventory = () => {
    const [inventory, setInventory] = useState<Tyre[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY_INVENTORY);
        return stored ? JSON.parse(stored) : initialInventory;
    });

    const [stores, setStores] = useState<Store[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY_STORES);
        return stored ? JSON.parse(stored) : initialStores;
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

    return {
        inventory,
        stores,
        transactions,
        managedBrands,
        addTyre,
        updateTyre,
        deleteTyre,
        addStore,
        updateStore,
        deleteStore,
        addBrand,
        removeBrand
    };
};
