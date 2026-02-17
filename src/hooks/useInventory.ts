import { useState, useEffect } from 'react';
import type { Tyre, Store, Transaction, WarrantyRecord, ClaimRecord } from '../types';
import { PREDEFINED_BRANDS } from '../constants';

// Old storage keys removed.
// Shop details state managed above.



const getStorageKey = (userId: string, key: string) => `tyre-data-${userId}-${key}`;

export const useInventory = (userId?: string) => {
    // If no userId provided, return empty/default state to avoid errors before login
    // BUT we need hooks to run unconditionally. 

    // Helper to get data safely
    const getStoredData = (key: string, defaultVal: any) => {
        if (!userId) return defaultVal;
        const userKey = getStorageKey(userId, key);
        const stored = localStorage.getItem(userKey);

        // MIGRATION: If no user data exists, check for legacy data
        if (!stored) {
            const legacyKey = `tyre-${key}-data`; // e.g. tyre-inventory-data
            const legacyStored = localStorage.getItem(legacyKey);
            // specialized handling for brands key which doesn't match the pattern exactly in legacy
            const legacyBrandKey = 'tyre-brands-list';

            if (key === 'brands' && !stored) {
                const legacyBrands = localStorage.getItem(legacyBrandKey);
                if (legacyBrands) {
                    // Claim legacy data for this user
                    localStorage.setItem(userKey, legacyBrands);
                    // Optional: Clear legacy? No, keeping it as backup or for other users might be safer, 
                    // but "Claiming" implies moving. Let's copy for now.
                    return JSON.parse(legacyBrands);
                }
            }

            if (legacyStored) {
                // Claim legacy data
                localStorage.setItem(userKey, legacyStored);
                // Remove legacy data so other users don't claim it
                localStorage.removeItem(legacyKey);
                return JSON.parse(legacyStored);
            }
        }

        return stored ? JSON.parse(stored) : defaultVal;
    };

    const [inventory, setInventory] = useState<Tyre[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [managedBrands, setManagedBrands] = useState<string[]>(PREDEFINED_BRANDS);
    const [shopDetails, setShopDetails] = useState<{ phone: string }>({ phone: '' });
    const [warranties, setWarranties] = useState<WarrantyRecord[]>([]);
    const [claims, setClaims] = useState<ClaimRecord[]>([]);

    // Load data when userId changes
    useEffect(() => {
        if (!userId) {
            setInventory([]);
            setStores([]);
            setTransactions([]);
            setManagedBrands(PREDEFINED_BRANDS);
            setShopDetails({ phone: '' });
            setWarranties([]);
            setClaims([]);
            return;
        }

        setInventory(getStoredData('inventory', []));
        setStores(getStoredData('stores', []));
        setTransactions(getStoredData('transactions', []));
        setManagedBrands(getStoredData('brands', PREDEFINED_BRANDS));
        setShopDetails(getStoredData('shop-details', { phone: '' }));
        setWarranties(getStoredData('warranties', []));
        setClaims(getStoredData('claims', []));
    }, [userId]);

    // Persistence Effects
    useEffect(() => {
        if (userId) localStorage.setItem(getStorageKey(userId, 'inventory'), JSON.stringify(inventory));
    }, [inventory, userId]);

    useEffect(() => {
        if (userId) localStorage.setItem(getStorageKey(userId, 'stores'), JSON.stringify(stores));
    }, [stores, userId]);

    useEffect(() => {
        if (userId) localStorage.setItem(getStorageKey(userId, 'transactions'), JSON.stringify(transactions));
    }, [transactions, userId]);

    useEffect(() => {
        if (userId) localStorage.setItem(getStorageKey(userId, 'brands'), JSON.stringify(managedBrands));
    }, [managedBrands, userId]);

    useEffect(() => {
        if (userId) localStorage.setItem(getStorageKey(userId, 'shop-details'), JSON.stringify(shopDetails));
    }, [shopDetails, userId]);

    // Data Migration for Claims (Warranty Date -> Claim Date)
    useEffect(() => {
        if (!userId) return;
        const key = getStorageKey(userId, 'claims');
        const stored = localStorage.getItem(key);
        if (stored) {
            const parsed = JSON.parse(stored);
            let hasChanges = false;
            const migrated = parsed.map((p: any) => {
                // If claimDate is missing but warrantyDate exists (legacy record)
                if (!p.claimDate && p.warrantyDate) {
                    hasChanges = true;
                    // Move warrantyDate (which was claim date) to claimDate
                    return { ...p, claimDate: p.warrantyDate, warrantyDate: '' };
                }
                return p;
            });

            if (hasChanges) {
                console.log('Migrated claims data: Moved warrantyDate to claimDate');
                setClaims(migrated);
                localStorage.setItem(key, JSON.stringify(migrated));
            }
        }
    }, [userId]);

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
        const currentTyre = inventory.find(t => t.id === id);
        if (!currentTyre) return;

        const newQuantity = Number(updatedTyre.quantity);
        const oldQuantity = Number(currentTyre.quantity);
        const diff = newQuantity - oldQuantity;

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

        setInventory(prev => prev.map(t =>
            t.id === id ? { ...t, ...updatedTyre, quantity: newQuantity, id } : t
        ));
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
        setShopDetails({ phone: '' });
        setWarranties([]);
        setClaims([]);

        if (userId) {
            localStorage.removeItem(getStorageKey(userId, 'inventory'));
            localStorage.removeItem(getStorageKey(userId, 'stores'));
            localStorage.removeItem(getStorageKey(userId, 'transactions'));
            localStorage.removeItem(getStorageKey(userId, 'brands'));
            localStorage.removeItem(getStorageKey(userId, 'shop-details'));
            localStorage.removeItem(getStorageKey(userId, 'warranties'));
            localStorage.removeItem(getStorageKey(userId, 'claims'));
        }
    };

    const importData = (data: any) => {
        if (data.inventory) setInventory(data.inventory);
        if (data.stores) setStores(data.stores);
        if (data.transactions) setTransactions(data.transactions);
        if (data.managedBrands) setManagedBrands(data.managedBrands);
        if (data.shopDetails) setShopDetails(data.shopDetails); // Support importing shop details
        if (data.warranties) setWarranties(data.warranties);
        if (data.claims) setClaims(data.claims);
    };



    const updateShopDetails = (details: Partial<{ phone: string }>) => {
        setShopDetails(prev => ({ ...prev, ...details }));
    };

    const reconcileTransactions = () => {
        const newTransactions: Transaction[] = [];

        inventory.forEach(tyre => {
            const tyreTransactions = transactions.filter(t => t.tyreId === tyre.id);

            // Calculate expected quantity from transactions
            const inQty = tyreTransactions.filter(t => t.type === 'IN').reduce((sum, t) => sum + t.quantity, 0);
            const outQty = tyreTransactions.filter(t => t.type === 'OUT').reduce((sum, t) => sum + t.quantity, 0);
            const calculatedQty = inQty - outQty;

            // If mismatch, create adjustment transaction
            if (calculatedQty !== tyre.quantity) {
                const diff = tyre.quantity - calculatedQty;
                // Only fix if there is a difference
                if (diff !== 0) {
                    newTransactions.push({
                        id: crypto.randomUUID(),
                        tyreId: tyre.id,
                        type: diff > 0 ? 'IN' : 'OUT',
                        quantity: Math.abs(diff),
                        date: new Date().toISOString(), // System correction time
                        storeId: tyre.storeId
                    });
                }
            }
        });

        if (newTransactions.length > 0) {
            setTransactions(prev => [...prev, ...newTransactions]);
            return newTransactions.length;
        }
        return 0;
    };

    const updateTransaction = (id: string, updates: Partial<Transaction>, updateStock: boolean = false) => {
        setTransactions(prev => {
            const oldTransaction = prev.find(t => t.id === id);
            if (!oldTransaction) return prev;

            if (updateStock) {
                setInventory(currInv => currInv.map(item => {
                    if (item.id === oldTransaction.tyreId) {
                        // Revert old effect
                        let qty = item.quantity;
                        if (oldTransaction.type === 'IN') qty -= oldTransaction.quantity;
                        else qty += oldTransaction.quantity;

                        // Apply new effect
                        const newType = updates.type || oldTransaction.type;
                        const newQty = updates.quantity !== undefined ? Number(updates.quantity) : oldTransaction.quantity;

                        if (newType === 'IN') qty += newQty;
                        else qty -= newQty;

                        return { ...item, quantity: Math.max(0, qty) };
                    }
                    return item;
                }));
            }

            return prev.map(t => t.id === id ? { ...t, ...updates } : t);
        });
    };

    const deleteTransaction = (id: string, updateStock: boolean = false) => {
        setTransactions(prev => {
            const transaction = prev.find(t => t.id === id);
            if (!transaction) return prev;

            if (updateStock) {
                setInventory(currInv => currInv.map(item => {
                    if (item.id === transaction.tyreId) {
                        // Revert effect
                        let qty = item.quantity;
                        if (transaction.type === 'IN') qty -= transaction.quantity;
                        else qty += transaction.quantity;
                        return { ...item, quantity: Math.max(0, qty) };
                    }
                    return item;
                }));
            }

            return prev.filter(t => t.id !== id);
        });
    };

    useEffect(() => {
        if (userId) localStorage.setItem(getStorageKey(userId, 'warranties'), JSON.stringify(warranties));
    }, [warranties, userId]);

    useEffect(() => {
        if (userId) localStorage.setItem(getStorageKey(userId, 'claims'), JSON.stringify(claims));
    }, [claims, userId]);

    const addWarranty = (record: Omit<WarrantyRecord, 'id'>) => {
        const newRecord = { ...record, id: crypto.randomUUID() };
        setWarranties(prev => [newRecord, ...prev]);
    };

    const deleteWarranty = (id: string) => {
        setWarranties(prev => prev.filter(r => r.id !== id));
    };

    const updateWarranty = (id: string, updates: Partial<WarrantyRecord>) => {
        setWarranties(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const addClaim = (record: Omit<ClaimRecord, 'id'>) => {
        const newRecord = { ...record, id: crypto.randomUUID() };
        setClaims(prev => [newRecord, ...prev]);
    };

    const deleteClaim = (id: string) => {
        setClaims(prev => prev.filter(r => r.id !== id));
    };

    const updateClaim = (id: string, updates: Partial<ClaimRecord>) => {
        setClaims(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

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
        importData,
        reconcileTransactions,
        deleteTransaction,
        updateTransaction,
        warranties,
        claims,
        addWarranty,
        updateWarranty,
        deleteWarranty,
        addClaim,
        deleteClaim,
        updateClaim
    };
};
