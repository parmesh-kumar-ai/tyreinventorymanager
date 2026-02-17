import { useMemo, useState } from 'react';
import { ShoppingCart, PackagePlus, BarChart3, TrendingUp } from 'lucide-react';
import InventoryCharts from './InventoryCharts';
import InventoryGrowthChart from './InventoryGrowthChart';
import type { Tyre, Transaction } from '../types';

interface DashboardProps {
    inventory: Tyre[];
    transactions: Transaction[];
    managedBrands: string[];
}

export default function Dashboard({ inventory, transactions, managedBrands }: DashboardProps) {
    const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
    const [chartFilter, setChartFilter] = useState<'year' | 'month' | 'all'>('year');

    // Calculate stock per brand
    const brandStock = useMemo(() => {
        const counts: Record<string, number> = {};
        inventory.forEach(t => {
            counts[t.brand] = (counts[t.brand] || 0) + t.quantity;
        });
        return counts;
    }, [inventory]);

    // Top 5 Highest Stock
    const topStock = useMemo(() => {
        return [...inventory].sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    }, [inventory]);

    // Transaction Stats & Top Sold List
    const { transactionStats, topSoldList } = useMemo(() => {
        const soldCounts: Record<string, number> = {};
        const stockCounts: Record<string, number> = {};

        transactions.forEach(t => {
            const key = t.tyreId;
            if (t.type === 'OUT') {
                soldCounts[key] = (soldCounts[key] || 0) + t.quantity;
            } else {
                stockCounts[key] = (stockCounts[key] || 0) + t.quantity;
            }
        });

        // Helper to get top item
        const getTopItem = (counts: Record<string, number>) => {
            const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
            if (sorted.length === 0) return null;
            const [tyreId, qty] = sorted[0];
            const tyre = inventory.find(t => t.id === tyreId);
            const tyreName = tyre ? `${tyre.brand} ${tyre.size}` : 'Deleted Item';
            return { name: tyreName, qty };
        };

        // Get Top 5 Sold List
        const soldList = Object.entries(soldCounts)
            .map(([tyreId, qty]) => {
                const tyre = inventory.find(t => t.id === tyreId);
                return {
                    id: tyreId,
                    brand: tyre?.brand || 'Unknown',
                    size: tyre?.size || 'Unknown',
                    qty
                };
            })
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        return {
            transactionStats: {
                topSold: getTopItem(soldCounts),
                topRestocked: getTopItem(stockCounts)
            },
            topSoldList: soldList
        };
    }, [transactions, inventory]);

    // Combine managed brands with any other brands existing in inventory (fallback)
    const displayBrands = useMemo(() => {
        return Array.from(new Set([...managedBrands, ...Object.keys(brandStock)])).sort();
    }, [managedBrands, brandStock]);

    return (
        <div className="dashboard-container">

            {/* Row 1: Brand Cards (Click to Filter) */}
            <div className="section-title">Stock by Brand <span style={{ fontSize: '0.875rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>(Click to View Details)</span></div>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))' }}>
                {displayBrands.map(brand => (
                    <div
                        key={brand}
                        className={`stat-card ${selectedBrand === brand ? 'blue' : ''}`}
                        style={{ padding: '1rem', cursor: 'pointer', border: selectedBrand === brand ? '2px solid var(--primary)' : '1px solid var(--border-color)' }}
                        onClick={() => setSelectedBrand(selectedBrand === brand ? null : brand)}
                    >
                        <div className="stat-content">
                            <p className="stat-label">{brand}</p>
                            <p className="stat-value">{brandStock[brand] || 0}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Dynamic Chart */}
            <InventoryCharts inventory={inventory} selectedBrand={selectedBrand} />


            {/* Inventory Growth Chart */}
            <div className="section-card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
                        <TrendingUp size={20} />
                        Inventory Growth (Net)
                    </h3>
                    <div className="view-controls">
                        <button
                            className={`btn ${chartFilter === 'month' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setChartFilter('month')}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        >
                            This Month
                        </button>
                        <button
                            className={`btn ${chartFilter === 'year' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setChartFilter('year')}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        >
                            This Year
                        </button>
                        <button
                            className={`btn ${chartFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setChartFilter('all')}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        >
                            All Time
                        </button>
                    </div>
                </div>
                <div style={{ height: '300px' }}>
                    <InventoryGrowthChart transactions={transactions} timeRange={chartFilter} />
                </div>
            </div>

            {/* Inventory Highlights */}
            <div className="section-title" style={{ marginTop: '2rem' }}>Inventory Performance</div>
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

                {/* Top Sold */}
                <div className="stat-card green">
                    <div className="icon-wrapper">
                        <ShoppingCart className="icon" />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Top Selling Item</p>
                        {transactionStats.topSold ? (
                            <>
                                <p className="stat-value">{transactionStats.topSold.qty} Sold</p>
                                <p className="stat-desc">{transactionStats.topSold.name}</p>
                            </>
                        ) : (
                            <p className="stat-value">-</p>
                        )}
                    </div>
                </div>

                {/* Top Restocked */}
                <div className="stat-card blue">
                    <div className="icon-wrapper">
                        <PackagePlus className="icon" />
                    </div>
                    <div className="stat-content">
                        <p className="stat-label">Top Purchasing Item</p>
                        {transactionStats.topRestocked ? (
                            <>
                                <p className="stat-value">{transactionStats.topRestocked.qty} Added</p>
                                <p className="stat-desc">{transactionStats.topRestocked.name}</p>
                            </>
                        ) : (
                            <p className="stat-value">-</p>
                        )}
                    </div>
                </div>

                {/* Low Stock Alert - REMOVED per request */}
                {/* <div className="stat-card orange">...</div> */}
            </div>

            {/* Two Column Grid: Highest Stock vs Top Sold */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 1fr', gap: '2rem', marginTop: '2rem' }} className="responsive-grid">
                {/* ... (rest of tables) ... */}

                {/* Top 5 Highest Stock */}
                <div className="section-card">
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={20} />
                        Top 5 Highest Stock
                    </h3>
                    <div className="table-container">
                        <table className="inventory-table">
                            <thead>
                                <tr>
                                    <th>Brand</th>
                                    <th>Size</th>
                                    <th>Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topStock.map(t => (
                                    <tr key={t.id}>
                                        <td className="font-medium">{t.brand}</td>
                                        <td>{t.size}</td>
                                        <td style={{ fontWeight: 'bold' }}>{t.quantity}</td>
                                    </tr>
                                ))}
                                {topStock.length === 0 && (
                                    <tr><td colSpan={3} className="text-center">No inventory available</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top 5 Sold Items */}
                <div className="section-card">
                    <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={20} />
                        Top 5 Best Sellers
                    </h3>
                    <div className="table-container">
                        <table className="inventory-table">
                            <thead>
                                <tr>
                                    <th>Brand</th>
                                    <th>Size</th>
                                    <th>Sold</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topSoldList.map((t, idx) => (
                                    <tr key={`${t.id}-${idx}`}>
                                        <td className="font-medium">{t.brand}</td>
                                        <td>{t.size}</td>
                                        <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>{t.qty}</td>
                                    </tr>
                                ))}
                                {topSoldList.length === 0 && (
                                    <tr><td colSpan={3} className="text-center">No sales data yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
