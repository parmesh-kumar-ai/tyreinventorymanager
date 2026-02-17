import { useState } from 'react';
import { LayoutDashboard, Store, History, Tag, Settings, X, Plus, Trash2, UserCircle } from 'lucide-react';
import type { User } from 'firebase/auth';

interface SidebarProps {
    currentView: 'inventory' | 'stores' | 'history' | 'brand';
    currentBrand?: string | null;
    brands: string[];
    user: User;
    onViewChange: (view: 'inventory' | 'stores' | 'history' | 'brand') => void;
    onBrandSelect: (brand: string) => void;
    onAddBrand: (brand: string) => void;
    onRemoveBrand: (brand: string) => void;
    onManageAccount: () => void;
}

export default function Sidebar({
    currentView,
    currentBrand,
    brands,
    user,
    onViewChange,
    onBrandSelect,
    onAddBrand,
    onRemoveBrand,
    onManageAccount
}: SidebarProps) {
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');

    const menuItems = [
        { id: 'inventory', label: 'Inventory', icon: LayoutDashboard },
        { id: 'stores', label: 'Stores', icon: Store },
        { id: 'history', label: 'History', icon: History },
    ] as const;

    const handleAddBrand = (e: React.FormEvent) => {
        e.preventDefault();
        if (newBrandName.trim()) {
            onAddBrand(newBrandName.trim());
            setNewBrandName('');
        }
    };

    return (
        <>
            <div className="sidebar">
                <div className="sidebar-header">
                    <h2>Tyre Manager</h2>
                </div>
                <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flexShrink: 0 }}>
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onViewChange(item.id)}
                                    className={`sidebar-link ${currentView === item.id ? 'active' : ''}`}
                                >
                                    <Icon size={20} />
                                    <span>{item.label}</span>
                                </button>
                            );
                        })}

                        <div className="sidebar-divider" style={{
                            margin: '1rem 0',
                            borderTop: '1px solid var(--border-color)'
                        }} />

                        <div style={{
                            padding: '0 1rem 0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: 'var(--text-secondary)'
                        }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>BRANDS</span>
                            <button
                                onClick={() => setIsManageModalOpen(true)}
                                className="btn-icon"
                                title="Manage Brands"
                                style={{ padding: '4px' }}
                            >
                                <Settings size={14} />
                            </button>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {brands.map(brand => (
                            <button
                                key={brand}
                                onClick={() => onBrandSelect(brand)}
                                className={`sidebar-link ${currentView === 'brand' && currentBrand === brand ? 'active' : ''}`}
                            >
                                <Tag size={18} />
                                <span>{brand}</span>
                            </button>
                        ))}
                    </div>

                    {/* User Profile Footer */}
                    <div style={{
                        marginTop: 'auto',
                        padding: '1.5rem 1rem',
                        borderTop: '1px solid var(--border-color)',
                        background: 'var(--surface-color)',
                        textAlign: 'center'
                    }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <p style={{ margin: '0 0 0.25rem 0', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                {user.displayName || user.phoneNumber || user.email?.split('@')[0] || 'User'}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user.email || ''}
                            </p>
                        </div>
                        <button
                            onClick={onManageAccount}
                            className="btn btn-primary"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '0.9rem', padding: '0.75rem' }}
                        >
                            <UserCircle size={18} />
                            Manage Account
                        </button>
                    </div>
                </nav>
            </div>

            {/* Manage Brands Modal */}
            {isManageModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button
                            className="modal-close"
                            onClick={() => setIsManageModalOpen(false)}
                        >
                            <X size={20} />
                        </button>

                        <h2 className="modal-title">Manage Brands</h2>

                        <form onSubmit={handleAddBrand} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={newBrandName}
                                onChange={(e) => setNewBrandName(e.target.value)}
                                placeholder="Enter new brand name..."
                                style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                            />
                            <button type="submit" className="btn btn-primary" disabled={!newBrandName.trim()}>
                                <Plus size={18} />
                                Add
                            </button>
                        </form>

                        <div className="brands-list" style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {brands.map(brand => (
                                <div key={brand} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    background: '#f9fafb',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <span style={{ fontWeight: 500 }}>{brand}</span>
                                    <button
                                        onClick={() => {
                                            if (window.confirm(`Remove ${brand} from sidebar? (This won't delete inventory)`)) {
                                                onRemoveBrand(brand);
                                            }
                                        }}
                                        className="btn-icon delete"
                                        title="Remove Brand"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {brands.length === 0 && (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>
                                    No brands added yet.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
