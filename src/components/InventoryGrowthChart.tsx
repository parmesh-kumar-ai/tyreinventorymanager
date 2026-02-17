import { useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { format, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, eachMonthOfInterval, eachDayOfInterval, min as minDate, max as maxDate } from 'date-fns';
import type { Transaction } from '../types';

interface InventoryGrowthChartProps {
    transactions: Transaction[];
}

export default function InventoryGrowthChart({ transactions, timeRange = 'all' }: InventoryGrowthChartProps & { timeRange?: 'year' | 'month' | 'all' }) {
    const data = useMemo(() => {
        if (transactions.length === 0) return [];

        let start: Date, end: Date, dateFormat: string, labelFormat: (d: Date) => string;

        const now = new Date();

        if (timeRange === 'month') {
            start = startOfMonth(now);
            end = endOfMonth(now);
            dateFormat = 'yyyy-MM-dd';
            labelFormat = (d) => format(d, 'MMM d');
        } else if (timeRange === 'year') {
            start = startOfYear(now);
            end = endOfYear(now);
            dateFormat = 'yyyy-MM';
            labelFormat = (d) => format(d, 'MMM');
        } else {
            // All Time
            const dates = transactions.map(t => parseISO(t.date));
            start = startOfMonth(minDate(dates));
            end = endOfMonth(maxDate(dates));
            dateFormat = 'yyyy-MM';
            labelFormat = (d) => format(d, 'MMM yyyy');
        }

        // Generate intervals
        const intervals = timeRange === 'month'
            ? eachDayOfInterval({ start, end })
            : eachMonthOfInterval({ start, end });

        const keys = intervals.map(d => format(d, dateFormat));

        // Initialize buckets
        const buckets: Record<string, { in: number, out: number }> = {};
        keys.forEach(k => buckets[k] = { in: 0, out: 0 });

        // Aggregate transactions
        transactions.forEach(t => {
            const tDate = parseISO(t.date);
            // Filter out if not in range
            if (tDate < start || tDate > end) return;

            const key = format(tDate, dateFormat);
            if (buckets[key]) {
                if (t.type === 'IN') buckets[key].in += t.quantity;
                if (t.type === 'OUT') buckets[key].out += t.quantity;
            }
        });

        // Calculate Cumulative
        // IMPORTANT: For 'all', we start from 0.
        // For 'year' or 'month', we should probably start from the stock *at that time*, 
        // OR just show the *net change* during that period?
        // Usually, "Growth" implies total stock. 
        // If we filter by 'Month', showing standard 0-based growth might be misleading if they have 1000 stock.
        // Let's calculate initial stock before the start date.

        let initialStock = 0;

        if (timeRange !== 'all') {
            transactions.forEach(t => {
                const tDate = parseISO(t.date);
                if (tDate < start) {
                    if (t.type === 'IN') initialStock += t.quantity;
                    if (t.type === 'OUT') initialStock -= t.quantity;
                }
            });
        }

        let currentStock = initialStock;
        let currentSoldPeriod = 0;

        return keys.map(key => {
            const { in: inQty, out: outQty } = buckets[key];
            currentStock += (inQty - outQty);
            currentSoldPeriod += outQty;

            return {
                date: key,
                displayDate: labelFormat(parseISO(key)), // Pre-format for XAxis
                stock: Math.max(0, currentStock),
                sold: currentSoldPeriod
            };
        });

    }, [transactions, timeRange]);

    if (data.length === 0) return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            Not enough data for growth chart
        </div>
    );

    return (
        <div className="chart-container" style={{ height: '100%', minHeight: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                    />
                    <YAxis
                        tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="stock"
                        name="Total Stock Available"
                        stroke="var(--danger)"
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'var(--danger)', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: 'var(--danger)' }}
                        isAnimationActive={false}
                    />
                    <Line
                        type="monotone"
                        dataKey="sold"
                        name="Total Sold Inventory"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: '#10b981' }}
                        isAnimationActive={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
