let guesses = []
let puzzleOffset = 0
const HINT_UNLOCK_COUNT = 5  // change this number anytime
const HINT2_UNLOCK_COUNT = 9  // change this number anytime
const HINT3_UNLOCK_COUNT = 12  // change this number anytime

let secret = null  // store secret character
let currentPuzzleNumber = null
let todaysPuzzle = null

async function startGame(){
    guesses = []

    const res = await fetch(`/start?n=${puzzleOffset}`)
    const data = await res.json()

    secret = data.secret
    currentPuzzleNumber = data.puzzle_number
    todaysPuzzle = data.todays_puzzle

    updateGuessesLeft()
    updatePuzzleDisplay()
    updateNavButtons()
    updateHints()

// ===============================
// LOAD SAVED DATA
// ===============================

const savedPuzzle = localStorage.getItem("dccomicsdle_puzzle")
const savedGuesses = localStorage.getItem(
    `dccomicsdle_guesses_${currentPuzzleNumber}`
)

if (savedGuesses) {

    const previous = JSON.parse(savedGuesses)

    previous.forEach(g => {
        guesses.push(g)
        addGuessRow(g, secret)
    })

    updateHints()
    updateGuessesLeft()


}
    // Clear old puzzle data
  

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
    nameElm.textContent = ""   // clear old name

    const table = document.getElementById("guessTable")
    while(table.rows.length > 1){
        table.deleteRow(1)
    }

    document.getElementById("guessInput").disabled = false
    document.querySelector("#guessArea button").disabled = false

    hideAllHints()
    updateGuessesLeft()
}

function updateGuessesLeft(){

    const text = document.getElementById("guessesLeftText")

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

function updateHints(){

    const hint1Btn = document.getElementById("hintBtn1")
    const hint2Btn = document.getElementById("hintBtn2")
    const hint3Btn = document.getElementById("hintBtn3")

    if(guesses.length >= HINT_UNLOCK_COUNT){

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

    if(guesses.length >= HINT2_UNLOCK_COUNT){
        
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
    if(guesses.length >= HINT3_UNLOCK_COUNT){
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

    // ======================
    // NORMAL EXACT MATCH
    // ======================
    if (fieldValue.toString().toLowerCase() === 
        secretValue.toString().toLowerCase()) {
        return "correct"
    }

    // ======================
    // PARTIAL MATCH
    // ======================
    const fieldList = fieldValue
        .toString()
        .split(",")
        .map(s => s.trim().toLowerCase())

    const secretList = secretValue
        .toString()
        .split(",")
        .map(s => s.trim().toLowerCase())

    const intersection = fieldList.filter(item =>
        secretList.includes(item)
    )

    if (intersection.length > 0) return "partial"

    return "wrong"
}

async function submitGuess(){

    const name = document.getElementById("guessInput").value

    const res = await fetch("/guess",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({ name:name })
    })

    if(!res.ok) return

    const data = await res.json()

    if(data.error){
        alert(data.error)
        return
    }

    guesses.push(data)  
    updateHints()        
    updateGuessesLeft() 
    addGuessRow(data, secret)

    
}

function addGuessRow(data, secret) {

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

    localStorage.setItem("dccomicsdle_last_puzzle", currentPuzzleNumber)
    // Fade in left → right
    cells.forEach((cell, index) => {
        setTimeout(() => {
            cell.style.opacity = "1"
        }, index * 300) // 0.1s delay
    })
    const animationTime = cells.length * 300

    if(data.correct){
        setTimeout(() => {
            showWin(data)
        }, animationTime+100) // small buffer so animation fully finishes
    }
}
document.addEventListener("DOMContentLoaded", () => {
    const guessInput = document.getElementById("guessInput")
    const datalist = document.getElementById("charList")

    guessInput.addEventListener("input", async function() {
        const q = guessInput.value
        if (!q) return

        const res = await fetch(`/search?q=${encodeURIComponent(q)}`)
        if (!res.ok) return
        const data = await res.json()

        datalist.innerHTML = ""
        const added = new Set()

        data.forEach(item => {
            const canonical = item.charname
            if (added.has(canonical)) return
            const option = document.createElement("option")
            option.value = canonical   // shows canonical name
            option.dataset.charname = canonical // always submit canonical
            datalist.appendChild(option)
            added.add(canonical)
        })
    })

    document.getElementById("oldGame").addEventListener("click", () => {

    puzzleOffset++
    resetGame()
    startGame()

    })

    document.getElementById("nextGame").addEventListener("click", () => {

    if(puzzleOffset > 0){
        puzzleOffset--
        resetGame()
        startGame()
    }

    })
})

function showWin(data){

    // Save win PER puzzle
    localStorage.setItem(
        `dccomicsdle_completed_${currentPuzzleNumber}`,
        "true"
    )

    document.getElementById("guessInput").disabled = true
    document.querySelector("#guessArea button").disabled = true

    const imgContainer = document.getElementById("characterImageContainer")
    const img = document.getElementById("characterImage")

    img.src = secret.photo_url
    imgContainer.style.display = "block"

    const nameElm = document.getElementById("Name")

    if(nameElm.style.display !== "block"){
        nameElm.textContent = `${secret.charname}`
        nameElm.style.display = "block"
    }
}
