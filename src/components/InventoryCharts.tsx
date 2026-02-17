import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import type { Tyre } from '../types';
import { BRAND_COLORS } from '../constants';

interface InventoryChartsProps {
    inventory: Tyre[];
    selectedBrand?: string | null;
}

// Generate a consistent HSL color from a string
const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    const s = 65; // High saturation
    const l = 50; // Medium lightness
    return `hsl(${h}, ${s}%, ${l}%)`;
};

export default function InventoryCharts({ inventory, selectedBrand }: InventoryChartsProps) {
    // Calculate data based on selection
    const chartData = useMemo(() => {
        if (selectedBrand) {
            // Show sizes for the selected brand
            const brandTyres = inventory.filter(t => t.brand === selectedBrand);
            return brandTyres.map(t => ({
                name: t.size,
                value: t.quantity
            }));
        } else {
            // Show total stock by brand
            const counts: Record<string, number> = {};
            inventory.forEach(t => {
                counts[t.brand] = (counts[t.brand] || 0) + t.quantity;
            });
            return Object.entries(counts).map(([name, value]) => ({ name, value }));
        }
    }, [inventory, selectedBrand]);

    if (inventory.length === 0) return null;

    return (
        <div className="charts-grid">
            <div className="chart-card" style={{ gridColumn: '1 / -1' }}>
                <h3 className="chart-title">
                    {selectedBrand ? `Stock Breakdown: ${selectedBrand}` : 'Stock by Brand'}
                </h3>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20 }}>
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} label={{ position: 'top' }} isAnimationActive={false}>
                                {chartData.map((entry, index) => {
                                    const color = selectedBrand
                                        ? (BRAND_COLORS[selectedBrand] || stringToColor(selectedBrand))
                                        : (BRAND_COLORS[entry.name] || stringToColor(entry.name));

                                    return <Cell key={`cell-${index}`} fill={color} />;
                                })}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
