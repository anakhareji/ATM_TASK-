import React, { useEffect, useState } from 'react';

const Counter = ({ value, duration = 1000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let start = 0;
        const end = parseInt(String(value).replace(/[^0-9]/g, ''));
        if (start === end) return;

        let totalMiliseconds = duration;
        let incrementTime = (totalMiliseconds / end) > 10 ? (totalMiliseconds / end) : 10;

        let timer = setInterval(() => {
            start += Math.ceil(end / (duration / incrementTime));
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, incrementTime);

        return () => clearInterval(timer);
    }, [value, duration]);

    return <span>{String(value).includes('%') ? `${count}%` : count.toLocaleString()}</span>;
};

export default Counter;
