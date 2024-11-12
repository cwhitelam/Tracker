import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { IoClose } from 'react-icons/io5';
import type { BitcoinPriceHistory } from '../services/bitcoinService';

interface PriceChartProps {
  data: BitcoinPriceHistory[];
  isDarkMode: boolean;
  onClose: () => void;
}

export function PriceChart({ data, isDarkMode, onClose }: PriceChartProps) {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  // Filter data to only show the last 90 days (quarter)
  const quarterlyData = data.slice(-90);
  
  // Find min and max prices for reference lines
  const prices = quarterlyData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Format dates to show quarters
  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const year = date.getFullYear().toString().slice(-2);
    return `Q${quarter} '${year}`;
  };

  // Group data points by quarter for better tick placement
  const getQuarterKey = (date: string) => {
    const d = new Date(date);
    const quarter = Math.floor(d.getMonth() / 3) + 1;
    const year = d.getFullYear();
    return `${year}-Q${quarter}`;
  };

  const uniqueQuarters = [...new Set(quarterlyData.map(d => getQuarterKey(d.date)))];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="relative w-full mt-8"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-lg">Quarterly Performance</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <IoClose className="text-xl" />
        </button>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={quarterlyData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              ticks={uniqueQuarters.map(q => {
                const [year, quarter] = q.split('-Q');
                const month = (parseInt(quarter) - 1) * 3;
                return new Date(parseInt(year), month, 1).toLocaleDateString();
              })}
              tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
            />
            <YAxis 
              tickFormatter={formatCurrency}
              domain={[minPrice * 0.95, maxPrice * 1.05]}
              tick={{ fill: isDarkMode ? '#9CA3AF' : '#4B5563' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                border: 'none',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: isDarkMode ? '#E5E7EB' : '#1F2937' }}
              formatter={(value: number) => [formatCurrency(value), 'Price']}
              labelFormatter={(label) => {
                const date = new Date(label);
                return new Intl.DateTimeFormat('en-US', { 
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                }).format(date);
              }}
            />
            <ReferenceLine 
              y={minPrice} 
              strokeDasharray="3 3" 
              stroke={isDarkMode ? '#4B5563' : '#9CA3AF'} 
            />
            <ReferenceLine 
              y={maxPrice} 
              strokeDasharray="3 3" 
              stroke={isDarkMode ? '#4B5563' : '#9CA3AF'} 
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#f7931a"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#f7931a' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
} 