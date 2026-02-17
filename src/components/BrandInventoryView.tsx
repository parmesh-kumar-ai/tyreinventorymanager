import { useMemo, useState } from 'react';

import { PREDEFINED_BRANDS } from '../constants';
import InventoryList from './InventoryList';
import { Package } from 'lucide-react';

import type { Tyre, Store } from '../types';
import { Plus } from 'lucide-react';

interface BrandInventoryViewProps {
    selectedBrand?: string | null;
    inventory: Tyre[];
    stores: Store[]; // Need Store type import? It's likely global or inferred from usage in InventoryList but strictly: import type { Store } from '../types'
    managedBrands: string[];
    onEdit: (tyre: Tyre) => void;
    onDeleteTyre: (id: string) => void;
    onAddTyre: () => void;
}

export default function BrandInventoryView({ selectedBrand, inventory, stores, managedBrands, onEdit, onDeleteTyre, onAddTyre }: BrandInventoryViewProps) {

    // Local Filters
    const [selectedRimSize, setSelectedRimSize] = useState<string>('');
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');

    // Derived Data for Filters
    const uniqueRimSizes = useMemo(() => {
        const rims = new Set<string>();
        inventory.forEach(t => {
            const match = t.size.match(/R\d+/i);
            if (match) rims.add(match[0].toUpperCase());
        });
        return Array.from(rims).sort();
    }, [inventory]);

    const uniqueTypes = useMemo(() => {
        const types = new Set<string>();
        inventory.forEach(t => {
            if (selectedBrand && t.brand !== selectedBrand) return;
            if (t.type) types.add(t.type);
        });
        return Array.from(types).sort();
    }, [inventory, selectedBrand]);

    const brandsToShow = useMemo(() => {
        if (selectedBrand) return [selectedBrand];

        // Use managedBrands + any from inventory that might not be in managed list (safety)
        const allBrands = new Set([
            ...PREDEFINED_BRANDS,
            ...managedBrands,
            ...inventory.map(t => t.brand)
        ]);
        return Array.from(allBrands).sort();
    }, [inventory, selectedBrand, managedBrands]);

    return (
        <div className="brand-inventory-view">
            <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 className="section-title" style={{ fontSize: '1.5rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', display: 'inline-block', margin: 0 }}>
                    {selectedBrand ? `${selectedBrand} Inventory` : 'Full Brand Inventory'}
                </h2>
                <button onClick={onAddTyre} className="btn btn-primary" style={{ backgroundColor: '#2563eb' }}>
                    <Plus size={20} />
                    Add New Tyre
                </button>
            </div>

            {/* Global Filters bar if no specific brand selected, or just standard filters */}
            <div className="filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', background: 'white', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Filter by Rim Size</label>
                    <select
                        value={selectedRimSize}
                        onChange={(e) => setSelectedRimSize(e.target.value)}
                        style={{ padding: '0.5rem', width: '100%', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                    >
                        <option value="">All Rims</option>
                        {uniqueRimSizes.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Filter by Store</label>
                    <select
                        value={selectedStoreId}
                        onChange={(e) => setSelectedStoreId(e.target.value)}
                        style={{ padding: '0.5rem', width: '100%', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                    >
                        <option value="">All Stores</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div style={{ flex: 1, minWidth: '150px' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Filter by Type</label>
                    <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        style={{ padding: '0.5rem', width: '100%', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                    >
                        <option value="">All Types</option>
                        {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                {brandsToShow.map(brand => {
                    // Filter Inventory
                    const brandInventory = inventory.filter(t => {
                        const isBrand = t.brand === brand;
                        const isRim = selectedRimSize ? t.size.toUpperCase().includes(selectedRimSize) : true;
                        const isStore = selectedStoreId ? t.storeId === selectedStoreId : true;
                        const isType = selectedType ? t.type === selectedType : true;
                        return isBrand && isRim && isStore && isType;
                    });

                    // Skip if empty AND filters are applied (to reduce clutter), or if specific brand selected and empty
                    if (brandInventory.length === 0) {
                        if (selectedBrand) {
                            return (
                                <div key={brand} className="empty-state">
                                    <p>No inventory found for {brand} with current filters.</p>
                                </div>
                            );
                        }
                        return null; // Skip empty brands in full view
                    }

                    const totalStock = brandInventory.reduce((acc, t) => acc + t.quantity, 0);

                    return (
                        <div key={brand} className="section-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                                <h3 className="section-title" style={{ margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {brand}
                                </h3>

                                {/* Total Stock Card */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    background: '#eff6ff',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    color: 'var(--primary)',
                                    fontWeight: 600
                                }}>
                                    <Package size={24} />
                                    <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>Total Stock: {totalStock}</span>
                                </div>
                            </div>

                            <InventoryList
                                inventory={brandInventory}
                                stores={stores}
                                onDelete={(id) => {
                                    if (window.confirm('Are you sure you want to delete this tyre?')) {
                                        onDeleteTyre(id);
                                    }
                                }}
                                onEdit={onEdit}
                            />
                        </div>
                    );
                })}

                {brandsToShow.every(brand => {
                    const hasItems = inventory.some(t =>
                        t.brand === brand &&
                        (selectedRimSize ? t.size.toUpperCase().includes(selectedRimSize) : true) &&
                        (selectedStoreId ? t.storeId === selectedStoreId : true) &&
                        (selectedType ? t.type === selectedType : true)
                    );
                    return !hasItems;
                }) && !selectedBrand && (
                        <div className="empty-state">
                            <p>No inventory matches your filters.</p>
                        </div>
                    )}
            </div>
        </div>
    );
}
