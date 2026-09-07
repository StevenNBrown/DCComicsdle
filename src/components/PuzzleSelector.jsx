import { useEffect, useState } from "react";

function PuzzleSelector({
    currentPuzzleNumber,
    todaysPuzzle,
    completedPuzzles,
    onSelect
}) {

    const [open, setOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);


    const puzzles = todaysPuzzle
        ? Array.from(
            { length: todaysPuzzle },
            (_, index) =>
                todaysPuzzle - index
        )
        : [];


    useEffect(() => {

        if (!open) {
            return;
        }


        function handleKeyDown(event) {

            if (event.key === "Escape") {

                event.preventDefault();

                setOpen(false);
                setSelectedIndex(-1);

                return;
            }


            if (puzzles.length === 0) {
                return;
            }


            if (event.key === "ArrowDown") {

                event.preventDefault();

                setSelectedIndex(prev => {

                    const next = prev + 1;

                    if (next >= puzzles.length) {
                        return 0;
                    }

                    return next;
                });

                return;
            }


            if (event.key === "ArrowUp") {

                event.preventDefault();

                setSelectedIndex(prev => {

                    if (prev <= 0) {
                        return puzzles.length - 1;
                    }

                    return prev - 1;
                });

                return;
            }


            if (event.key === "Enter") {

                event.preventDefault();

                const index =
                    selectedIndex < 0
                        ? 0
                        : selectedIndex;


                const puzzleNumber =
                    puzzles[index];


                if (puzzleNumber) {

                    onSelect(puzzleNumber);

                    setOpen(false);
                    setSelectedIndex(-1);

                }

            }

        }


        document.addEventListener(
            "keydown",
            handleKeyDown
        );


        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };

    }, [
        open,
        selectedIndex,
        puzzles
    ]);


    function selectPuzzle(puzzleNumber) {

        onSelect(puzzleNumber);

        setOpen(false);
        setSelectedIndex(-1);

    }


    return (
        <div
            id="puzzleSelector"
            className="puzzle-selector"
        >

            <button
            id="puzzleNumberButton"
            type="button"
            onClick={() => {
                setOpen(prev => !prev);
                setSelectedIndex(-1);
            }}
        >
            <span id="puzzleNumber">
                Puzzle #{currentPuzzleNumber}
            </span>

            <span id="puzzleDropdownArrow">
                ▼
            </span>
        </button>


            {open && (
                <div
                    id="puzzleDropdown"
                    className="open"
                >

                    <div
                        id="puzzleDropdownList"
                    >

                        {puzzles.map(
                            (puzzleNumber, index) => {

                                const isCurrent =
                                    puzzleNumber ===
                                    currentPuzzleNumber;

                                const isCompleted =
                                    completedPuzzles.has(
                                        puzzleNumber
                                    );

                                const isKeyboardSelected =
                                    index ===
                                    selectedIndex;


                                return (
                                    <button
                                        type="button"
                                        key={puzzleNumber}
                                        className={[
                                            "puzzleDropdownItem",

                                            isCurrent
                                                ? "current"
                                                : "",

                                            isCompleted
                                                ? "completed"
                                                : "",

                                            isKeyboardSelected
                                                ? "puzzleKeyboardSelected"
                                                : ""

                                        ].join(" ")}
                                        onClick={() =>
                                            selectPuzzle(
                                                puzzleNumber
                                            )
                                        }
                                    >
                                        Puzzle #
                                        {puzzleNumber}
                                    </button>
                                );

                            }
                        )}

                    </div>

                </div>
            )}

        </div>
    );
}


export default PuzzleSelector;