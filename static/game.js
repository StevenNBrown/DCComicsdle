let guesses = []

const HINT_UNLOCK_COUNT = 5
const HINT2_UNLOCK_COUNT = 9
const HINT3_UNLOCK_COUNT = 12

let secret = null
let puzzleOffset = 0
let currentPuzzleNumber = null
let todaysPuzzle = null
let selectedCharacter = null
let dropdownSelectedIndex = -1;
let puzzleSelectedIndex = -1;
let currentDropdownData = [];
let accountId = localStorage.getItem("dccomicsdle_account_id")
let sessionId = localStorage.getItem("dccomicsdle_session")

let completedPuzzles = new Set()
let puzzleDropdownOpen = false

if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem("dccomicsdle_session", sessionId)
}



async function loadSavedGuesses() {

    try {

        let url =
            `/saved-guesses?` +
            `puzzle_number=${currentPuzzleNumber}` +
            `&session_id=${encodeURIComponent(sessionId)}`;

        if (accountId) {
            url += `&account_id=${encodeURIComponent(accountId)}`;
        }

        const res = await fetch(url);

        if (!res.ok) {
            console.error("Failed to load saved guesses");
            return;
        }

        const savedGuesses = await res.json();

        if (!Array.isArray(savedGuesses)) {
            return;
        }

        // Load each saved guess into the game
        savedGuesses.forEach(g => {

            // Mark as already guessed
            guesses.push(g);

            // IMPORTANT:
            // finished=true means NO animation
            addGuessRow(g, secret, true);
        });

        // Update UI based on loaded guesses
        updateHints();
        updateGuessesLeft();

        // Check whether the player already won
        const winningGuess = savedGuesses.find(g => {

            return g.charname.toLowerCase() ===
                   secret.charname.toLowerCase();

        });

        if (winningGuess) {

        completedPuzzles.add(
        currentPuzzleNumber
        );

        buildPuzzleDropdown();

        showWin(winningGuess);

        if (winningGuess) {

            completedPuzzles.add(currentPuzzleNumber)

            buildPuzzleDropdown()

            showWin(winningGuess)
        }
    }

    } catch (err) {

        console.error("Failed to load saved guesses:", err);

    }
}

async function startGame() {

    guesses = []
    secret = null
    selectedCharacter = null

    try {

        const res = await fetch(`/start?n=${puzzleOffset}`)

        if (!res.ok) {
            console.error("Failed to start game")
            return
        }

        const data = await res.json()

        secret = data.secret
        currentPuzzleNumber = data.puzzle_number
        todaysPuzzle = data.todays_puzzle

        console.log("Started puzzle:", currentPuzzleNumber)
        console.log("Today's puzzle:", todaysPuzzle)
        console.log("Puzzle offset:", puzzleOffset)

        updatePuzzleDisplay()
        updateNavButtons()

        const countdown = document.getElementById("countdown")
        const counthead = document.getElementById("counthead")

        countdown.style.display = "none"
        counthead.style.display = "none"

        // Load which puzzles this player has completed
        await loadCompletedPuzzles()

        // Build selector after completed puzzles are known
        buildPuzzleDropdown()

        // Load this puzzle's saved guesses
        await loadSavedGuesses()

        updateHints()
        updateGuessesLeft()

        updateNavButtons()

    } catch (err) {

        console.error("startGame failed:", err)

    }
}
startGame()

function updateNavButtons() {

    const prevBtn = document.getElementById("oldGame")
    const nextBtn = document.getElementById("nextGame")

    if (!prevBtn || !nextBtn || currentPuzzleNumber === null) {
        return
    }

    // Left arrow = older puzzle
    prevBtn.disabled = currentPuzzleNumber <= 1

    // Right arrow = newer puzzle
    nextBtn.disabled = currentPuzzleNumber >= todaysPuzzle
}

function updatePuzzleDisplay(){

    const text = document.getElementById("puzzleNumber")
    text.textContent = `Puzzle #${currentPuzzleNumber}`

}
function resetGame() {

    const imgContainer =
        document.getElementById("characterImageContainer")

    imgContainer.style.display = "none"

    const nameElm =
        document.getElementById("Name")

    nameElm.style.display = "none"
    nameElm.textContent = ""

    const table =
        document.getElementById("guessTable")

    while (table.rows.length > 1) {
        table.deleteRow(1)
    }

    document.getElementById("guessInput").disabled = false
    document.querySelector("#guessArea button").disabled = false

    const hintBtns = [
        document.getElementById("hintBtn1"),
        document.getElementById("hintBtn2"),
        document.getElementById("hintBtn3")
    ]

    hintBtns.forEach(btn => {

        btn.disabled = true
        btn.classList.remove("enabled")

    })

    hideAllHints()

    startGame()
}
function updateGuessesLeft(){

    const text = document.getElementById("guessesLeftText")
    text.style.display = "block"
    let nextThreshold = null

    if(guesses.length < 5) nextThreshold = HINT_UNLOCK_COUNT
    else if(guesses.length < 10) nextThreshold = HINT2_UNLOCK_COUNT 
    else if(guesses.length < 12) nextThreshold = HINT3_UNLOCK_COUNT
    else {
        text.style.display = "none"
        return
    }

    const remaining = nextThreshold - guesses.length
    text.textContent = `Next hint in ${remaining} guesses`
}

function createCell(text,className){
    const td = document.createElement("td")
    const inner = document.createElement("div")
    inner.innerText = text || ""
    if(className) inner.className = className
    td.appendChild(inner)
    return td
}

function hideAllHints() {
    document.querySelectorAll(".hint").forEach(hint => {
        hint.style.display = "none"
    })
}

function updateHints(guessnum = guesses.length){

    const hint1Btn = document.getElementById("hintBtn1")
    const hint2Btn = document.getElementById("hintBtn2")
    const hint3Btn = document.getElementById("hintBtn3")

    if(guessnum >= HINT_UNLOCK_COUNT){

        hint1Btn.disabled = false
        hint1Btn.classList.add("enabled")

        // 👇 PUT CLICK CODE HERE
        if(!hint1Btn.dataset.listenerAdded){
       
            hint1Btn.addEventListener("click", () => {

            const quoteElement = document.getElementById("quoteHint")

            const isVisible = quoteElement.style.display === "block"

            hideAllHints()

            if(!isVisible){
                quoteElement.textContent = `"${secret.quote}"`
                quoteElement.style.display = "block"
            }

            })

            hint1Btn.dataset.listenerAdded = "true"
        }
    }

    if(guessnum >= HINT2_UNLOCK_COUNT){
        
        hint2Btn.disabled = false
        hint2Btn.classList.add("enabled")

        // 👇 PUT CLICK CODE HERE
        if(!hint2Btn.dataset.listenerAdded){
                
            hint2Btn.addEventListener("click", () => {

            const firstappElement = document.getElementById("firstappHint")

            const isVisible = firstappElement.style.display === "block"

            hideAllHints()

            if(!isVisible){
                firstappElement.textContent = `"${secret.first_appearance}"`
                firstappElement.style.display = "block"
            }

            })

            hint2Btn.dataset.listenerAdded = "true"
            }
    }
    if(guessnum >= HINT3_UNLOCK_COUNT){
        hint3Btn.disabled = false
        hint3Btn.classList.add("enabled")
        if(!hint3Btn.dataset.listenerAdded){
            
        hint3Btn.addEventListener("click", () => {

        const descriptionElement = document.getElementById("descriptionHint")

        const isVisible = descriptionElement.style.display === "block"

        hideAllHints()

        if(!isVisible){
            descriptionElement.textContent = `"${secret.description}"`
            descriptionElement.style.display = "block"
        }

        })

        hint3Btn.dataset.listenerAdded = "true"
        }
    
    }
}

function getCellClass(fieldValue, secretValue, isYear = false) {

    if (!fieldValue || !secretValue){
        return "wrong"
    }

    // ======================
    // YEAR LOGIC
    // ======================
    if (isYear) {

        const guessYear = parseInt(fieldValue)
        const secretYear = parseInt(secretValue)

        if (isNaN(guessYear) || isNaN(secretYear)) {
            return "wrong"
        }

        if (guessYear === secretYear) return "correct"
        if (guessYear < secretYear) return "newer"
        return "older"
    }

    const fieldList = fieldValue
    .toString()
    .split(",")
    .map(s => s.trim().toLowerCase())
    .sort()

    const secretList = secretValue
    .toString()
    .split(",")
    .map(s => s.trim().toLowerCase())
    .sort()
    if (JSON.stringify(fieldList) === JSON.stringify(secretList)) {
        return "correct"
    }
   const intersection = fieldList.filter(item => secretList.includes(item))
    
    const humanMetaMatch =
    (fieldList.includes("human") && secretList.includes("metahuman")) ||
    (fieldList.includes("metahuman") && secretList.includes("human"))
    if (intersection.length > 0 || humanMetaMatch)
    return "partial"

    return "wrong"

}

async function submitGuess() {
    if (!selectedCharacter) {
        return;
    }

    const name = selectedCharacter.charname; // use the selected character
    const alreadyGuessed = guesses.some(g =>
        g.charname.toLowerCase() === name.toLowerCase()
    );

    if (alreadyGuessed) {
        return;
    }

    let guessUrl =
    `/guess?session_id=${encodeURIComponent(sessionId)}` +
        `&puzzle_number=${encodeURIComponent(currentPuzzleNumber)}`;

    if (accountId) {
        guessUrl += `&account_id=${encodeURIComponent(accountId)}`;
    }

    const res = await fetch(guessUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: name })
    });

    if (!res.ok) return;

    const data = await res.json();

    if (data.error) {
        alert(data.error);
        return;
    }

    document.getElementById("guessInput").value = "";
    selectedCharacter = null;
    guesses.push(data);

    if (data.correct) {

        completedPuzzles.add(
            currentPuzzleNumber
        );

        buildPuzzleDropdown();
    }

    updateHints();
    updateGuessesLeft();

    addGuessRow(data, secret);
}

function addGuessRow(data, secret, finished=false) {
    document.getElementById("Name").style.display="none"
    const table = document.getElementById("guessTable")
    const row = document.createElement("tr")

    const cells = []

    // Image cell
    const imgTd = document.createElement("td")
    const img = document.createElement("img")
    img.src = data.photo_url
    img.alt = data.charname
    imgTd.appendChild(img)
    cells.push(imgTd)

    // Your existing comparison logic
    cells.push(createCell(data.gender, getCellClass(data.gender, secret.gender)))
    cells.push(createCell(data.chartype, getCellClass(data.chartype, secret.chartype)))
    cells.push(createCell(data.species, getCellClass(data.species, secret.species)))
    cells.push(createCell(data.powers, getCellClass(data.powers, secret.powers)))
    cells.push(createCell(data.origin, getCellClass(data.origin, secret.origin)))
    cells.push(createCell(data.affiliations, getCellClass(data.affiliations, secret.affiliations)))
    cells.push(createCell(data.year, getCellClass(data.year, secret.year,true)))
    cells.push(createCell(data.appearances, getCellClass(data.appearances, secret.appearances)))

    
    // Start hidden
    cells.forEach(cell => {
        cell.style.opacity = "0"
        row.appendChild(cell)
    })

    table.insertBefore(row, table.rows[1])

    const prevBtn = document.getElementById("oldGame")
    const nextBtn = document.getElementById("nextGame")

    localStorage.setItem(
    "dccomicsdle_last_puzzle",
    currentPuzzleNumber
    )

    if (!finished) {
        prevBtn.disabled = true
        nextBtn.disabled = true
    }
    localStorage.setItem("dccomicsdle_last_puzzle", currentPuzzleNumber)
    // Fade in left → right
    if (finished) {

        cells.forEach(cell => {
            cell.style.opacity = "1";
        });

        animationTime = 0;

    }
    else {

        cells.forEach((cell, index) => {

            setTimeout(() => {
                cell.style.opacity = "1";
            }, index * 300);

        });

        animationTime = cells.length * 300;
    }

    if(data.correct){
        setTimeout(() => {
            showWin(data)
        }, animationTime+100) // small buffer so animation fully finishes
    }
    else{
    const tempdata=structuredClone(data)
    const tempsecret=structuredClone(secret)

    delete tempdata.photo_url
    delete tempdata.charname
    delete tempdata.quote
    delete tempdata.first_appearance
    delete tempdata.description
    delete tempdata.correct

    delete tempsecret.photo_url
    delete tempsecret.charname
    delete tempsecret.quote
    delete tempsecret.first_appearance
    delete tempsecret.description

    
-   setTimeout(() => {
    const nameElm = document.getElementById("Name")
    if (!data.correct) {
    const allMatch =
        getCellClass(data.gender, secret.gender) === "correct" &&
        getCellClass(data.chartype, secret.chartype) === "correct" &&
        getCellClass(data.species, secret.species) === "correct" &&
        getCellClass(data.powers, secret.powers) === "correct" &&
        getCellClass(data.origin, secret.origin) === "correct" &&
        getCellClass(data.affiliations, secret.affiliations) === "correct" &&
        getCellClass(data.year, secret.year, true) === "correct" &&
        getCellClass(data.appearances, secret.appearances) === "correct";

    if (allMatch) {
        nameElm.textContent = `All Correct But Not Today's Character`;
        nameElm.style.display = "block";
    } else {
        nameElm.textContent = "";
        nameElm.style.display = "none";
    }
}
}, animationTime + 100)
}
    setTimeout(() => {
    prevBtn.disabled = false
    nextBtn.disabled = false
}, animationTime + 50)
}
const guessInput = document.getElementById("guessInput");
const dropdown = document.getElementById("dropdown");


async function updateDropdown(query) {

    if (!query) {
        dropdown.innerHTML = "";
        dropdownSelectedIndex = -1;
        return;
    }

    try {

        const res = await fetch(
            `/search?q=${encodeURIComponent(query)}`
        );

        if (!res.ok) {
            dropdown.innerHTML = "";
            return;
        }

        let data;

        try {
            data = await res.json();
        } catch {
            dropdown.innerHTML = "";
            return;
        }

        if (!Array.isArray(data)) {
            dropdown.innerHTML = "";
            return;
        }

        currentDropdownData = data;

        dropdown.innerHTML = "";

        data.forEach(item => {

            const alreadyGuessed = guesses.some(g =>
                g.charname.toLowerCase() ===
                item.charname.toLowerCase()
            );

            if (alreadyGuessed) return;

            const div = document.createElement("div");

            div.className = "dropdown-item";

            div.innerHTML = `
                <img src="${item.photo_url}">
                <span>${item.charname}</span>
            `;

            div.addEventListener("mousedown", (event) => {

    // Prevent the input from losing focus
            event.preventDefault();
            event.stopPropagation();

            guessInput.value = item.charname;
            selectedCharacter = item;

            dropdown.innerHTML = "";

            // Keep the selected character remembered
            dropdownSelectedIndex = -1;
        });

            dropdown.appendChild(div);
        });

        const items = Array.from(
            dropdown.querySelectorAll(".dropdown-item")
        );

        // --------------------------------------------------------
        // Restore the selected character
        // --------------------------------------------------------

        if (selectedCharacter && items.length > 0) {

            const selectedIndex = items.findIndex(item => {

                const name =
                    item.querySelector("span").textContent;

                return name.toLowerCase() ===
                    selectedCharacter.charname.toLowerCase();

            });

            if (selectedIndex !== -1) {

                dropdownSelectedIndex = selectedIndex;

                updateCharacterHighlight(items);

            } else {

                dropdownSelectedIndex = -1;
            }

        } else {

            dropdownSelectedIndex = -1;
        }

        if (dropdown.children.length > 0) {
            dropdown.style.display = "block";
        }

    } catch (err) {

        console.error("Search failed:", err);

    }
}


guessInput.addEventListener("keydown", async function(event) {

    const items = Array.from(
        dropdown.querySelectorAll(".dropdown-item")
    );


    if (event.key === "Escape") {

        dropdown.innerHTML = "";
        dropdownSelectedIndex = -1;

        return;
    }


    if (event.key === "ArrowDown") {

        if (items.length === 0) return;

        event.preventDefault();

        dropdownSelectedIndex++;

        if (dropdownSelectedIndex >= items.length) {
            dropdownSelectedIndex = 0;
        }

        updateCharacterHighlight(items);

        return;
    }


    if (event.key === "ArrowUp") {

        if (items.length === 0) return;

        event.preventDefault();

        dropdownSelectedIndex--;

        if (dropdownSelectedIndex < 0) {
            dropdownSelectedIndex = items.length - 1;
        }

        updateCharacterHighlight(items);

        return;
    }

    
    if (event.key === "Enter") {


        if (items.length > 0) {

            event.preventDefault();

            if (dropdownSelectedIndex < 0) {
                return;
            }

            const selectedItem =
                items[dropdownSelectedIndex];

            if (!selectedItem) return;

            const name =
                selectedItem.querySelector("span").textContent;

            const photo =
                selectedItem.querySelector("img").src;

            selectedCharacter = {
                charname: name,
                photo_url: photo
            };

            // Put selected character into input
            guessInput.value = name;

            // Close dropdown
            dropdown.innerHTML = "";
            dropdownSelectedIndex = -1;

            // DO NOT GUESS HERE
            return;
        }


        if (selectedCharacter) {

            event.preventDefault();

            await submitGuess();

            return;
        }
    }

});


function updateCharacterHighlight(items) {

    items.forEach((item, index) => {

        if (index === dropdownSelectedIndex) {

            item.classList.add("keyboard-selected");

            // Keep selected item visible
            item.scrollIntoView({
                block: "nearest"
            });

        } else {

            item.classList.remove("keyboard-selected");

        }

    });
}


function showWin(data){

    // Save win PER puzzle
    

    document.getElementById("guessInput").disabled = true
    document.querySelector("#guessArea button").disabled = true

    const imgContainer = document.getElementById("characterImageContainer")
    const img = document.getElementById("characterImage")

    img.src = secret.photo_url
    imgContainer.style.display = "block"

    const nameElm = document.getElementById("Name")
    nameElm.style.display="none"
    if(nameElm.style.display !== "block"){
        nameElm.textContent = `${secret.charname}`
        nameElm.style.fontSize='30px'
        nameElm.style.display = "block"
        
    }
    updateHints(15)
    document.getElementById("guessesLeftText").style.display="none"
    const countdown = document.getElementById("countdown")
    const counthead = document.getElementById("counthead")

    if (puzzleOffset === 0) {
        countdown.style.display = "block"
        counthead.style.display = "block"
        startCountdown("countdown")
    } else {
        countdown.style.display = "none"
        counthead.style.display = "none"
    }
}



function getNextResetTimeUTC() {
    const now = new Date()

    // Next UTC midnight
    const reset = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0
    ))

    return reset
}

function startCountdown(elementId) {
    const target = getNextResetTimeUTC()

    function updateTimer() {
        const now = new Date()
        const diff = target - now

        if (diff <= 0) {
            document.getElementById("counthead").textContent = "none"

            document.getElementById(elementId).textContent = "none"
            return
        }

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff / (1000 * 60)) % 60)
        const seconds = Math.floor((diff / 1000) % 60)
        document.getElementById('counthead').textContent = 'Next Game in:'
        document.getElementById(elementId).textContent =
            `${String(hours).padStart(2, '0')}:` +
            `${String(minutes).padStart(2, '0')}:` +
            `${String(seconds).padStart(2, '0')}`
    }

    updateTimer()
    setInterval(updateTimer, 1000)
}

async function loadCompletedPuzzles() {

    try {

        let url =
            `/completed-puzzles?session_id=${encodeURIComponent(sessionId)}`;

        if (accountId) {
            url += `&account_id=${encodeURIComponent(accountId)}`;
        }

        const res = await fetch(url);

        if (!res.ok) {
            console.error("Failed to load completed puzzles");
            return;
        }

        const data = await res.json();

        if (!Array.isArray(data.completed)) {
            return;
        }

        completedPuzzles = new Set(data.completed);

    } catch (err) {

        console.error(
            "Failed to load completed puzzles:",
            err
        );

    }
}

function buildPuzzleDropdown() {
    const list =
        document.getElementById("puzzleDropdownList")

    if (!list) {
        console.error("puzzleDropdownList not found")
        return
    }

    list.innerHTML = ""

    if (!todaysPuzzle || todaysPuzzle < 1) {
        return
    }

    for (let puzzleNumber = todaysPuzzle;
         puzzleNumber >= 1;
         puzzleNumber--) {

        const button =
            document.createElement("button")

        button.type = "button"
        button.className = "puzzleDropdownItem"

        button.textContent = `Puzzle #${puzzleNumber}`; 
        button.dataset.puzzleNumber = puzzleNumber;

        // Currently selected puzzle
        if (puzzleNumber === currentPuzzleNumber) {
            button.classList.add("current")
        }

        // Completed puzzle
        if (completedPuzzles.has(puzzleNumber)) {
            button.classList.add("completed")
        }

        button.addEventListener("click", function(event) {

            event.preventDefault()
            event.stopPropagation()

            selectPuzzle(puzzleNumber)
        })

        list.appendChild(button)
    }
}

function updatePuzzleHighlight(items) {

    items.forEach((item, index) => {

        if (index === puzzleSelectedIndex) {

            item.classList.add(
                "puzzleKeyboardSelected"
            );

            item.scrollIntoView({
                block: "nearest"
            });

        } else {

            item.classList.remove(
                "puzzleKeyboardSelected"
            );
        }

    });
}

function selectPuzzle(puzzleNumber) {

    if (!todaysPuzzle) {
        return
    }

    if (
        puzzleNumber < 1 ||
        puzzleNumber > todaysPuzzle
    ) {
        return
    }

    console.log("Selecting puzzle:", puzzleNumber)

    // Convert puzzle number into the offset expected by /start
    puzzleOffset = todaysPuzzle - puzzleNumber

    closePuzzleDropdown()

    resetGame()
}

function togglePuzzleDropdown(event) {

    event.stopPropagation();

    const dropdown =
        document.getElementById("puzzleDropdown");

    if (!dropdown) return;

    puzzleDropdownOpen = !puzzleDropdownOpen;

    if (puzzleDropdownOpen) {

        puzzleSelectedIndex = -1;

        buildPuzzleDropdown();

        dropdown.classList.add("open");

    } else {

        closePuzzleDropdown();
    }
}
document.addEventListener("keydown", function(event) {

    const puzzleDropdown =
        document.getElementById("puzzleDropdown");

    if (!puzzleDropdownOpen || !puzzleDropdown) {
        return;
    }

    const items = Array.from(
        puzzleDropdown.querySelectorAll(".puzzleDropdownItem")
    );

    if (items.length === 0) return;


    // ============================================================
    // ESCAPE
    // ============================================================

    if (event.key === "Escape") {

        event.preventDefault();

        closePuzzleDropdown();

        return;
    }


    // ============================================================
    // DOWN
    // ============================================================

    if (event.key === "ArrowDown") {

        event.preventDefault();

        puzzleSelectedIndex++;

        if (puzzleSelectedIndex >= items.length) {
            puzzleSelectedIndex = 0;
        }

        updatePuzzleHighlight(items);

        return;
    }


    // ============================================================
    // UP
    // ============================================================

    if (event.key === "ArrowUp") {

        event.preventDefault();

        puzzleSelectedIndex--;

        if (puzzleSelectedIndex < 0) {
            puzzleSelectedIndex = items.length - 1;
        }

        updatePuzzleHighlight(items);

        return;
    }


    // ============================================================
    // ENTER
    // ============================================================

    if (event.key === "Enter") {

        event.preventDefault();

        if (puzzleSelectedIndex < 0) {
            puzzleSelectedIndex = 0;
        }

        const selected =
            items[puzzleSelectedIndex];

        if (!selected) return;

        const puzzleNumber =
            parseInt(
                selected.dataset.puzzleNumber
            );

        if (!isNaN(puzzleNumber)) {
            selectPuzzle(puzzleNumber);
        }

    }

});


function closePuzzleDropdown() {

    const dropdown =
        document.getElementById("puzzleDropdown")

    if (!dropdown) {
        return
    }

    puzzleDropdownOpen = false

    dropdown.classList.remove("open")
}

function setupPuzzleSelector() {

    const button =
        document.getElementById("puzzleNumberButton")

    const dropdown =
        document.getElementById("puzzleDropdown")

    if (!button) {
        console.error("puzzleNumberButton not found")
        return
    }

    if (!dropdown) {
        console.error("puzzleDropdown not found")
        return
    }

    button.type = "button"

    button.addEventListener("click", togglePuzzleDropdown)

    dropdown.addEventListener("click", function(event) {

        event.stopPropagation()

    })

    document.addEventListener("click", function() {

        closePuzzleDropdown()

    })
}

setupPuzzleSelector()



let lastQuery = "";

// Run search on typing
guessInput.addEventListener("input", async function () {

    // The user manually changed the text,
    // so the previously selected character is no longer valid.
    selectedCharacter = null;
    dropdownSelectedIndex = -1;

    lastQuery = guessInput.value.trim();

    await updateDropdown(lastQuery);
});

// Run search when input is clicked/focused
guessInput.addEventListener("focus", async function () {

    // Don't rebuild the dropdown when a character
    // has already been selected
    if (selectedCharacter) {
        return;
    }

    if (lastQuery) {
        await updateDropdown(lastQuery);
    }
});

// Click outside closes dropdown
setupPuzzleSelector();

document.addEventListener("click", (event) => {
    const guessArea = document.getElementById("guessArea");

    if (!guessArea.contains(event.target)) {
        dropdown.innerHTML = "";
    }
});

document.getElementById("oldGame").addEventListener("click", () => {
    if (puzzleOffset < todaysPuzzle - 1) {
        puzzleOffset++;
        resetGame();
    }
});

document.getElementById("nextGame").addEventListener("click", () => {
    if (puzzleOffset > 0) {
        puzzleOffset--;
        resetGame();
    }
});

    document.addEventListener("click", (event) => {
    const guessArea = document.getElementById("guessArea");

    if (!guessArea.contains(event.target)) {
        dropdown.innerHTML = "";
    }
});


