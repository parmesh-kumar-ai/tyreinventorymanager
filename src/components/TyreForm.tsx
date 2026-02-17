import { useState, useEffect } from 'react';
import type { Tyre, Store } from '../types';
import { X } from 'lucide-react';

interface TyreFormProps {
    initialData?: Tyre | null;
    onSubmit: (data: Omit<Tyre, 'id'>, date?: string) => void;
    onCancel: () => void;
    stores: Store[];
    managedBrands: string[];
    inventory: Tyre[];
}

export default function TyreForm({ initialData, onSubmit, onCancel, stores, managedBrands, inventory }: TyreFormProps) {

    // Compute all available brands for suggestions
    const availableBrands = Array.from(new Set([
        ...managedBrands,
        ...inventory.map(t => t.brand)
    ])).sort();

    // Form state includes standard tyre data + optional purchase date
    const [formData, setFormData] = useState({
        storeId: stores[0]?.id || '',
        brand: '', // Start empty to force user selection
        size: '',
        type: '',
        quantity: 0,
        purchaseDate: new Date().toISOString().split('T')[0] // Default to today YYYY-MM-DD
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                storeId: initialData.storeId,
                brand: initialData.brand,
                size: initialData.size,
                type: initialData.type || '',
                quantity: initialData.quantity,
                purchaseDate: new Date().toISOString().split('T')[0]
            });
        } else {
            // Reset to defaults if switching to Add mode without unmounting
            setFormData(prev => ({
                ...prev,
                storeId: stores[0]?.id || '',
                brand: '',
                size: '',
                type: '',
                quantity: 0,
                purchaseDate: new Date().toISOString().split('T')[0]
            }));
        }
    }, [initialData, stores]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Extract date from tyre data
        const { purchaseDate, ...tyreData } = formData;

        // Pass to parent
        onSubmit(tyreData, purchaseDate);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button
                    onClick={onCancel}
                    className="modal-close"
                >
                    <X size={24} />
                </button>

                <h2 className="modal-title">
                    {initialData ? 'Edit Tyre' : 'Add New Tyre'}
                </h2>

                <form onSubmit={handleSubmit} className="form-stack">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Purchase Date</label>
                            <input
                                type="date"
                                value={formData.purchaseDate}
                                onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Store</label>
                        <select
                            value={formData.storeId}
                            onChange={e => setFormData({ ...formData, storeId: e.target.value })}
                            required
                        >
                            <option value="" disabled>Select a Store</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Brand</label>
                        <input
                            list="brand-list"
                            type="text"
                            required
                            placeholder="Select or type a brand"
                            value={formData.brand}
                            onChange={e => setFormData({ ...formData, brand: e.target.value })}
                        />
                        <datalist id="brand-list">
                            {availableBrands.map(b => <option key={b} value={b} />)}
                        </datalist>
                    </div>

                    <div className="form-group">
                        <label>Size (e.g., 205/55 R16)</label>
                        <input
                            type="text"
                            required
                            placeholder="205/55 R16"
                            value={formData.size}
                            onChange={e => setFormData({ ...formData, size: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Tyre Type (Optional)</label>
                        <input
                            type="text"
                            placeholder="e.g., Earthone, Geolander"
                            value={formData.type || ''}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number"
                                min="0"
                                required
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="btn btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                        >
                            {initialData ? 'Save Changes' : 'Add Tyre'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
