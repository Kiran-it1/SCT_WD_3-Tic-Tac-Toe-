const state = {
  step: "welcome",
  mode: null,
  size: 3,
  diff: "easy",
  board: [],
  turn: "X",
  aiMark: "O",
  humanMark: "X",
  scores: { X: 0, O: 0, D: 0 },
  gameOver: false
}

const steps = {
  welcome: document.querySelector('[data-step="welcome"]'),
  mode: document.querySelector('[data-step="mode"]'),
  size: document.querySelector('[data-step="size"]'),
  difficulty: document.querySelector('[data-step="difficulty"]'),
  game: document.querySelector('[data-step="game"]')
}

const btnBack = document.getElementById("btnBack")
const btnContinue = document.getElementById("btnContinue")
const modeCards = steps.mode.querySelectorAll(".card")
const sizeChips = steps.size.querySelectorAll(".chip")
const diffChips = steps.difficulty.querySelectorAll(".chip")
const sizeNote = document.getElementById("sizeNote")

const boardEl = document.getElementById("board")
const turnLabel = document.getElementById("turnLabel")
const diffTag = document.getElementById("diffTag")
const scoreX = document.getElementById("scoreX")
const scoreO = document.getElementById("scoreO")
const scoreD = document.getElementById("scoreD")
const badgeP1 = document.getElementById("badgeP1")
const badgeP2 = document.getElementById("badgeP2")

const btnHome = document.getElementById("btnHome")
const btnReplay = document.getElementById("btnReplay")
const btnExit = document.getElementById("btnExit")

const modal = document.getElementById("resultModal")
const resultText = document.getElementById("resultText")
const resultIcon = document.getElementById("resultIcon")
const modalHome = document.getElementById("modalHome")
const modalReplay = document.getElementById("modalReplay")
const modalExit = document.getElementById("modalExit")

const showStep = (key) => {
  Object.values(steps).forEach(s => s.classList.remove("active"))
  steps[key].classList.add("active")
  state.step = key
  btnBack.classList.toggle("hidden", key === "welcome")
}

const rand = (n) => Math.floor(Math.random()*n)
const clone = (arr) => arr.slice()

;(function bgParticles(){
  const c = document.getElementById("bgFX")
  const ctx = c.getContext("2d")
  const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
  let W, H, particles

  function resize(){
    W = c.width = innerWidth * DPR
    H = c.height = innerHeight * DPR
    c.style.width = innerWidth + "px"
    c.style.height = innerHeight + "px"
  }

  function makeParticles(){
    particles = Array.from({length: 60}, () => ({
      x: Math.random()*W,
      y: Math.random()*H,
      r: 1 + Math.random()*2,
      vx: -0.3 + Math.random()*0.6,
      vy: -0.3 + Math.random()*0.6,
      a: 0.4+Math.random()*0.6
    }))
  }

  function draw(){
    ctx.clearRect(0,0,W,H)
    particles.forEach(p=>{
      p.x += p.vx
      p.y += p.vy
      if(p.x<0||p.x>W) p.vx*=-1
      if(p.y<0||p.y>H) p.vy*=-1
      const grad = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,40*DPR)
      grad.addColorStop(0,`rgba(57,194,255,${0.25*p.a})`)
      grad.addColorStop(1,`rgba(57,194,255,0)`)
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(p.x,p.y,p.r*DPR,0,Math.PI*2)
      ctx.fill()
    })
    requestAnimationFrame(draw)
  }

  addEventListener("resize", ()=>{ resize(); makeParticles(); })
  resize(); makeParticles(); draw()
})()

btnContinue.addEventListener("click", () => showStep("mode"))

modeCards.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    state.mode = btn.dataset.mode
    showStep("size")
  })
})

sizeChips.forEach(chip=>{
  chip.addEventListener("click", ()=>{
    state.size = parseInt(chip.dataset.size,10)
    if(state.mode === "pvc"){
      sizeNote.textContent = `Board: ${state.size}×${state.size}. Choose AI difficulty.`
      showStep("difficulty")
    }else{
      startGame()
      showStep("game")
    }
  })
})

diffChips.forEach(chip=>{
  chip.addEventListener("click", ()=>{
    state.diff = chip.dataset.diff
    startGame()
    showStep("game")
  })
})

btnBack.addEventListener("click", ()=>{
  if(state.step === "mode") showStep("welcome")
  else if(state.step === "size") showStep("mode")
  else if(state.step === "difficulty") showStep("size")
  else if(state.step === "game") showStep(state.mode==="pvc" ? "difficulty" : "size")
})

function startGame(){
  const n = state.size
  state.board = Array(n*n).fill(null)
  state.gameOver = false

  const starter = Math.random() < 0.5 ? "X" : "O"
  state.turn = starter

  if(state.mode === "pvc"){
    if(Math.random() < 0.5){
      state.humanMark = "X"
      state.aiMark = "O"
    }else{
      state.humanMark = "O"
      state.aiMark = "X"
    }
  }else{
    state.humanMark = "X"
    state.aiMark = null
  }

  badgeP1.textContent = "X"
  badgeP2.textContent = "O"
  diffTag.hidden = state.mode !== "pvc"
  if(!diffTag.hidden){
    const map = { "easy":"Easy","medium":"Medium","hard":"Hard","very-hard":"Very Hard" }
    diffTag.textContent = `Difficulty: ${map[state.diff]}`
  }
  updateTurnLabel()

  boardEl.style.setProperty("--n", n)
  boardEl.innerHTML = ""
  const winLayer = document.createElement("div")
  winLayer.className = "win-line"
  boardEl.appendChild(winLayer)

  for(let i=0;i<n*n;i++){
    const cell = document.createElement("div")
    cell.className = "cell"
    cell.dataset.index = i
    cell.addEventListener("click", onCellClick)
    boardEl.appendChild(cell)
  }

  if(state.mode === "pvc" && state.turn === state.aiMark){
    boardInteractivity(false)
    setTimeout(()=>aiMove(), 500)
  }else{
    boardInteractivity(true)
  }
}

function updateTurnLabel(){
  const who = (state.mode==="pvc") ? (state.turn===state.humanMark ? "Player" : "Computer") : (state.turn==="X" ? "Player X" : "Player O")
  turnLabel.textContent = `${who} turn (${state.turn})`
}

function onCellClick(e){
  if(state.gameOver) return
  const idx = parseInt(e.currentTarget.dataset.index,10)
  if(state.board[idx]) return

  const isHumanTurn = (state.mode === "pvp") || (state.turn === state.humanMark)
  if(!isHumanTurn) return

  placeMark(idx, state.turn)
  const outcome = checkOutcome()
  if(outcome.done){
    endGame(outcome)
    return
  }

  state.turn = state.turn === "X" ? "O" : "X"
  updateTurnLabel()

  if(state.mode === "pvc" && state.turn === state.aiMark){
    boardInteractivity(false)
    setTimeout(()=>aiMove(), 400)
  }
}

function boardInteractivity(enable){
  const cells = boardEl.querySelectorAll(".cell")
  cells.forEach(c=>{ c.classList.toggle("disabled", !enable) })
}

function placeMark(idx, mark){
  state.board[idx] = mark
  const cell = boardEl.querySelector(`.cell[data-index="${idx}"]`)
  cell.classList.add("played")
  const m = document.createElement("div")
  m.className = `mark ${mark.toLowerCase()}`
  cell.appendChild(m)
}

function checkOutcome(){
  const n = state.size
  const B = state.board
  const at = (r,c)=>B[r*n + c]

  for(let r=0;r<n;r++){
    const first = at(r,0)
    if(!first) continue
    let ok = true
    for(let c=1;c<n;c++){ if(at(r,c)!==first){ ok=false; break } }
    if(ok){ return { done:true, winner:first, line:lineGeom({ type:"row", index:r }) } }
  }

  for(let c=0;c<n;c++){
    const first = at(0,c)
    if(!first) continue
    let ok = true
    for(let r=1;r<n;r++){ if(at(r,c)!==first){ ok=false; break } }
    if(ok){ return { done:true, winner:first, line:lineGeom({ type:"col", index:c }) } }
  }

  {
    const first = at(0,0)
    if(first){
      let ok=true
      for(let i=1;i<n;i++){ if(at(i,i)!==first){ ok=false; break } }
      if(ok) return { done:true, winner:first, line:lineGeom({type:"diag", dir:"tlbr"}) }
    }
  }

  {
    const first = at(0,n-1)
    if(first){
      let ok=true
      for(let i=1;i<n;i++){ if(at(i,n-1-i)!==first){ ok=false; break } }
      if(ok) return { done:true, winner:first, line:lineGeom({type:"diag", dir:"trbl"}) }
    }
  }

  if(B.every(x=>x)) return { done:true, winner:null, line:null }
  return { done:false }
}

function lineGeom(info){
  const n = state.size
  const gap = 12, pad = 14
  const cell = (boardEl.clientWidth - 2*pad - (n-1)*gap) / n
  const total = boardEl.clientWidth - 2*pad
  const bar = { x:0, y:0, w:total, rot:0 }

  if(info.type==="row"){
    bar.w = total
    bar.x = pad
    bar.y = pad + info.index*(cell+gap) + cell/2
    bar.rot = 0
  }else if(info.type==="col"){
    bar.w = total
    bar.x = pad
    bar.y = pad + cell/2
    bar.rot = 90
    bar._colIndex = info.index
    bar._cell = cell
    bar._gap = gap
    bar._pad = pad
  }else if(info.type==="diag" && info.dir==="tlbr"){
    bar.x = pad; bar.y = pad + cell/2; bar.rot = 45; bar.w = Math.sqrt(2)*total
  }else if(info.type==="diag" && info.dir==="trbl"){
    bar.x = pad; bar.y = pad + cell/2; bar.rot = -45; bar.w = Math.sqrt(2)*total
  }
  return bar
}

function drawWinLine(geom){
  const layer = boardEl.querySelector(".win-line")
  layer.innerHTML = ""
  if(!geom) return
  const bar = document.createElement("div")
  bar.className = "bar"
  bar.style.left = geom.x + "px"
  bar.style.top = geom.y + "px"
  bar.style.width = geom.w + "px"
  bar.style.transform = `rotate(${geom.rot}deg)`
  if(geom._colIndex !== undefined){
    const shift = geom._pad + geom._colIndex*(geom._cell+geom._gap) + geom._cell/2 - (geom._pad + geom._cell/2)
    bar.style.transform = `translateY(${shift}px) rotate(90deg)`
  }
  layer.appendChild(bar)
}

function aiMove(){
  if(state.gameOver) return

  const n = state.size
  const diff = state.diff
  const board = state.board
  const ai = state.aiMark
  const human = state.humanMark

  const params = {
    "easy":      { lookahead: 1, randomness: 0.35 },
    "medium":    { lookahead: 2, randomness: 0.18 },
    "hard":      { lookahead: n === 3 ? 6 : 3, randomness: 0.05 },
    "very-hard": { lookahead: n === 3 ? 9 : 5, randomness: 0.0 }
  }[diff]

  let moveIndex
  if(Math.random() < params.randomness){
    const legal = board.map((v,i)=> v?null:i).filter(i=>i!==null)
    moveIndex = legal[rand(legal.length)]
  }else{
    moveIndex = bestMove(board, ai, human, n, params.lookahead)
  }

  placeMark(moveIndex, ai)
  const outcome = checkOutcome()
  if(outcome.done){ endGame(outcome); return }

  state.turn = human
  updateTurnLabel()
  boardInteractivity(true)
}

function bestMove(board, ai, human, n, depthLimit){
  const wins = immediateWins(board, n)
  if(wins[ai].length) return wins[ai][0]
  if(wins[human].length) return wins[human][0]

  const empty = board.flatMap((v,i)=> v?[]:[i])
  let best = -Infinity, idx = empty[0]

  for(const i of empty){
    const newB = clone(board); newB[i] = ai
    const score = minimax(newB, false, ai, human, n, depthLimit-1, -Infinity, Infinity)
    if(score > best){ best = score; idx = i }
  }
  return idx
}

function minimax(board, isAITurn, ai, human, n, depth, alpha, beta){
  const outcome = terminal(board, n)
  if(outcome !== null){
    if(outcome === ai) return 1000 + depth
    if(outcome === human) return -1000 - depth
    return 0
  }
  if(depth <= 0){
    return evaluate(board, ai, human, n)
  }

  const player = isAITurn ? ai : human
  const empties = board.flatMap((v,i)=> v?[]:[i])

  if(isAITurn){
    let best = -Infinity
    for(const i of empties){
      const b = clone(board); b[i] = player
      const val = minimax(b, false, ai, human, n, depth-1, alpha, beta)
      best = Math.max(best, val)
      alpha = Math.max(alpha, val)
      if(beta <= alpha) break
    }
    return best
  }else{
    let best = Infinity
    for(const i of empties){
      const b = clone(board); b[i] = player
      const val = minimax(b, true, ai, human, n, depth-1, alpha, beta)
      best = Math.min(best, val)
      beta = Math.min(beta, val)
      if(beta <= alpha) break
    }
    return best
  }
}

function terminal(B, n){
  const at = (r,c)=>B[r*n+c]
  for(let r=0;r<n;r++){
    const v = at(r,0); if(v && [...Array(n).keys()].every(c=>at(r,c)===v)) return v
  }
  for(let c=0;c<n;c++){
    const v = at(0,c); if(v && [...Array(n).keys()].every(r=>at(r,c)===v)) return v
  }
  { const v = at(0,0); if(v && [...Array(n).keys()].every(i=>at(i,i)===v)) return v }
  { const v = at(0,n-1); if(v && [...Array(n).keys()].every(i=>at(i,n-1-i)===v)) return v }
  if(B.every(x=>x)) return "D"
  return null
}

function immediateWins(board, n){
  const result = { X:[], O:[] }
  const empties = board.flatMap((v,i)=> v?[]:[i])
  for(const i of empties){
    for(const m of ["X","O"]){
      const b = clone(board); b[i] = m
      if(terminal(b, n) === m) result[m].push(i)
    }
  }
  return result
}

function evaluate(board, ai, human, n){
  const lines = collectLines(board, n)
  let score = 0
  for(const line of lines){
    const marks = line.map(i=>board[i])
    const xs = marks.filter(v=>v==="X").length
    const os = marks.filter(v=>v==="O").length
    if(xs && os) continue
    const filled = xs + os
    const weight = (filled===n-1? 50 : filled===n-2 ? 12 : 3)
    if(xs===0 && os>0) score += (ai==="O" ? weight*os : -weight*os)
    else if(os===0 && xs>0) score += (ai==="X" ? weight*xs : -weight*xs)
  }
  if(n===3){
    const center = 4
    if(board[center]===ai) score += 6
    else if(board[center]===human) score -= 6
  }
  return score
}

function collectLines(board, n){
  const lines = []
  for(let r=0;r<n;r++) lines.push([...Array(n).keys()].map(c=>r*n+c))
  for(let c=0;c<n;c++) lines.push([...Array(n).keys()].map(r=>r*n+c))
  lines.push([...Array(n).keys()].map(i=>i*n+i))
  lines.push([...Array(n).keys()].map(i=>i*n+(n-1-i)))
  return lines
}

function endGame({ winner, line }){
  state.gameOver = true
  boardInteractivity(false)
  drawWinLine(line)

  if(winner === "X") state.scores.X++
  else if(winner === "O") state.scores.O++
  else state.scores.D++

  scoreX.textContent = state.scores.X
  scoreO.textContent = state.scores.O
  scoreD.textContent = state.scores.D

  let text = "DRAW", icon = "😐"
  if(winner){ text = `PLAYER ${winner} WINS`; icon = (winner==="X" ? "🔥" : "💫") }
  resultText.textContent = text
  resultIcon.textContent = icon
  modal.classList.remove("hidden")
}

function resetBoardForReplay(){
  startGame()
}

function goHome(){
  modal.classList.add("hidden")
  showStep("mode")
}

function doExit(){
  modal.classList.add("hidden")
  state.scores = { X:0, O:0, D:0 }
  scoreX.textContent = 0
  scoreO.textContent = 0
  scoreD.textContent = 0
  state.mode = null
  state.diff = "easy"
  state.size = 3
  showStep("welcome")
}

btnHome.addEventListener("click", ()=> showStep("mode"))
btnReplay.addEventListener("click", ()=> resetBoardForReplay())
btnExit.addEventListener("click", ()=> doExit())

modalHome.addEventListener("click", ()=> goHome())
modalReplay.addEventListener("click", ()=>{ modal.classList.add("hidden"); resetBoardForReplay() })
modalExit.addEventListener("click", ()=> doExit())

showStep("welcome")
