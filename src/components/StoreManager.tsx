import { useState, useMemo } from 'react';
import { Store, MapPin, Plus, Trash2, Edit2, X } from 'lucide-react';
import InventoryList from './InventoryList';
import { PREDEFINED_BRANDS } from '../constants';
import type { Store as StoreType, Tyre } from '../types';

interface StoreManagerProps {
    stores: StoreType[];
    inventory: Tyre[];
    onAddStore: (store: Omit<StoreType, 'id'>) => void;
    onUpdateStore: (id: string, store: Omit<StoreType, 'id'>) => void;
    onDeleteStore: (id: string) => void;
    onDeleteTyre: (id: string) => void;
    onAddTyre: () => void;
}

export default function StoreManager({ stores, inventory, onAddStore, onUpdateStore, onDeleteStore, onDeleteTyre, onAddTyre }: StoreManagerProps) {

    // UI State
    const [isAdding, setIsAdding] = useState(false);
    const [editingStore, setEditingStore] = useState<StoreType | null>(null);
    const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({ name: '', location: '' });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [selectedRimSize, setSelectedRimSize] = useState<string>('');
    const [selectedType, setSelectedType] = useState<string>('');

    const resetForm = () => {
        setFormData({ name: '', location: '' });
        setIsAdding(false);
        setEditingStore(null);
    };

    const handleAddClick = () => {
        setFormData({ name: '', location: '' });
        setIsAdding(true);
    };

    const handleEditClick = (store: StoreType, e: React.MouseEvent) => {
        e.stopPropagation();
        setFormData({ name: store.name, location: store.location });
        setEditingStore(store);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.name && formData.location) {
            if (editingStore) {
                onUpdateStore(editingStore.id, formData);
            } else {
                onAddStore(formData);
            }
            resetForm();
        }
    };

    const handleDeleteStore = () => {
        if (editingStore && window.confirm(`Are you sure you want to delete "${editingStore.name}"? Tyres in this store will remain but lose their store association.`)) {
            onDeleteStore(editingStore.id);
            if (selectedStoreId === editingStore.id) {
                setSelectedStoreId(null);
            }
            resetForm();
        }
    };

    const toggleStoreSelection = (id: string) => {
        if (selectedStoreId === id) {
            setSelectedStoreId(null);
        } else {
            setSelectedStoreId(id);
        }
    };

    // Extract unique brands (Predefined + Inventory)
    const uniqueBrands = useMemo(() => Array.from(new Set([
        ...PREDEFINED_BRANDS,
        ...inventory.map(t => t.brand)
    ])).sort(), [inventory]);

    // Extract unique Rim Sizes
    const uniqueRimSizes = useMemo(() => {
        const rims = new Set<string>();
        inventory.forEach(t => {
            const match = t.size.match(/R\d+/i);
            if (match) rims.add(match[0].toUpperCase());
        });
        return Array.from(rims).sort();
        return Array.from(rims).sort();
    }, [inventory]);

    // Extract unique Tyre Types
    const uniqueTypes = useMemo(() => Array.from(new Set(
        inventory.map(t => t.type).filter(Boolean) as string[]
    )).sort(), [inventory]);

    // Filter inventory based on selection and filters
    const filteredInventory = inventory.filter(tyre => {
        const matchesStore = selectedStoreId ? tyre.storeId === selectedStoreId : true;
        const matchesSearch = tyre.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tyre.brand.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBrand = selectedBrand ? tyre.brand === selectedBrand : true;
        const matchesType = selectedType ? tyre.type === selectedType : true;

        let matchesRim = true;
        if (selectedRimSize) {
            const match = tyre.size.match(/R\d+/i);
            const rim = match ? match[0].toUpperCase() : '';
            matchesRim = rim === selectedRimSize;
        }

        return matchesStore && matchesSearch && matchesBrand && matchesRim && matchesType;
    });

    const isModalOpen = isAdding || !!editingStore;

    return (
        <div className="store-manager">
            <div className="page-header">
                <h1 className="page-title">Store Management</h1>
                <div className="action-buttons">
                    <button onClick={onAddTyre} className="btn btn-primary" style={{ backgroundColor: '#2563eb' }}>
                        <Plus size={20} />
                        Add New Tyre
                    </button>
                    <button onClick={handleAddClick} className="btn btn-primary">
                        <Plus size={20} />
                        Add Store
                    </button>
                </div>
            </div>

            {/* Store Form Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button onClick={resetForm} className="modal-close">
                            <X size={24} />
                        </button>
                        <h2 className="modal-title">{editingStore ? 'Edit Store' : 'Add New Store'}</h2>

                        <form onSubmit={handleSubmit} className="form-stack">
                            <div className="form-group">
                                <label>Store Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.location}
                                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>

                            <div className="form-actions" style={{ justifyContent: 'space-between' }}>
                                {editingStore ? (
                                    <button
                                        type="button"
                                        onClick={handleDeleteStore}
                                        className="btn btn-danger"
                                        style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none' }}
                                    >
                                        <Trash2 size={18} style={{ marginRight: '0.5rem' }} />
                                        Delete Store
                                    </button>
                                ) : <div />}

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button type="button" onClick={resetForm} className="btn btn-secondary">Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Store</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="stores-grid" style={{ marginBottom: '2rem' }}>
                {stores.map(store => (
                    <div
                        key={store.id}
                        className={`store-card ${selectedStoreId === store.id ? 'active' : ''}`}
                        onClick={() => toggleStoreSelection(store.id)}
                        style={{
                            cursor: 'pointer',
                            border: selectedStoreId === store.id ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                            backgroundColor: selectedStoreId === store.id ? '#eff6ff' : 'white',
                            position: 'relative'
                        }}
                    >
                        <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div className="store-icon">
                                <Store size={24} />
                            </div>
                            <div className="store-info">
                                <h3>{store.name}</h3>
                                <p className="store-location">
                                    <MapPin size={16} />
                                    {store.location}
                                </p>
                            </div>
                        </div>
                        <button
                            className="btn-icon edit"
                            onClick={(e) => handleEditClick(store, e)}
                            title="Edit Store"
                            style={{ marginLeft: '1rem' }}
                        >
                            <Edit2 size={18} />
                        </button>
                    </div>
                ))}
            </div>

            <div className="section-card">
                <div className="page-header" style={{ marginBottom: '1rem' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>
                        {selectedStoreId
                            ? `${stores.find(s => s.id === selectedStoreId)?.name || 'Store'} Inventory`
                            : 'All Inventory'
                        }
                    </h2>
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
                        <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>Total Stock: {filteredInventory.reduce((acc, t) => acc + t.quantity, 0)}</span>
                    </div>
                </div>

                <div className="filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 2, minWidth: '200px' }}>
                        <input
                            type="text"
                            placeholder="Search by size or brand..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '0.5rem', width: '100%' }}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
                        <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            style={{ padding: '0.5rem', width: '100%' }}
                        >
                            <option value="">All Brands</option>
                            {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
                        <select
                            value={selectedRimSize}
                            onChange={(e) => setSelectedRimSize(e.target.value)}
                            style={{ padding: '0.5rem', width: '100%' }}
                        >
                            <option value="">All Rims</option>
                            {uniqueRimSizes.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            style={{ padding: '0.5rem', width: '100%' }}
                        >
                            <option value="">All Types</option>
                            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                <InventoryList
                    inventory={filteredInventory}
                    stores={stores}
                    onEdit={() => { }} // Disabled for now in this view
                    onDelete={(id) => {
                        if (window.confirm('Are you sure you want to delete this tyre?')) {
                            onDeleteTyre(id);
                        }
                    }}
                />
            </div>
        </div>
    );
}
