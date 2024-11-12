export interface BitcoinPriceHistory {
    date: string;
    price: number;
}

export interface BitcoinData {
    currentPrice: number;
    dailyChange: number;
    priceHistory: BitcoinPriceHistory[];
}

interface CacheItem<T> {
    value: T;
    timestamp: number;
}

class BitcoinService {
    private readonly INITIAL_PRICE = Number(import.meta.env.VITE_INITIAL_PRICE);
    private readonly CACHE_DURATION = 900000; // 15 minutes
    private readonly CMC_API = '/api/crypto';
    private cache: Map<string, CacheItem<any>> = new Map();

    private getCached<T>(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;
        if (Date.now() - item.timestamp > this.CACHE_DURATION) {
            console.log('Cache expired for:', key);
            this.cache.delete(key);
            return null;
        }
        console.log('Cache hit for:', key);
        return item.value;
    }

    private setCache<T>(key: string, value: T): void {
        console.log('Setting cache for:', key);
        this.cache.set(key, { value, timestamp: Date.now() });
    }

    private async getCurrentPriceAndChange(): Promise<{ price: number; change: number }> {
        const cacheKey = 'priceData';
        const cached = this.getCached<{ price: number; change: number }>(cacheKey);

        if (cached !== null) {
            return cached;
        }

        try {
            const response = await fetch(
                `${this.CMC_API}/price`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch current price: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API Response:', data);
            
            const priceData = {
                price: data.price,
                change: data.change
            };
            
            this.setCache(cacheKey, priceData);
            return priceData;
        } catch (error) {
            console.error('Error fetching price data:', error);
            throw error;
        }
    }

    private generateHistoricalPrices(startDate: Date, currentPrice: number): BitcoinPriceHistory[] {
        const days = Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const prices: BitcoinPriceHistory[] = [];
        
        // Just use the current price for all entries since we don't have historical data
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            
            prices.push({
                date: date.toLocaleDateString(),
                price: currentPrice
            });
        }

        return prices;
    }

    async getBitcoinData(startDate: Date): Promise<BitcoinData | null> {
        const cacheKey = 'bitcoinData';
        const cached = this.getCached<BitcoinData>(cacheKey);

        if (cached !== null) {
            return cached;
        }

        try {
            const { price: currentPrice, change } = await this.getCurrentPriceAndChange();
            
            // Calculate actual daily change in USD based on percentage
            const dailyChange = (currentPrice * change) / 100;

            const priceHistory = this.generateHistoricalPrices(startDate, currentPrice);

            const bitcoinData: BitcoinData = {
                currentPrice,
                dailyChange,
                priceHistory
            };

            this.setCache(cacheKey, bitcoinData);
            return bitcoinData;

        } catch (error) {
            console.error('Error generating bitcoin data:', error);
            // You might want to show an error to the user instead of returning null
            throw error;
        }
    }
}

export const bitcoinService = new BitcoinService();
