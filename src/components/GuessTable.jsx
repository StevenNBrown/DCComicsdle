import { getCellClass } from "../../static/getCellClass.js";

function GuessTable({ guesses, secret }) {
    if (!secret) {
        return null;
    }

    return (
        <div id="tableWrapper">
            <table id="guessTable">
                <thead>
                    <tr>
                        <th></th>
                        <th>Gender</th>
                        <th>Type</th>
                        <th>Species</th>
                        <th>Powers</th>
                        <th>Origin</th>
                        <th>Affiliations</th>
                        <th>Year</th>
                        <th>Appearances</th>
                    </tr>
                </thead>

                <tbody>
                    {[...guesses]
                        .reverse()
                        .map((guess) => (
                            <GuessRow
                                key={guess.charname}
                                guess={guess}
                                secret={secret}
                            />
                        ))}
                </tbody>
            </table>
        </div>
    );
}


function GuessRow({ guess, secret }) {
    const animate = guess.isNewGuess === true;

    const values = [
        {
            value: guess.photo_url,
            type: "image"
        },
        {
            value: guess.gender,
            secretValue: secret.gender
        },
        {
            value: guess.chartype,
            secretValue: secret.chartype
        },
        {
            value: guess.species,
            secretValue: secret.species
        },
        {
            value: guess.powers,
            secretValue: secret.powers
        },
        {
            value: guess.origin,
            secretValue: secret.origin
        },
        {
            value: guess.affiliations,
            secretValue: secret.affiliations
        },
        {
            value: guess.year,
            secretValue: secret.year,
            isYear: true
        },
        {
            value: guess.appearances,
            secretValue: secret.appearances
        }
    ];

    return (
        <tr>
            {values.map((cell, index) => {
                const cellStyle = animate
                    ? {
                        animationDelay: `${index * 300}ms`
                    }
                    : {
                        opacity: 1
                    };

                if (cell.type === "image") {
                    return (
                        <td
                            key={index}
                            className={
                                animate
                                    ? "guess-row-cell"
                                    : ""
                            }
                            style={cellStyle}
                        >
                            <img
                                src={cell.value}
                                alt={guess.charname}
                            />
                        </td>
                    );
                }

                return (
                    <GuessCell
                        key={index}
                        value={cell.value}
                        secretValue={cell.secretValue}
                        isYear={cell.isYear}
                        animate={animate}
                        animationDelay={index * 300}
                    />
                );
            })}
        </tr>
    );
}


function GuessCell({
    value,
    secretValue,
    isYear = false,
    animate,
    animationDelay
}) {
    const className = getCellClass(
        value,
        secretValue,
        isYear
    );

    return (
        <td
            className={
                animate
                    ? "guess-row-cell"
                    : ""
            }
            style={
                animate
                    ? {
                        animationDelay: `${animationDelay}ms`
                    }
                    : {
                        opacity: 1
                    }
            }
        >
            <div className={className}>
                {value || ""}
            </div>
        </td>
    );
}


export default GuessTable;