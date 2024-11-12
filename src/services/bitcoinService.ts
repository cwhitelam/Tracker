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
    private readonly API_KEY = import.meta.env.VITE_API_KEY;
    private readonly BASE_URL = import.meta.env.VITE_API_URL;
    private cache: Map<string, CacheItem<any>> = new Map();
    private readonly CACHE_DURATION = 600000; // Increase to 10 minutes

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

    async getBitcoinData(startDate: Date): Promise<BitcoinData | null> {
        const cacheKey = 'bitcoinData';
        const cached = this.getCached<BitcoinData>(cacheKey);

        if (cached !== null) {
            console.log('Using cached bitcoin data');
            return cached;
        }

        console.log('Fetching fresh bitcoin data');

        try {
            // Combine all API calls into a single Promise.all to be more efficient
            const [currentResponse, todayResponse, historyResponse] = await Promise.all([
                fetch(`${this.BASE_URL}/price?fsym=BTC&tsyms=USD`, {
                    headers: { 'authorization': `Apikey ${this.API_KEY}` }
                }),
                fetch(`${this.BASE_URL}/v2/histohour?fsym=BTC&tsym=USD&limit=24`, {
                    headers: { 'authorization': `Apikey ${this.API_KEY}` }
                }),
                fetch(`${this.BASE_URL}/v2/histoday?fsym=BTC&tsym=USD&limit=${
                    Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                }`, {
                    headers: { 'authorization': `Apikey ${this.API_KEY}` }
                })
            ]);

            // Log responses for debugging
            console.log('Current Response:', await currentResponse.clone().text());
            console.log('Today Response:', await todayResponse.clone().text());
            console.log('History Response:', await historyResponse.clone().text());

            // Check if any requests failed
            if (!currentResponse.ok || !todayResponse.ok || !historyResponse.ok) {
                throw new Error('One or more API requests failed');
            }

            // Parse all responses
            const [currentData, todayData, historyData] = await Promise.all([
                currentResponse.json(),
                todayResponse.json(),
                historyResponse.json()
            ]);

            // Validate data structure
            if (!currentData?.USD) {
                throw new Error('Invalid current price data');
            }

            if (!todayData?.Data?.Data?.[0]?.open) {
                throw new Error('Invalid today data');
            }

            if (!historyData?.Data?.Data) {
                throw new Error('Invalid history data');
            }

            const currentPrice = currentData.USD;
            const openPrice = todayData.Data.Data[0].open;
            const dailyChange = currentPrice - openPrice;

            const priceHistory = historyData.Data.Data.map((item: any) => ({
                date: new Date(item.time * 1000).toLocaleDateString(),
                price: item.close
            }));

            const bitcoinData: BitcoinData = {
                currentPrice,
                dailyChange,
                priceHistory
            };

            this.setCache(cacheKey, bitcoinData);
            return bitcoinData;

        } catch (error) {
            console.error('Error fetching bitcoin data:', error);
            console.error('API Key used:', this.API_KEY);
            console.error('Base URL used:', this.BASE_URL);
            return null;
        }
    }
}

export const bitcoinService = new BitcoinService();
