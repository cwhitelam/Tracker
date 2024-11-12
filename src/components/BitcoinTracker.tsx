import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { bitcoinService } from '../services/bitcoinService';
import { BsSunFill, BsMoonFill } from 'react-icons/bs';
import { IoStatsChart, IoInformationCircle, IoClose } from 'react-icons/io5';
import { PriceChart } from './PriceChart';
import type { BitcoinData } from '../services/bitcoinService';
import { AnimatingNumber } from './AnimatingNumber';
import { FaBitcoin } from 'react-icons/fa';
import { HiArrowTrendingUp, HiArrowTrendingDown } from 'react-icons/hi2';

// Replace hardcoded values with environment variables
const AMOUNT_OF_BITCOIN = Number(import.meta.env.VITE_AMOUNT_OF_BITCOIN);
const INITIAL_INVESTMENT = Number(import.meta.env.VITE_INITIAL_INVESTMENT);
const BIRTH_DATE = new Date(import.meta.env.VITE_BIRTH_DATE);

export function BitcoinTracker() {
    const [bitcoinData, setBitcoinData] = useState<BitcoinData | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(() =>
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );
    const [showChart, setShowChart] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const fetchingRef = useRef(false);

    const currentDateTime = new Date();

    // Helper function for birthday suffix
    const getSuffix = (number: number): string => {
        const lastTwo = number % 100;
        if (lastTwo === 11 || lastTwo === 12 || lastTwo === 13) return 'th';
        const lastDigit = number % 10;
        switch (lastDigit) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    useEffect(() => {
        const fetchBitcoinData = async () => {
            if (fetchingRef.current) return;
            fetchingRef.current = true;

            console.log('Fetching bitcoin data at:', new Date().toISOString());
            const data = await bitcoinService.getBitcoinData(BIRTH_DATE);
            if (data) {
                setBitcoinData(data);
            }
            fetchingRef.current = false;
        };

        fetchBitcoinData();
        const interval = setInterval(fetchBitcoinData, 30000);

        return () => {
            clearInterval(interval);
            fetchingRef.current = false;
        };
    }, []);

    // Add effect to handle dark mode
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Calculate derived values from bitcoinData
    const currentPrice = bitcoinData?.currentPrice ?? null;
    const dailyChange = bitcoinData ? bitcoinData.dailyChange * AMOUNT_OF_BITCOIN : null;
    const currentValue = currentPrice ? AMOUNT_OF_BITCOIN * currentPrice : null;
    const profitLoss = currentValue ? currentValue - INITIAL_INVESTMENT : null;
    const profitLossPercentage = profitLoss ? (profitLoss / INITIAL_INVESTMENT) * 100 : null;

    const isBirthday = currentDateTime.getMonth() === 7 && currentDateTime.getDate() === 11;
    const birthdayYear = currentDateTime.getFullYear() - 2023;

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="container mx-auto px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mx-auto max-w-2xl rounded-xl shadow-lg p-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                    {isBirthday ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="space-y-2 text-center"
                        >
                            <h3 className="text-2xl font-bold">
                                Happy {birthdayYear}{getSuffix(birthdayYear)} Birthday Jack! 🎉
                            </h3>
                            <p className="text-lg">
                                Your <span className="text-bitcoin">₿itcoin</span> is now worth:
                            </p>
                        </motion.div>
                    ) : (
                        <h3 className="text-2xl font-bold flex items-center justify-center gap-2">
                            Jack's <FaBitcoin className="text-bitcoin" /> is worth:
                        </h3>
                    )}

                    <div className="mt-6 space-y-4 text-center">
                        {currentValue === null ? (
                            <p className="text-xl">Loading...</p>
                        ) : (
                            <>
                                <div className="text-6xl font-bold">
                                    <AnimatingNumber value={currentValue} />
                                </div>

                                <div className="text-2xl font-bold text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center">
                                    <div className="flex items-center justify-center space-x-2">
                                        <span className="flex items-center">
                                            1<FaBitcoin className="text-bitcoin mx-1 text-2xl" />
                                        </span>
                                        <span>=</span>
                                        <AnimatingNumber
                                            value={currentPrice || 0}
                                            prefix="$"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    {/* Total Return Tile */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className={`px-4 py-3 rounded-lg ${profitLoss && profitLoss >= 0
                                            ? 'bg-green-100 dark:bg-green-900/30'
                                            : 'bg-red-100 dark:bg-red-900/30'
                                            }`}
                                    >
                                        <h4 className="text-xs sm:text-sm font-semibold mb-2 flex items-center justify-center">
                                            <span className="block sm:hidden mr-1">
                                                {profitLoss && profitLoss >= 0 ?
                                                    <HiArrowTrendingUp className="text-sm text-green-600 dark:text-green-400" /> :
                                                    <HiArrowTrendingDown className="text-sm text-red-600 dark:text-red-400" />
                                                }
                                            </span>
                                            Total
                                        </h4>
                                        <div className={`text-4xl font-bold ${profitLoss && profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            <div className="flex items-center justify-center">
                                                {profitLoss && profitLoss >= 0 ?
                                                    <HiArrowTrendingUp className="mr-1 text-3xl hidden sm:block" /> :
                                                    <HiArrowTrendingDown className="mr-1 text-3xl hidden sm:block" />
                                                }
                                                <AnimatingNumber
                                                    value={Math.abs(profitLoss || 0)}
                                                    prefix={profitLoss && profitLoss >= 0 ? "$" : "-$"}
                                                />
                                            </div>
                                            <div className="text-lg mt-1">
                                                ({profitLossPercentage?.toFixed(2)}%)
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Daily Change Tile */}
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        className={`px-4 py-3 rounded-lg ${dailyChange && dailyChange >= 0
                                            ? 'bg-green-100 dark:bg-green-900/30'
                                            : 'bg-red-100 dark:bg-red-900/30'
                                            }`}
                                    >
                                        <h4 className="text-xs sm:text-sm font-semibold mb-2 flex items-center justify-center">
                                            <span className="block sm:hidden mr-1">
                                                {dailyChange && dailyChange >= 0 ?
                                                    <HiArrowTrendingUp className="text-sm text-green-600 dark:text-green-400" /> :
                                                    <HiArrowTrendingDown className="text-sm text-red-600 dark:text-red-400" />
                                                }
                                            </span>
                                            Today
                                        </h4>
                                        <div className={`text-4xl font-bold ${dailyChange && dailyChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            <div className="flex items-center justify-center">
                                                {dailyChange && dailyChange >= 0 ?
                                                    <HiArrowTrendingUp className="mr-1 text-3xl hidden sm:block" /> :
                                                    <HiArrowTrendingDown className="mr-1 text-3xl hidden sm:block" />
                                                }
                                                <AnimatingNumber
                                                    value={Math.abs(dailyChange || 0)}
                                                    prefix={dailyChange && dailyChange >= 0 ? "$" : "-$"}
                                                />
                                            </div>
                                            <div className="text-lg mt-1">
                                                ({dailyChange && currentValue ? ((dailyChange / currentValue) * 100).toFixed(2) : 0}%)
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowChart(!showChart)}
                            className={`
                                px-6 py-2.5 rounded-lg font-semibold
                                transition-colors duration-200
                                flex items-center justify-center gap-2
                                border-2 ${showChart
                                    ? 'bg-bitcoin/90 text-white hover:bg-bitcoin border-bitcoin'
                                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                                }
                            `}
                        >
                            {showChart ? (
                                <>
                                    <IoClose className="text-xl" />
                                    Hide Chart
                                </>
                            ) : (
                                <>
                                    <IoStatsChart className="text-xl" />
                                    Show Chart
                                </>
                            )}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowInfo(!showInfo)}
                            className={`
                                px-6 py-2.5 rounded-lg font-semibold
                                transition-colors duration-200
                                flex items-center justify-center gap-2
                                border-2 ${showInfo
                                    ? 'bg-bitcoin/90 text-white hover:bg-bitcoin border-bitcoin'
                                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                                }
                            `}
                        >
                            {showInfo ? (
                                <>
                                    <IoClose className="text-xl" />
                                    Hide Info
                                </>
                            ) : (
                                <>
                                    <IoInformationCircle className="text-xl" />
                                    Show Info
                                </>
                            )}
                        </motion.button>
                    </div>

                    <AnimatePresence>
                        {showChart && (
                            <PriceChart
                                data={bitcoinData?.priceHistory ?? []}
                                isDarkMode={isDarkMode}
                                onClose={() => setShowChart(false)}
                            />
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {showInfo && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-8 p-4 rounded-lg bg-gray-100 dark:bg-gray-700"
                            >
                                <h4 className="font-bold mb-2">About This Bitcoin</h4>
                                <ul className="space-y-2 text-sm">
                                    <li>• Initial Investment: ${INITIAL_INVESTMENT}</li>
                                    <li>• Amount: {AMOUNT_OF_BITCOIN} BTC</li>
                                    <li>• Purchase Date: August 11, 2023</li>
                                    <li>• Days Held: {Math.floor((new Date().getTime() - BIRTH_DATE.getTime()) / (1000 * 60 * 60 * 24))}</li>
                                </ul>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.p
                        className="mt-6 italic text-sm text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        -Uncle Chris 🦅
                    </motion.p>
                </motion.div>
            </div>

            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="fixed bottom-4 right-4 p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg"
            >
                {isDarkMode ?
                    <BsSunFill className="text-yellow-400 text-2xl" /> :
                    <BsMoonFill className="text-gray-600 text-2xl" />
                }
            </motion.button>
        </div>
    );
} 