import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

interface CoinMarketCapResponse {
    status: {
        timestamp: string;
        error_code: number;
        error_message: string | null;
        elapsed: number;
        credit_count: number;
    };
    data: {
        BTC: {
            quote: {
                USD: {
                    price: number;
                    percent_change_24h: number;
                }
            }
        }
    }
}

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const CMC_API = 'https://pro-api.coinmarketcap.com/v1';
const API_KEY = process.env.VITE_CMC_API_KEY;

if (!API_KEY) {
    console.error('Missing CoinMarketCap API key in environment variables');
    process.exit(1);
}

app.get('/api/crypto/price', async (req, res) => {
    try {
        console.log('Fetching price data from CoinMarketCap...');
        const response = await fetch(
            `${CMC_API}/cryptocurrency/quotes/latest?symbol=BTC&convert=USD`,
            {
                method: 'GET',
                headers: {
                    'X-CMC_PRO_API_KEY': API_KEY,
                    'Accept': 'application/json',
                    'Accept-Encoding': 'deflate, gzip'
                }
            }
        );

        const data = await response.json() as CoinMarketCapResponse;
        console.log('Received data from CoinMarketCap:', data);

        // Check for API error response
        if (data.status?.error_code && data.status.error_code !== 0) {
            throw new Error(`CoinMarketCap API error: ${data.status.error_message}`);
        }

        if (!data.data?.BTC?.quote?.USD) {
            throw new Error('Unexpected API response format');
        }

        const btcData = data.data.BTC.quote.USD;
        res.json({
            price: btcData.price,
            change: btcData.percent_change_24h
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch price data',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 