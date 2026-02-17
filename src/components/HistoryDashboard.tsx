import { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useInventory } from '../hooks/useInventory';
import { format, isSameDay, isSameWeek, isSameMonth, isSameYear, parseISO } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';


type ViewMode = 'daily' | 'weekly' | 'monthly' | 'annual' | 'all-time';

export default function HistoryDashboard() {
    const { transactions, stores, inventory, managedBrands } = useInventory();
    const [date, setDate] = useState<Date>(new Date());
    const [activeStartDate, setActiveStartDate] = useState<Date | undefined>(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('all-time');
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

    // Unique brands for filter
    const uniqueBrands = useMemo(() => Array.from(new Set([
        ...managedBrands,
        ...inventory.map(t => t.brand)
    ])).sort(), [inventory, managedBrands]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const matchesStore = selectedStoreId ? t.storeId === selectedStoreId : true;
            if (!matchesStore) return false;

            // Brand Filter
            if (selectedBrand) {
                const tyre = inventory.find(i => i.id === t.tyreId);
                if (!tyre || tyre.brand !== selectedBrand) return false;
            }

            // Type Filter
            if (filterType !== 'ALL' && t.type !== filterType) return false;

            const tDate = parseISO(t.date);
            switch (viewMode) {
                case 'daily': return isSameDay(tDate, date);
                case 'weekly': return isSameWeek(tDate, date);
                case 'monthly': return isSameMonth(tDate, date);
                case 'annual': return isSameYear(tDate, date);
                case 'all-time': return true;
                default: return false;
            }
        });
    }, [transactions, date, viewMode, selectedStoreId, selectedBrand, inventory, filterType]);

    const stats = useMemo(() => {
        let inCount = 0;
        let outCount = 0;
        filteredTransactions.forEach(t => {
            if (t.type === 'IN') inCount += t.quantity;
            else outCount += t.quantity;
        });
        return { inCount, outCount };
    }, [filteredTransactions]);

    const getTyreDetails = (tyreId: string) => {
        return inventory.find(t => t.id === tyreId);
    };

    const getStoreName = (storeId: string) => {
        return stores.find(s => s.id === storeId)?.name || 'Unknown Store';
    };

    return (
        <div className="history-dashboard">
            {/* ... header ... */}
            <div className="page-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                <h1 className="page-title">Transaction History</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                    {/* ... selects ... */}
                    <select
                        value={selectedStoreId}
                        onChange={(e) => setSelectedStoreId(e.target.value)}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem', height: '40px', borderColor: 'var(--border-color)', minWidth: '150px' }}
                    >
                        <option value="">All Stores</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>

                    <select
                        value={selectedBrand}
                        onChange={(e) => setSelectedBrand(e.target.value)}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem', height: '40px', borderColor: 'var(--border-color)', minWidth: '150px' }}
                    >
                        <option value="">All Brands</option>
                        {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>

                    <div className="view-controls" style={{ marginLeft: 'auto' }}>
                        {(['daily', 'weekly', 'monthly', 'annual', 'all-time'] as ViewMode[]).map(mode => (
                            <button
                                key={mode}
                                className={`btn ${viewMode === mode ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => {
                                    setViewMode(mode);
                                    setSelectedTransactionId(null); // Clear selection on view change
                                }}
                                style={{ textTransform: 'capitalize' }}
                            >
                                {mode.replace('-', ' ')}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="history-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
                <div className="calendar-section card-bg" style={{ background: 'white', padding: '1.5rem', borderRadius: '0.75rem', boxShadow: 'var(--shadow)' }}>
                    <Calendar
                        onChange={(value) => {
                            setDate(value as Date);
                            setSelectedTransactionId(null);
                        }}
                        value={date}
                        activeStartDate={activeStartDate}
                        onActiveStartDateChange={({ activeStartDate }) => setActiveStartDate(activeStartDate || undefined)}
                        onClickYear={(value) => { setDate(value); setActiveStartDate(value); setViewMode('monthly'); }}
                        onClickMonth={(value) => { setDate(value); setActiveStartDate(value); setViewMode('daily'); }}
                        onClickDay={(value) => { setDate(value); setActiveStartDate(value); setViewMode('daily'); }}
                        view={viewMode === 'annual' || viewMode === 'all-time' ? 'decade' : viewMode === 'monthly' ? 'year' : 'month'}
                    />

                    <div className="summary-stats" style={{ marginTop: '1.5rem' }}>
                        <h3 className="section-title">Summary ({viewMode === 'all-time' ? 'All Time' : format(date, viewMode === 'daily' ? 'MMM d, yyyy' : viewMode === 'monthly' ? 'MMMM yyyy' : viewMode === 'annual' ? 'yyyy' : "'Week of' MMM d")})</h3>
                        <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span>Total In:</span>
                            <span className="text-danger" style={{ fontWeight: 'bold', color: 'var(--danger)' }}>+{stats.inCount}</span>
                        </div>
                        <div className="stat-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Total Out:</span>
                            <span className="text-success" style={{ fontWeight: 'bold', color: 'var(--success)' }}>-{stats.outCount}</span>
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <h3 className="section-title">Filter History</h3>
                        <button
                            className={`btn ${filterType === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilterType('ALL')}
                            style={{ width: '100%', justifyContent: 'center' }}
                        >
                            Show All
                        </button>
                        <button
                            className={`btn ${filterType === 'IN' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilterType('IN')}
                            style={{ width: '100%', justifyContent: 'center', borderColor: filterType === 'IN' ? 'var(--danger)' : undefined, background: filterType === 'IN' ? 'var(--danger)' : undefined }}
                        >
                            <ArrowDownLeft size={16} /> Stock Added
                        </button>
                        <button
                            className={`btn ${filterType === 'OUT' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilterType('OUT')}
                            style={{ width: '100%', justifyContent: 'center', borderColor: filterType === 'OUT' ? 'var(--success)' : undefined, background: filterType === 'OUT' ? 'var(--success)' : undefined }}
                        >
                            <ArrowUpRight size={16} /> Stock Sold
                        </button>
                    </div>
                </div>

                <div className="transactions-list-section">
                    <h3 className="section-title">Transactions</h3>
                    {filteredTransactions.length === 0 ? (
                        <p className="empty-state">No transactions found for this period.</p>
                    ) : (
                        <div className="transactions-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {filteredTransactions.map(t => {
                                const tyre = getTyreDetails(t.tyreId);
                                const isSelected = t.id === selectedTransactionId;
                                return (
                                    <div
                                        key={t.id}
                                        className="transaction-card"
                                        onClick={() => {
                                            const d = parseISO(t.date);
                                            setDate(d);
                                            setActiveStartDate(d);
                                            setViewMode('daily');
                                            setSelectedTransactionId(t.id);
                                        }}
                                        style={{
                                            background: isSelected ? '#eff6ff' : 'white', // Highlight background
                                            padding: '1rem',
                                            borderRadius: '0.5rem',
                                            borderLeft: `4px solid ${t.type === 'IN' ? 'var(--danger)' : 'var(--success)'}`,
                                            border: isSelected ? '2px solid var(--primary)' : undefined, // Highlight border
                                            borderLeftWidth: isSelected ? '4px' : '4px', // Keep left border thick
                                            boxShadow: isSelected ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'var(--shadow-sm)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            transform: isSelected ? 'scale(1.01)' : 'scale(1)'
                                        }}
                                        onMouseEnter={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!isSelected) {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                            }
                                        }}
                                    >
                                        <div className="t-info">
                                            <div style={{ marginBottom: '0.5rem' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '999px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    backgroundColor: t.type === 'IN' ? '#fecaca' : '#bbf7d0', // Red-200 / Green-200
                                                    color: t.type === 'IN' ? '#b91c1c' : '#15803d', // Red-700 / Green-700
                                                    border: `1px solid ${t.type === 'IN' ? 'var(--danger)' : 'var(--success)'}`
                                                }}>
                                                    {t.type === 'IN' ? <ArrowDownLeft size={14} strokeWidth={2.5} /> : <ArrowUpRight size={14} strokeWidth={2.5} />}
                                                    {t.type === 'IN' ? 'Stock Added' : 'Stock Sold'}
                                                </span>
                                            </div>

                                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                                                {tyre ? `${tyre.brand} ${tyre.size}` : 'Unknown Tyre'}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {format(parseISO(t.date), 'MMM d, yyyy')} • {getStoreName(t.storeId)} • {format(parseISO(t.date), 'h:mm a')}
                                            </div>
                                        </div>
                                        <div className="t-qty" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                            {t.quantity}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
