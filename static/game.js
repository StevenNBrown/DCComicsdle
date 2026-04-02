let guesses = []
let puzzleOffset = 0
const HINT_UNLOCK_COUNT = 5  // change this number anytime
const HINT2_UNLOCK_COUNT = 9  // change this number anytime
const HINT3_UNLOCK_COUNT = 12  // change this number anytime

let secret = null  // store secret character
let currentPuzzleNumber = null
let todaysPuzzle = null
let selectedCharacter = null; // stores object from dropdown
let sessionId = localStorage.getItem("dccomicsdle_session");

if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("dccomicsdle_session", sessionId);
}

async function startGame() {

    guesses = []
    secret = null

    const res = await fetch(`/start?n=${puzzleOffset}`)
    const data = await res.json()

    secret = data.secret
    currentPuzzleNumber = data.puzzle_number
    todaysPuzzle = data.todays_puzzle

    updatePuzzleDisplay()
    updateNavButtons()
    const countdown = document.getElementById("countdown")
    const counthead = document.getElementById("counthead")
    countdown.style.display = "none"
    counthead.style.display = "none"
    // ===============================
    // LOAD SAVED GUESSES
    // ===============================
    const savedGuesses = localStorage.getItem(
    `dccomicsdle_guesses_${currentPuzzleNumber}`
    )

    if (savedGuesses) {
        const saved = JSON.parse(savedGuesses)

        if (saved && saved.length > 0) {
            saved.forEach(g => {
                guesses.push(g)
                addGuessRow(g, secret, true)
            })

            const lastGuess = saved[saved.length - 1]

            // ✅ use correct flag instead of name comparison
            if (lastGuess.correct) {
                updateHints()
                updateGuessesLeft()
                showWin()
                return
            }
        }
    }

    updateHints()
    updateGuessesLeft()

    // ===============================
    // CHECK WIN AFTER LOADING GUESSES
    // ===============================


}
startGame()

function updateNavButtons(){

    const prevBtn = document.getElementById("oldGame")
    const nextBtn = document.getElementById("nextGame")

    // Can't go before puzzle 1
    if(currentPuzzleNumber===1)
        prevBtn.disabled=true
    else{ prevBtn.disabled=false}
    // Can't go forward past today
    nextBtn.disabled = puzzleOffset === 0
}
function updatePuzzleDisplay(){

    const text = document.getElementById("puzzleNumber")
    text.textContent = `Puzzle #${currentPuzzleNumber}`

}
function resetGame(){

    const imgContainer = document.getElementById("characterImageContainer")
    imgContainer.style.display = "none"

    const nameElm = document.getElementById("Name")
    nameElm.style.display = "none"
    nameElm.textContent = ""

    const table = document.getElementById("guessTable")
    while(table.rows.length > 1){
        table.deleteRow(1)
    }

    document.getElementById("guessInput").disabled = false
    document.querySelector("#guessArea button").disabled = false

    // ✅ RESET HINT BUTTONS COMPLETELY
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

    const res = await fetch(`/guess?session_id=${sessionId}`, {
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
    localStorage.setItem(
    `dccomicsdle_guesses_${currentPuzzleNumber}`,
    JSON.stringify(guesses)
    )
    const prevBtn = document.getElementById("oldGame")
    const nextBtn = document.getElementById("nextGame")

    prevBtn.disabled = true
    nextBtn.disabled = true
    localStorage.setItem("dccomicsdle_last_puzzle", currentPuzzleNumber)
    // Fade in left → right
    if (finished){
        cells.forEach((cell, index) => {
        setTimeout(() => {
            cell.style.opacity = "1"
        }, index) // 0.1s delay
    })
     animationTime = cells.length 
    }
    else{
        cells.forEach((cell, index) => {
            setTimeout(() => {
                cell.style.opacity = "1"
            }, index * 300) // 0.1s delay
        })
     animationTime = cells.length * 300
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


async function updateDropdown(query){
    
    if (!query) {
        dropdown.innerHTML = "";
        return;
    }

    try {
        const res = await fetch(`/search?q=${encodeURIComponent(query)}`);

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

        if (!Array.isArray(data)) return;

        dropdown.innerHTML = "";
        
        data.forEach(item => {
            const alreadyGuessed = guesses.some(g => 
            g.charname.toLowerCase() === item.charname.toLowerCase()
            );

            if (alreadyGuessed) return;

            const div = document.createElement("div");
            
            div.className = "dropdown-item";
            div.innerHTML = `
                <img src="${item.photo_url}">
                <span>${item.charname}</span>
            `;

            // ✅ When clicked → fill input with canonical name
            div.onclick = () => {
                guessInput.value = item.charname; 
                selectedCharacter = item;         
                dropdown.innerHTML = "";
            };

            dropdown.appendChild(div);
        });

    } catch (err) {
        console.error("Search failed:", err);
    }
 
};

let lastQuery = "";

// Run search on typing
guessInput.addEventListener("input", async function () {
    lastQuery = guessInput.value.trim();
    await updateDropdown(lastQuery);
});

// Run search when input is clicked/focused
guessInput.addEventListener("focus", async function () {
    if (lastQuery) {
        await updateDropdown(lastQuery);
    }
});

// Click outside closes dropdown
document.addEventListener("click", (event) => {
    const guessArea = document.getElementById("guessArea");
    if (!guessArea.contains(event.target)) {
        dropdown.innerHTML = ""; // hide dropdown
    }
});
    document.getElementById("oldGame").addEventListener("click", () => {
    if (currentPuzzleNumber > 1) {
        puzzleOffset++
        resetGame()
    }
    })

    document.getElementById("nextGame").addEventListener("click", () => {

    if(puzzleOffset > 0){
        puzzleOffset--
        resetGame()
    }

    })


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



