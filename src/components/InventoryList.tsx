import type { Tyre, Store } from '../types';
import { Edit, Trash2 } from 'lucide-react';

interface InventoryListProps {
    inventory: Tyre[];
    stores: Store[];
    onEdit: (tyre: Tyre) => void;
    onDelete: (id: string) => void;
}

export default function InventoryList({ inventory, stores, onEdit, onDelete }: InventoryListProps) {
    if (inventory.length === 0) {
        return (
            <div className="empty-inventory">
                No tyres in inventory. Add one to get started!
            </div>
        );
    }

    const getRimSize = (size: string) => {
        const match = size.match(/R\d+/i);
        return match ? match[0].toUpperCase() : '-';
    };

    const getStoreName = (storeId: string) => {
        return stores.find(s => s.id === storeId)?.name || 'Unknown';
    };

    return (
        <div className="table-container">
            <table className="inventory-table">
                <thead>
                    <tr>
                        <th>Brand</th>
                        <th>Size</th>
                        <th>Rim Size</th>
                        <th>Store</th>
                        <th>Quantity</th>
                        <th className="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {inventory.map((tyre) => (
                        <tr key={tyre.id}>
                            <td className="font-medium">{tyre.brand}</td>
                            <td>{tyre.size}</td>
                            <td>{getRimSize(tyre.size)}</td>
                            <td>{getStoreName(tyre.storeId)}</td>
                            <td className={tyre.quantity < 10 ? 'text-danger' : ''}>
                                {tyre.quantity}
                            </td>
                            <td>
                                <div className="action-buttons">
                                    <button
                                        onClick={() => onEdit(tyre)}
                                        className="btn-icon edit"
                                        title="Edit"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(tyre.id)}
                                        className="btn-icon delete"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
