import { useEffect, useState } from "react";


function getNextResetTimeUTC() {

    const now = new Date();

    const reset = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate() + 1,
            0,
            0,
            0
        )
    );

    return reset;
}


function formatTime(diff) {

    if (diff <= 0) {
        return "00:00:00";
    }


    const hours = Math.floor(
        diff / (1000 * 60 * 60)
    );


    const minutes = Math.floor(
        (diff / (1000 * 60)) % 60
    );


    const seconds = Math.floor(
        (diff / 1000) % 60
    );


    return (
        `${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`
    );
}


function Countdown() {

    const [timeLeft, setTimeLeft] =
        useState("");


    useEffect(() => {

        function updateTimer() {

            const target =
                getNextResetTimeUTC();

            const now = new Date();

            const diff = target - now;

            setTimeLeft(
                formatTime(diff)
            );

        }


        updateTimer();


        const interval =
            setInterval(
                updateTimer,
                1000
            );


        return () => {
            clearInterval(interval);
        };

    }, []);


    return (
        <div id="countdown">
            {timeLeft}
        </div>
    );
}


export default Countdown;