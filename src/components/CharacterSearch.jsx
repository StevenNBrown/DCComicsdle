import { useEffect, useRef, useState } from "react";

function CharacterSearch({
    guesses,
    selectedCharacter,
    setSelectedCharacter,
    onSubmit,
    disabled
})  {
const [query, setQuery] = useState("");
const [searchResults, setSearchResults] = useState([]);
const [selectedIndex, setSelectedIndex] = useState(-1);

const searchAreaRef = useRef(null);

    useEffect(() => {
    function handleClickOutside(event) {
        if (
            searchAreaRef.current &&
            !searchAreaRef.current.contains(event.target)
        ) {
            setSearchResults([]);
            setSelectedIndex(-1);
        }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        document.removeEventListener(
            "mousedown",
            handleClickOutside
        );
    };
}, []);

    useEffect(() => {

        
        if (!query.trim()) {
            setSearchResults([]);
            setSelectedIndex(-1);
            return;
        }

        let cancelled = false;

        async function searchCharacters() {
            try {
                const res = await fetch(
                    `/search?q=${encodeURIComponent(query)}`
                );

                if (!res.ok) {
                    setSearchResults([]);
                    return;
                }

                const data = await res.json();

                if (
                    !cancelled &&
                    Array.isArray(data)
                ) {
                    setSearchResults(data);
                }

            } catch (err) {
                console.error("Search failed:", err);
            }
        }

        searchCharacters();

        return () => {
            cancelled = true;
        };
    }, [query]);

    const availableResults =
        searchResults.filter(character =>
            !guesses.some(
                guess =>
                    guess.charname.toLowerCase() ===
                    character.charname.toLowerCase()
            )
        );

    function selectCharacter(character) {
        setSelectedCharacter(character);
        setQuery(character.charname);
        setSearchResults([]);
        setSelectedIndex(-1);
    }

    function handleInputChange(event) {
    if (disabled) {
        return;
    }

    const value = event.target.value;

    setQuery(value);
    setSelectedCharacter(null);
    setSelectedIndex(-1);
}

    async function handleKeyDown(event) {
    if (disabled) {
        return;
    }

        if (event.key === "Escape") {
            event.preventDefault();

            setSearchResults([]);
            setSelectedIndex(-1);

            return;
        }

        if (event.key === "ArrowDown") {
            if (availableResults.length === 0) {
                return;
            }

            event.preventDefault();

            setSelectedIndex(prev => {
                const next = prev + 1;

                if (next >= availableResults.length) {
                    return 0;
                }

                return next;
            });

            return;
        }

        if (event.key === "ArrowUp") {
            if (availableResults.length === 0) {
                return;
            }

            event.preventDefault();

            setSelectedIndex(prev => {
                if (prev <= 0) {
                    return availableResults.length - 1;
                }

                return prev - 1;
            });

            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();

            if (
                availableResults.length > 0 &&
                selectedIndex >= 0
            ) {
                const selected =
                    availableResults[selectedIndex];

                if (selected) {
                    selectCharacter(selected);
                }

                return;
            }

            if (selectedCharacter) {
                await onSubmit(selectedCharacter);
                setQuery("");
            }
        }
    }

    return (
        <div id="guessArea" ref={searchAreaRef}>

            <div className="input-wrapper">

                <input
                    id="guessInput"
                    type="text"
                    value={query}
                    autoComplete="off"
                    disabled={disabled}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                />

                {availableResults.length > 0 && (
                    <div
                        id="dropdown"
                        className="dropdown"
                    >
                        {availableResults.map(
                            (character, index) => (
                                <button
                                    type="button"
                                    key={character.charname}
                                    className={
                                        index === selectedIndex
                                            ? "dropdown-item keyboard-selected"
                                            : "dropdown-item"
                                    }
                                    onMouseDown={event => {
                                        event.preventDefault();
                                        selectCharacter(character);
                                    }}
                                >
                                    <img
                                        src={character.photo_url}
                                        alt={character.charname}
                                    />

                                    <span>
                                        {character.charname}
                                    </span>
                                </button>
                            )
                        )}
                    </div>
                )}

            </div>

           <button
                type="button"
                disabled={disabled || !selectedCharacter}
                onClick={async () => {
                    await onSubmit(selectedCharacter);
                    setQuery("");
                }}
            >
                GUESS
            </button>

        </div>

        
    );

    
}

export default CharacterSearch;