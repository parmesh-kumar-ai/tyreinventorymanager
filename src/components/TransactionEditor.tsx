import { useState, useEffect } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import type { Transaction } from '../types';

interface TransactionEditorProps {
    transaction: Transaction;
    onSave: (id: string, updates: Partial<Transaction>, updateStock: boolean) => void;
    onDelete: (id: string, updateStock: boolean) => void;
    onCancel: () => void;
}

export default function TransactionEditor({ transaction, onSave, onDelete, onCancel }: TransactionEditorProps) {
    const [formData, setFormData] = useState({
        date: '',
        type: 'IN' as 'IN' | 'OUT',
        quantity: 0
    });
    const [updateStock, setUpdateStock] = useState(true);

    useEffect(() => {
        if (transaction) {
            setFormData({
                date: transaction.date.split('T')[0], // Extract YYYY-MM-DD
                type: transaction.type,
                quantity: transaction.quantity
            });
        }
    }, [transaction]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(transaction.id, {
            ...formData,
            // Preserve time if date hasn't changed, strictly speaking simplified here to just date or we could reconstruct proper ISO string
            date: new Date(formData.date).toISOString()
        }, updateStock);
    };

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this transaction?')) {
            onDelete(transaction.id, updateStock);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '400px' }}>
                <button onClick={onCancel} className="modal-close">
                    <X size={24} />
                </button>

                <h2 className="modal-title">Edit Transaction</h2>

                <form onSubmit={handleSubmit} className="form-stack">
                    <div className="form-group">
                        <label>Date</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Type</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as 'IN' | 'OUT' })}
                            className="form-select"
                        >
                            <option value="IN">Stock Added (IN)</option>
                            <option value="OUT">Stock Sold (OUT)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Quantity</label>
                        <input
                            type="number"
                            min="1"
                            value={formData.quantity}
                            onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                            required
                        />
                    </div>

                    <div className="form-group" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        background: '#eff6ff',
                        borderRadius: '0.5rem',
                        border: '1px solid #bfdbfe'
                    }}>
                        <input
                            type="checkbox"
                            id="updateStockCb"
                            checked={updateStock}
                            onChange={e => setUpdateStock(e.target.checked)}
                            style={{ width: '1.25rem', height: '1.25rem' }}
                        />
                        <label htmlFor="updateStockCb" style={{ margin: 0, fontSize: '0.875rem', cursor: 'pointer', color: '#1e40af', fontWeight: 500 }}>
                            Update Inventory Stock automatically?
                            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 400, marginTop: '0.25rem', color: '#60a5fa' }}>
                                Uncheck if you only want to fix the history log.
                            </span>
                        </label>
                    </div>

                    <div className="form-actions" style={{ justifyContent: 'space-between', marginTop: '1.5rem' }}>
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="btn btn-danger"
                            style={{ marginRight: 'auto' }}
                        >
                            <Trash2 size={16} /> Delete
                        </button>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button type="button" onClick={onCancel} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                <Save size={16} /> Save
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
