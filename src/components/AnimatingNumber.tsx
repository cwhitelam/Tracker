import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { usePrevious } from "../hooks/usePrevious";

function formatForDisplay(number = 0) {
    return number.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).split("").reverse();
}

function DecimalColumn() {
    return (
        <span className="inline-block align-baseline">.</span>
    );
}

function CommaColumn() {
    return (
        <span className="inline-block align-baseline">,</span>
    );
}

function NumberColumn({ digit, delta }: { digit: string; delta: string | null }) {
    const [position, setPosition] = useState(0);
    const [animationClass, setAnimationClass] = useState<string | null>(null);
    const previousDigit = usePrevious(digit);
    const columnContainer = useRef<HTMLDivElement>(null);

    const setColumnToNumber = (number: string) => {
        if (columnContainer.current) {
            const digitHeight = columnContainer.current.clientHeight;
            setPosition(-(parseInt(number, 10) * digitHeight));
        }
    };

    useEffect(() => {
        setAnimationClass(previousDigit !== digit ? delta : null);
    }, [digit, delta, previousDigit]);

    useEffect(() => {
        setColumnToNumber(digit);
    }, [digit]);

    return (
        <div className="relative h-[1em] overflow-hidden inline-block align-baseline" ref={columnContainer}>
            <motion.div
                animate={{ y: position }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`absolute top-0 ${animationClass}`}
                onAnimationComplete={() => setAnimationClass("")}
            >
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <div key={num} className="h-[1em] flex items-center justify-center">
                        <span>{num}</span>
                    </div>
                ))}
            </motion.div>
            <span className="invisible">{digit}</span>
        </div>
    );
}

interface AnimatingNumberProps {
    value: number;
    prefix?: string;
}

export function AnimatingNumber({ value, prefix = "$" }: AnimatingNumberProps) {
    const numArray = formatForDisplay(value);
    const previousNumber = usePrevious(value) ?? 0;

    let delta: string | null = null;
    if (value > previousNumber) delta = "increase";
    if (value < previousNumber) delta = "decrease";

    return (
        <span className="inline-flex items-center">
            <span className={`inline-block align-middle ${prefix === "$" ? "mr-2" : ""}`}>{prefix}</span>
            {numArray.reverse().map((number, index) => {
                if (number === ".") return <DecimalColumn key={index} />;
                if (number === ",") return <CommaColumn key={index} />;
                return <NumberColumn key={index} digit={number} delta={delta} />;
            })}
        </span>
    );
} 