import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { IoClose } from 'react-icons/io5';
import { motion } from 'framer-motion';
import type { BitcoinPriceHistory } from '../services/bitcoinService';

interface PriceChartProps {
    data: BitcoinPriceHistory[];
    isDarkMode: boolean;
    onClose: () => void;
}

export function PriceChart({ data, isDarkMode, onClose }: PriceChartProps) {
    const quarterlyData = useMemo(() => {
        // Sort data by date in ascending order
        const sortedData = [...data].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Group by quarters and calculate average price
        const quarterMap = new Map<string, { total: number; count: number; lastPrice: number }>();
        
        sortedData.forEach(item => {
            const date = new Date(item.date);
            const quarter = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
            
            if (!quarterMap.has(quarter)) {
                quarterMap.set(quarter, { total: 0, count: 0, lastPrice: 0 });
            }
            
            const quarterData = quarterMap.get(quarter)!;
            quarterData.total += item.price;
            quarterData.count += 1;
            quarterData.lastPrice = item.price; // Keep track of the last price
        });

        // Convert to array and calculate averages
        return Array.from(quarterMap.entries())
            .map(([quarter, data]) => ({
                quarter,
                date: quarter,
                avgPrice: data.total / data.count,
                price: data.lastPrice
            }))
            .sort((a, b) => {
                const [yearA, qA] = a.quarter.split('-Q');
                const [yearB, qB] = b.quarter.split('-Q');
                return (parseInt(yearA) - parseInt(yearB)) || (parseInt(qA) - parseInt(qB));
            });
    }, [data]);

    const formatXAxis = (quarter: string) => {
        const [year, q] = quarter.split('-Q');
        return `Q${q} ${year}`;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const minPrice = Math.min(...quarterlyData.map(d => d.price));
    const maxPrice = Math.max(...quarterlyData.map(d => d.price));
    const padding = (maxPrice - minPrice) * 0.1;

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-8 p-4 rounded-lg bg-gray-100 dark:bg-gray-700"
        >
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Quarterly Performance</h3>
                <button
                    onClick={onClose}
                    className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    <IoClose className="text-xl" />
                </button>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={quarterlyData} margin={{ top: 20, right: 30, bottom: 20, left: 60 }}>
                        <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke={isDarkMode ? '#374151' : '#E5E7EB'}
                        />
                        <XAxis
                            dataKey="quarter"
                            tickFormatter={formatXAxis}
                            tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                        />
                        <YAxis
                            tickFormatter={formatCurrency}
                            domain={[minPrice - padding, maxPrice + padding]}
                            tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
                        />
                        <Tooltip
                            formatter={(value: number) => [formatCurrency(value), 'Price']}
                            labelFormatter={formatXAxis}
                            contentStyle={{
                                backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                                borderColor: isDarkMode ? '#374151' : '#E5E7EB',
                                color: isDarkMode ? '#FFFFFF' : '#000000'
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#f7931a"
                            strokeWidth={3}
                            dot={{ fill: '#f7931a', r: 4 }}
                            activeDot={{ r: 8, fill: '#f7931a' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
} 