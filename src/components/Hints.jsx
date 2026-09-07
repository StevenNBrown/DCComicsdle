import { useState } from "react";

const HINT_UNLOCK_COUNT = 5;
const HINT2_UNLOCK_COUNT = 9;
const HINT3_UNLOCK_COUNT = 12;

function Hints({ guesses, secret }) {
    const [openHint, setOpenHint] = useState(null);

    function toggleHint(number) {
        if (openHint === number) {
            setOpenHint(null);
        } else {
            setOpenHint(number);
        }
    }

    const hint1Unlocked =
        guesses.length >= HINT_UNLOCK_COUNT;

    const hint2Unlocked =
        guesses.length >= HINT2_UNLOCK_COUNT;

    const hint3Unlocked =
        guesses.length >= HINT3_UNLOCK_COUNT;

    return (
        <div id="hintsContainer">

            <button
                id="hintBtn1"
                disabled={!hint1Unlocked}
                className={hint1Unlocked ? "enabled" : ""}
                onClick={() => toggleHint(1)}
            >
                QUOTE
            </button>

            <button
                id="hintBtn2"
                disabled={!hint2Unlocked}
                className={hint2Unlocked ? "enabled" : ""}
                onClick={() => toggleHint(2)}
            >
                FIRST APPEARANCE
            </button>

            <button
                id="hintBtn3"
                disabled={!hint3Unlocked}
                className={hint3Unlocked ? "enabled" : ""}
                onClick={() => toggleHint(3)}
            >
                DESCRIPTION
            </button>

            <p id="guessesLeftText">
                {guesses.length < HINT_UNLOCK_COUNT
                    ? `Next hint in ${HINT_UNLOCK_COUNT - guesses.length} guesses`
                    : guesses.length < HINT2_UNLOCK_COUNT
                        ? `Next hint in ${HINT2_UNLOCK_COUNT - guesses.length} guesses`
                        : guesses.length < HINT3_UNLOCK_COUNT
                            ? `Next hint in ${HINT3_UNLOCK_COUNT - guesses.length} guesses`
                            : ""}
            </p>

            <div style={{ marginTop: "15px" }}>

                {openHint === 1 && (
                    <p
                        id="quoteHint"
                        className="hint"
                        style={{ display: "block", fontStyle: "italic" }}
                    >
                        "{secret.quote}"
                    </p>
                )}

                {openHint === 2 && (
                    <p
                        id="firstappHint"
                        className="hint"
                        style={{ display: "block", fontStyle: "italic" }}
                    >
                        "{secret.first_appearance}"
                    </p>
                )}

                {openHint === 3 && (
                    <p
                        id="descriptionHint"
                        className="hint"
                        style={{ display: "block", fontStyle: "italic" }}
                    >
                        "{secret.description}"
                    </p>
                )}

            </div>

        </div>
    );
}

export default Hints;