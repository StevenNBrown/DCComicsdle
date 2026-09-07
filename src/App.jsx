import { useEffect, useState } from "react";

import CharacterSearch from "./components/CharacterSearch";
import GuessTable from "./components/GuessTable";
import Hints from "./components/Hints";
import PuzzleSelector from "./components/PuzzleSelector";
import Countdown from "./components/Countdown";

const API_URL = "";
const HINT_UNLOCK_COUNT = 5;
const HINT2_UNLOCK_COUNT = 9;
const HINT3_UNLOCK_COUNT = 12;

function App() {
    const [guesses, setGuesses] = useState([]);
    const [secret, setSecret] = useState(null);

    const [puzzleOffset, setPuzzleOffset] = useState(0);
    const [currentPuzzleNumber, setCurrentPuzzleNumber] = useState(null);
    const [todaysPuzzle, setTodaysPuzzle] = useState(null);

    const [selectedCharacter, setSelectedCharacter] = useState(null);

    const [completedPuzzles, setCompletedPuzzles] = useState(new Set());

    const [won, setWon] = useState(false);

    const [accountId] = useState(() =>
        localStorage.getItem("dccomicsdle_account_id")
    );

    const [sessionId] = useState(() => {
        let id = localStorage.getItem("dccomicsdle_session");

        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem("dccomicsdle_session", id);
        }

        return id;
    });

    /*
     * Start/restart whenever puzzleOffset changes.
     */
    useEffect(() => {
        startGame();
    }, [puzzleOffset]);


    async function startGame() {
        try {
            // Reset React state
            setGuesses([]);
            setSecret(null);
            setSelectedCharacter(null);
            setWon(false);

            const res = await fetch(`/start?n=${puzzleOffset}`)

            if (!res.ok) {
                console.error("Failed to start game");
                return;
            }

            const data = await res.json();

            setSecret(data.secret);
            setCurrentPuzzleNumber(data.puzzle_number);
            setTodaysPuzzle(data.todays_puzzle);

            console.log("Started puzzle:", data.puzzle_number);
            console.log("Today's puzzle:", data.todays_puzzle);
            console.log("Puzzle offset:", puzzleOffset);

            await loadCompletedPuzzles();

        } catch (err) {
            console.error("startGame failed:", err);
        }
    }


    async function loadCompletedPuzzles() {
        try {
            let url =
                `/completed-puzzles?session_id=${encodeURIComponent(sessionId)}`;

            if (accountId) {
                url += `&account_id=${encodeURIComponent(accountId)}`;
            }

            const res = await fetch(url)

            if (!res.ok) {
                console.error("Failed to load completed puzzles");
                return;
            }

            const data = await res.json();

            if (!Array.isArray(data.completed)) {
                return;
            }

            setCompletedPuzzles(new Set(data.completed));

        } catch (err) {
            console.error(
                "Failed to load completed puzzles:",
                err
            );
        }
    }


    async function loadSavedGuesses() {
        if (
            currentPuzzleNumber === null ||
            secret === null
        ) {
            return;
        }

        try {
            let url =
                `/saved-guesses?` +
                `puzzle_number=${currentPuzzleNumber}` +
                `&session_id=${encodeURIComponent(sessionId)}`;

            if (accountId) {
                url += `&account_id=${encodeURIComponent(accountId)}`;
            }

            const res = await fetch(url)

            if (!res.ok) {
                console.error("Failed to load saved guesses");
                return;
            }

            const savedGuesses = await res.json();

            if (!Array.isArray(savedGuesses)) {
                return;
            }

            setGuesses(savedGuesses);

            const winningGuess = savedGuesses.find(g =>
                g.charname.toLowerCase() ===
                secret.charname.toLowerCase()
            );

            if (winningGuess) {
                setCompletedPuzzles(prev =>
                    new Set([
                        ...prev,
                        currentPuzzleNumber
                    ])
                );

                setWon(true);
            }

        } catch (err) {
            console.error(
                "Failed to load saved guesses:",
                err
            );
        }
    }


    /*
     * Load saved guesses after secret/current puzzle
     * have been received.
     */
    useEffect(() => {
        if (
            currentPuzzleNumber !== null &&
            secret !== null
        ) {
            loadSavedGuesses();
        }
    }, [currentPuzzleNumber, secret]);


    async function submitGuess(character = selectedCharacter) {
        if (!character) {
            return;
        }

        const name = character.charname;

        const alreadyGuessed = guesses.some(
            g =>
                g.charname.toLowerCase() ===
                name.toLowerCase()
        );

        if (alreadyGuessed) {
            return;
        }

        try {
            let guessUrl =
                `/guess?session_id=${encodeURIComponent(sessionId)}` +
                `&puzzle_number=${encodeURIComponent(currentPuzzleNumber)}`;

            if (accountId) {
                guessUrl +=
                    `&account_id=${encodeURIComponent(accountId)}`;
            }

            const res = await fetch(guessUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: name
                })
            });

            if (!res.ok) {
                console.error("Guess request failed");
                return;
            }

            const data = await res.json();

            if (data.error) {
                alert(data.error);
                return;
            }

            setGuesses(prev => [
                ...prev,
                {
                    ...data,
                    isNewGuess: true
                }
            ]);
            setSelectedCharacter(null);

            localStorage.setItem(
                "dccomicsdle_last_puzzle",
                currentPuzzleNumber
            );

            if (data.correct) {
                setCompletedPuzzles(prev =>
                    new Set([
                        ...prev,
                        currentPuzzleNumber
                    ])
                );

                setWon(true);
            }

        } catch (err) {
            console.error("submitGuess failed:", err);
        }
    }


    function selectPuzzle(puzzleNumber) {
        if (!todaysPuzzle) {
            return;
        }

        if (
            puzzleNumber < 1 ||
            puzzleNumber > todaysPuzzle
        ) {
            return;
        }

        console.log(
            "Selecting puzzle:",
            puzzleNumber
        );

        setPuzzleOffset(
            todaysPuzzle - puzzleNumber
        );
    }


    function goToPreviousPuzzle() {
        if (
            currentPuzzleNumber !== null &&
            currentPuzzleNumber > 1
        ) {
            setPuzzleOffset(prev => prev + 1);
        }
    }


    function goToNextPuzzle() {
        if (
            currentPuzzleNumber !== null &&
            todaysPuzzle !== null &&
            currentPuzzleNumber < todaysPuzzle
        ) {
            setPuzzleOffset(prev => prev - 1);
        }
    }


  
return (
    <div id="mainContent">
        <div id="logo">
            <img
                src="/static/images/Logo.png"
                alt="DCComicsdle Logo"
            />
        </div>

        {secret && (
            <Hints
                guesses={guesses}
                secret={secret}
            />
        )}
       

           <CharacterSearch
    guesses={guesses}
    selectedCharacter={selectedCharacter}
    setSelectedCharacter={setSelectedCharacter}
    onSubmit={submitGuess}
    disabled={won}
/>

 <div id="puzzleNavigation">

            <button
                id="oldGame"
                disabled={
                    currentPuzzleNumber === null ||
                    currentPuzzleNumber <= 1
                }
                onClick={goToPreviousPuzzle}
            >
                ←
            </button>

            <PuzzleSelector
                currentPuzzleNumber={currentPuzzleNumber}
                todaysPuzzle={todaysPuzzle}
                completedPuzzles={completedPuzzles}
                onSelect={selectPuzzle}
            />

            <button
                id="nextGame"
                disabled={
                    currentPuzzleNumber === null ||
                    currentPuzzleNumber >= todaysPuzzle
                }
                onClick={goToNextPuzzle}
            >
                →
            </button>

        </div>
{won && (
    <div
        id="characterImageContainer"
        style={{
            display: "block",
            marginTop: "20px",
            textAlign: "center"
        }}
    >

        {secret && (
            
            <>
             {puzzleOffset === 0 && (
            <div id="winScreen">
                <div id="Name">
                    Next Game in:
                </div>

                <Countdown />
            </div>
        )}
                <img
                    id="characterImage"
                    src={secret.photo_url}
                    alt={secret.charname}
                    style={{
                        display: "block",
                        width: "300px",
                        height: "300px",
                        objectFit: "fill",
                        borderRadius: "20px",
                        border: "5px solid #0078f9",
                        margin: "10px auto"
                    }}
                />

                <p
                    id="Name"
                    style={{
                        display: "block",
                        fontWeight: "bold",
                        fontSize: "22px"
                    }}
                >
                    {secret.charname}
                </p>
            </>
        )}

       
    </div>
)}

        {secret && (
            <GuessTable
                guesses={guesses}
                secret={secret}
            />
        )}


    </div>
);
}


function getGuessesUntilHint(count) {
    if (count < HINT_UNLOCK_COUNT) {
        return HINT_UNLOCK_COUNT - count;
    }

    if (count < HINT2_UNLOCK_COUNT) {
        return HINT2_UNLOCK_COUNT - count;
    }

    if (count < HINT3_UNLOCK_COUNT) {
        return HINT3_UNLOCK_COUNT - count;
    }

    return null;
}


export default App;

