let letters = []
let queue = []
let isDown = false

function setup() {
  createCanvas(600, 600)
  textSize(16)
  textFont("Georgia")
  
  let paragraph = "Alice was beginning to get very tired of sitting by her sister on the bank."
  let x = 50
  let y = 50
  let maxWidth = 500
  
  for (let i = 0; i < paragraph.length; i++) {
    let ch = paragraph[i]
    let w = textWidth(ch)
    if (x + w > maxWidth) {
      x = 50
      y = y + 24
    }
    letters.push({
      char: ch,
      x: x, y: y,
      homeX: x, homeY: y,
      px: x, py: y,
      peeled: false
    })
    x = x + w
  }
  
  queue = buildQueue()
}

function buildQueue() {
  // group letters by line (y value)
  let lines = {}
  for (let l of letters) {
    if (!lines[l.y]) lines[l.y] = []
    lines[l.y].push(l)
  }
  
  // sort lines top to bottom then flip so bottom line is first
  let sortedYs = Object.keys(lines).map(Number).sort((a, b) => a - b).reverse()
  
  // snake through lines alternating direction
  let q = []
  for (let i = 0; i < sortedYs.length; i++) {
    let line = lines[sortedYs[i]].slice()
    if (i % 2 === 0) line.reverse() // even = right to left
    for (let l of line) q.push(l)
  }
  return q
}

function solveConstraints() {
  for (let iter = 0; iter < 15; iter++) {
    for (let i = 0; i < letters.length - 1; i++) {
      let a = letters[i]
      let b = letters[i + 1]
      if (!a.peeled || !b.peeled) continue
      let dx = b.x - a.x
      let dy = b.y - a.y
      let d = sqrt(dx * dx + dy * dy)
      if (d === 0) continue
      let restLength = 20
      let diff = (d - restLength) / d
      a.x = a.homeX
      b.x = b.homeX
      if (!a.pinned) {
        a.y += dy * diff * 0.5
      }
      b.y -= dy * diff * 0.5
    }
  }
}

function draw() {
  background(240, 230, 210)
  fill(50)
  noStroke()
  
  // draw unpeeled letters
  for (let l of letters) {
    if (!l.peeled) {
      text(l.char, l.homeX, l.homeY)
    }
  }
  
  // auto extract next letter from queue while mouse is held
  if (isDown && queue.length > 0) {
    let next = queue.shift() // take first letter from queue
    next.peeled = true
    next.px = next.x
    next.py = next.y
  }
  
  // update physics for peeled letters
  for (let l of letters) {
    if (!l.peeled) continue
    let vy = (l.y - l.py) * 0.95
    l.py = l.y
    l.y += vy + 0.3
    if (l.y > 570) {
      l.y = 570
      l.py = l.y + vy * 0.3
    }
  }
  
  solveConstraints()
  
  // draw peeled letters
  for (let l of letters) {
    if (l.peeled) {
      fill(50)
      noStroke()
      text(l.char, l.x, l.y)
    }
  }
}

function mousePressed() {
  isDown = true
}

function mouseReleased() {
  isDown = false
}