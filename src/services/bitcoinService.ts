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
        
        // Define key price points for each quarter
        const quarterlyPrices = [
            this.INITIAL_PRICE,  // Q3 2023 (Aug)
            42000,               // Q4 2023
            45000,               // Q1 2024
            currentPrice         // Current
        ];
        
        // Generate daily prices with smoother transitions between quarters
        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            
            // Determine which quarter we're in
            const progress = i / days;
            const quarterIndex = Math.min(
                Math.floor(progress * quarterlyPrices.length),
                quarterlyPrices.length - 1
            );
            
            // Get current and next quarter prices
            const currentQuarterPrice = quarterlyPrices[quarterIndex];
            const nextQuarterPrice = quarterlyPrices[Math.min(quarterIndex + 1, quarterlyPrices.length - 1)];
            
            // Calculate progress within current quarter
            const quarterProgress = (progress * quarterlyPrices.length) % 1;
            
            // Create smooth transition between quarters
            const basePrice = currentQuarterPrice + 
                (nextQuarterPrice - currentQuarterPrice) * quarterProgress;
            
            // Add smaller daily variations
            const dailyVariation = (Math.random() - 0.5) * (basePrice * 0.02); // 2% max variation
            
            prices.push({
                date: date.toISOString(),
                price: Math.max(basePrice + dailyVariation, 0)
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
