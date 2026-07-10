let letters = []
let queue = []
let ropeOrder = []
let lastPeelTime = 0
let heldLetter = null
let peelRadius = 30
let peelDelay = 100
let cursorFollow = 0.12

function setup() {
  createCanvas(windowWidth, windowHeight)
  textSize(16)
  textFont("Georgia")
  buildLetters()
}

function buildLetters() {
  letters = []
  queue = []
  ropeOrder = []
  heldLetter = null

  let paragraph = "AI was trained by reading an enormous amount of text from the internet. Billions of pages including Stack Overflow, GitHub, coding tutorials, documentation, everything. So when you ask a coding question, it's not thinking the way you do. It's more like it has seen thousands of similar problems and solutions before and is pattern matching to your situation."

  textSize(16)
  textFont("Georgia")

  let maxWidth = min(600, windowWidth - 100)
  let startX = (windowWidth - maxWidth) / 2
  let x = startX
  let y = 80

  for (let i = 0; i < paragraph.length; i++) {
    let ch = paragraph[i]
    let w = textWidth(ch)
    if (x + w > startX + maxWidth) {
      x = startX
      y = y + 28
    }
    letters.push({
      index: i,
      char: ch,
      x: x, y: y,
      homeX: x, homeY: y,
      px: x, py: y,
      peeled: false,
      pinned: false,
      held: false,
      ropeIndex: -1  // will be set properly by buildQueue
    })
    x = x + w
  }

  queue = buildQueue()
  ropeOrder = queue.slice()
}

function buildQueue() {
  let lines = {}
  for (let l of letters) {
    if (!lines[l.homeY]) lines[l.homeY] = []
    lines[l.homeY].push(l)
  }
  let sortedYs = Object.keys(lines).map(Number).sort((a, b) => b - a)
  let q = []
  for (let i = 0; i < sortedYs.length; i++) {
    let line = lines[sortedYs[i]].slice()
    if (i % 2 === 0) line.reverse()
    q.push(...line)
  }
  for (let i = 0; i < q.length; i++) {
    q[i].ropeIndex = i
  }
  return q
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight)
  buildLetters()
}

function refreshPins() {
  for (let l of letters) l.pinned = false
  let peeled = ropeOrder.filter(l => l.peeled)
  peeled.slice(0, 2).forEach(l => { l.pinned = true })
}

function refreshHeldLetter() {
  for (let l of letters) l.held = false
  let peeledVisible = letters
    .filter(l => l.peeled && l.char.trim() !== "")
    .sort((a, b) => b.ropeIndex - a.ropeIndex)
  heldLetter = peeledVisible[0] || null
  if (heldLetter) heldLetter.held = true
}

function peelLetter(l) {
  l.peeled = true
  l.x = l.homeX
  l.y = l.homeY
  l.px = l.homeX
  l.py = l.homeY
}

function peelQueuedSpaces() {
  while (queue.length > 0 && queue[0].char.trim() === "") {
    peelLetter(queue.shift())
  }
}

function solveConstraints() {
  for (let iter = 0; iter < 5; iter++) {
    for (let i = 0; i < ropeOrder.length - 1; i++) {
      let a = ropeOrder[i]
      let b = ropeOrder[i + 1]
      if (!a.peeled || !b.peeled) continue
      let dx = b.x - a.x
      let dy = b.y - a.y
      let d = sqrt(dx * dx + dy * dy)
      if (d === 0) continue
      let restLength = 18
      let diff = (d - restLength) / d * 0.3
      if (a.pinned) {
        a.x = a.homeX
        a.y = a.homeY
      } else if (!a.held) {
        a.x += dx * diff
        a.y += dy * diff
      }
      if (b.pinned) {
        b.x = b.homeX
        b.y = b.homeY
      } else if (!b.held) {
        b.x -= dx * diff
        b.y -= dy * diff
      }
    }
  }
}

function draw() {
  background(0)
  
  // neon pink
  let neonPink = color(255, 20, 147)
  fill(neonPink)
  noStroke()

  // draw unpeeled paragraph
  for (let l of letters) {
    if (!l.peeled) {
      text(l.char, l.homeX, l.homeY)
    }
  }

  // physics
  for (let l of letters) {
    if (!l.peeled) continue
    if (l.pinned) {
      l.x = l.homeX
      l.y = l.homeY
      l.px = l.homeX
      l.py = l.homeY
      continue
    }
    if (l.held) {
      l.x += (mouseX - l.x) * cursorFollow
      l.y += (mouseY - l.y) * cursorFollow
      l.px = l.x
      l.py = l.y
      continue
    }
    let vx = (l.x - l.px) * 0.85
    let vy = (l.y - l.py) * 0.92
    l.px = l.x
    l.py = l.y
    l.x += vx * 0.2
    l.y += vy + 0.35
    if (l.y > height - 30) {
      l.y = height - 30
      l.py = l.y + vy * 0.1
    }
    if (l.x < 10) l.x = 10
    if (l.x > width - 10) l.x = width - 10
  }

  solveConstraints()

  // draw peeled letters
  fill(neonPink)
  noStroke()
  for (let l of letters) {
    if (l.peeled) {
      text(l.char, l.x, l.y)
    }
  }
}

function mouseDragged() {
  let now = millis()
  if (now - lastPeelTime > peelDelay) {
    peelQueuedSpaces()
    if (queue.length > 0) {
      let next = queue[0]
      let d = dist(mouseX, mouseY, next.homeX, next.homeY)
      let cursorBelowOrOnLine = mouseY >= next.homeY - 20

      if (d < peelRadius && cursorBelowOrOnLine) {
        queue.shift()
        peelLetter(next)
        peelQueuedSpaces()
        refreshPins()

        // release previous held letter in place
        if (heldLetter) {
          heldLetter.held = false
          heldLetter.px = heldLetter.x
          heldLetter.py = heldLetter.y
        }

        // make this new letter the held one
        heldLetter = next
        heldLetter.held = true

        lastPeelTime = now
      }
    }
  }
}

function mouseReleased() {
  if (heldLetter) {
    // freeze it exactly where it is
    heldLetter.px = heldLetter.x
    heldLetter.py = heldLetter.y
    heldLetter.held = false
    heldLetter = null
  }
  // freeze all peeled letters in place
  for (let l of letters) {
    if (l.peeled && !l.pinned) {
      l.px = l.x
      l.py = l.y
    }
  }
}