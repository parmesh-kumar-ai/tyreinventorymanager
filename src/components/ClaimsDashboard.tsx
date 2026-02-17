import { useState, useMemo } from 'react';
import { Plus, Search, CheckCircle, XCircle, Clock, Pencil } from 'lucide-react';
import type { ClaimRecord } from '../types';

interface ClaimsDashboardProps {
    claims: ClaimRecord[];
    onAddClaim: (record: Omit<ClaimRecord, 'id'>) => void;
    onUpdateClaim: (id: string, updates: Partial<ClaimRecord>) => void;
    onDeleteClaim: (id: string) => void;
    managedBrands: string[];
}

export default function ClaimsDashboard({ claims, onAddClaim, onUpdateClaim, onDeleteClaim, managedBrands }: ClaimsDashboardProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedDay, setSelectedDay] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Filter Logic
    const filteredRecords = useMemo(() => {
        return claims.filter(r => {
            const matchesSearch =
                r.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.mobile.includes(searchTerm);
            const matchesBrand = selectedBrand ? r.brand === selectedBrand : true;
            const matchesType = selectedType ? r.type === selectedType : true;
            const matchesStatus = selectedStatus ? r.status === selectedStatus : true;

            const date = new Date(r.claimDate || r.warrantyDate); // Fallback for safety, though migration should handle it
            const matchesYear = selectedYear ? date.getFullYear().toString() === selectedYear : true;
            const matchesMonth = selectedMonth ? date.getMonth().toString() === selectedMonth : true;
            const matchesDay = selectedDay ? date.getDate().toString() === selectedDay : true;

            return matchesSearch && matchesBrand && matchesType && matchesStatus && matchesYear && matchesMonth && matchesDay;
        });
    }, [claims, searchTerm, selectedBrand, selectedType, selectedStatus, selectedYear, selectedMonth, selectedDay]);

    // Unique Types
    const uniqueTypes = useMemo(() => Array.from(new Set(claims.map(r => r.type).filter(Boolean))), [claims]);

    // Date Filter Lists
    const uniqueYears = useMemo(() => {
        const years = claims.map(r => new Date(r.claimDate || r.warrantyDate).getFullYear().toString());
        const currentYear = new Date().getFullYear().toString();
        return Array.from(new Set([...years, currentYear])).sort().reverse();
    }, [claims]);

    const months = [
        { value: '0', label: 'January' },
        { value: '1', label: 'February' },
        { value: '2', label: 'March' },
        { value: '3', label: 'April' },
        { value: '4', label: 'May' },
        { value: '5', label: 'June' },
        { value: '6', label: 'July' },
        { value: '7', label: 'August' },
        { value: '8', label: 'September' },
        { value: '9', label: 'October' },
        { value: '10', label: 'November' },
        { value: '11', label: 'December' }
    ];

    const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

    // Form State
    const [formData, setFormData] = useState({
        buyerName: '',
        mobile: '',
        brand: '',
        type: '',
        size: '',
        quantity: 1,
        warrantyDate: '',
        claimDate: new Date().toISOString().split('T')[0],
        defectType: '',
        status: 'Pending' as 'Pending' | 'Accepted' | 'Rejected'
    });

    const handleEdit = (record: ClaimRecord) => {
        setEditingId(record.id);
        setFormData({
            buyerName: record.buyerName,
            mobile: record.mobile,
            brand: record.brand,
            type: record.type || '',
            size: record.size,
            quantity: record.quantity,
            warrantyDate: record.warrantyDate,
            claimDate: record.claimDate || record.warrantyDate, // Handle legacy
            defectType: record.defectType,
            status: record.status
        });
        setIsModalOpen(true);
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
            buyerName: '',
            mobile: '',
            brand: '',
            type: '',
            size: '',
            quantity: 1,
            warrantyDate: '',
            claimDate: new Date().toISOString().split('T')[0],
            defectType: '',
            status: 'Pending'
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            onUpdateClaim(editingId, formData);
        } else {
            onAddClaim(formData);
        }
        handleClose();
    };

    const handleDelete = () => {
        if (editingId && window.confirm('Are you sure you want to delete this claim record?')) {
            onDeleteClaim(editingId);
            handleClose();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Accepted': return '#16a34a'; // Green
            case 'Rejected': return '#dc2626'; // Red
            default: return '#ca8a04'; // Yellow/Amber
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Accepted': return <CheckCircle size={14} />;
            case 'Rejected': return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    return (
        <div className="dashboard-container">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="page-title">Warranty Claims</h1>

                {/* Summary Stats */}
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Month</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6' }}>
                            {filteredRecords.filter(r => new Date(r.claimDate).getMonth() === new Date().getMonth() && new Date(r.claimDate).getFullYear() === new Date().getFullYear()).length}
                        </span>
                    </div>
                    <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>This Year</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#8b5cf6' }}>
                            {filteredRecords.filter(r => new Date(r.claimDate).getFullYear() === new Date().getFullYear()).length}
                        </span>
                    </div>
                    <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '80px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>All Time</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981' }}>
                            {filteredRecords.length}
                        </span>
                    </div>
                </div>

                <button className="btn btn-primary" onClick={() => { setEditingId(null); setIsModalOpen(true); }}>
                    <Plus size={20} /> New Claim
                </button>
            </div>

            {/* Filters */}
            <div className="filter-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div className="form-group" style={{ flex: '1 1 300px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                        <input
                            type="text"
                            placeholder="Search Buyer Name or Mobile..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: '0.5rem 0.5rem 0.5rem 2.5rem', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>
                <div className="form-group" style={{ flex: '1 1 150px' }}>
                    <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} style={{ padding: '0.5rem', width: '100%' }}>
                        <option value="">All Brands</option>
                        {managedBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ flex: '1 1 150px' }}>
                    <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} style={{ padding: '0.5rem', width: '100%' }}>
                        <option value="">All Types</option>
                        {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ flex: '1 1 150px' }}>
                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} style={{ padding: '0.5rem', width: '100%' }}>
                        <option value="">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>
                <div className="form-group" style={{ flex: '1 1 100px' }}>
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ padding: '0.5rem', width: '100%' }}>
                        <option value="">Year</option>
                        {uniqueYears.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ flex: '1 1 100px' }}>
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ padding: '0.5rem', width: '100%' }}>
                        <option value="">Month</option>
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                </div>
                <div className="form-group" style={{ flex: '1 1 80px' }}>
                    <select value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} style={{ padding: '0.5rem', width: '100%' }}>
                        <option value="">Date</option>
                        {days.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="card-bg" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Buyer Name</th>
                            <th style={{ padding: '1rem' }}>Mobile</th>
                            <th style={{ padding: '1rem' }}>Tyre Details</th>
                            <th style={{ padding: '1rem' }}>Defect</th>
                            <th style={{ padding: '1rem' }}>Dates</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{r.buyerName}</td>
                                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{r.mobile}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span className="brand-badge" style={{ fontSize: '0.75rem' }}>{r.brand}</span>
                                    <div style={{ marginTop: '0.25rem' }}>{r.size}</div>
                                    {r.type && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.type}</div>}
                                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Qty: {r.quantity}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 500 }}>{r.defectType}</div>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                    <div>Claim: {r.claimDate}</div>
                                    <div style={{ color: 'var(--primary)', fontWeight: 500 }}>Warranty: {r.warrantyDate || 'N/A'}</div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ color: getStatusColor(r.status) }}>
                                            {getStatusIcon(r.status)}
                                        </div>
                                        <select
                                            value={r.status}
                                            onChange={(e) => onUpdateClaim(r.id, { status: e.target.value as any })}
                                            style={{
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '999px',
                                                border: `1px solid ${getStatusColor(r.status)}`,
                                                backgroundColor: `${getStatusColor(r.status)}15`,
                                                color: getStatusColor(r.status),
                                                fontWeight: 500,
                                                fontSize: '0.85rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Accepted">Accepted</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <button
                                        className="icon-btn"
                                        onClick={() => handleEdit(r)}
                                        title="Edit Claim"
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                                    >
                                        <Pencil size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredRecords.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                    No claim records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <button className="modal-close" onClick={handleClose}>×</button>
                        <h2 className="modal-title">{editingId ? 'Edit Claim Record' : 'New Claim Record'}</h2>
                        <form onSubmit={handleSubmit} className="form-stack">
                            <div className="form-group">
                                <label>Buyer Name</label>
                                <input type="text" required value={formData.buyerName} onChange={e => setFormData({ ...formData, buyerName: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Mobile Number</label>
                                <input type="tel" required value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Brand</label>
                                    <input list="brand-list" required value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} />
                                    <datalist id="brand-list">
                                        {managedBrands.map(b => <option key={b} value={b} />)}
                                    </datalist>
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <input type="text" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} placeholder="e.g. Earthone" />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Size</label>
                                    <input type="text" required value={formData.size} onChange={e => setFormData({ ...formData, size: e.target.value })} placeholder="205/55 R16" />
                                </div>
                                <div className="form-group">
                                    <label>Quantity</label>
                                    <input type="number" min="1" required value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Defect Type</label>
                                <input type="text" required value={formData.defectType} onChange={e => setFormData({ ...formData, defectType: e.target.value })} placeholder="e.g. Sidewall bulge, Separation" />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Warranty Date</label>
                                    <input type="date" required value={formData.warrantyDate} onChange={e => setFormData({ ...formData, warrantyDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Date of Claim</label>
                                    <input type="date" required value={formData.claimDate} onChange={e => setFormData({ ...formData, claimDate: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-actions" style={{ justifyContent: 'space-between' }}>
                                {editingId && (
                                    <button type="button" className="btn btn-danger" onClick={handleDelete} style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }}>
                                        Delete
                                    </button>
                                )}
                                <div style={{ display: 'flex', gap: '1rem', marginLeft: 'auto' }}>
                                    <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
                                    <button type="submit" className="btn btn-primary">Save Claim</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
