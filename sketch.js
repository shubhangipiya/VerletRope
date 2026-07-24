let letters = []
let queue = []
let ropeOrder = []
let lastPeelTime = 0
let peelRadius = 25
let peelDelay = 100

const DAMPING = 0.97
const GRAVITY = 0.15
const ITERATIONS = 12

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
      locked: true,   // locked = stays in paragraph
      ropeIndex: -1
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

function peelLetter(l) {
  l.locked = false
  l.px = l.x
  l.py = l.y - 0.5  // tiny upward nudge like Daniel does
}

function peelQueuedSpaces() {
  while (queue.length > 0 && queue[0].char.trim() === "") {
    let s = queue.shift()
    s.locked = false
  }
}

function solveConstraints() {
  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < ropeOrder.length - 1; i++) {
      let a = ropeOrder[i]
      let b = ropeOrder[i + 1]
      if (a.locked && b.locked) continue

      let ax = a.x + textWidth(a.char) / 2
      let ay = a.y
      let bx = b.x + textWidth(b.char) / 2
      let by = b.y

      let dx = bx - ax
      let dy = by - ay
      let d = sqrt(dx * dx + dy * dy) || 0.001
      let restLength = 18
      let diff = (d - restLength) / d

      if (a.locked && !b.locked) {
        b.x -= dx * diff
        b.y -= dy * diff
      } else if (!a.locked && b.locked) {
        a.x += dx * diff
        a.y += dy * diff
      } else {
        a.x += dx * diff * 0.5
        a.y += dy * diff * 0.5
        b.x -= dx * diff * 0.5
        b.y -= dy * diff * 0.5
      }
    }
  }
}

function draw() {
  background(0)
  let neonPink = color(255, 20, 147)
  fill(neonPink)
  noStroke()

  // draw locked paragraph letters
  for (let l of letters) {
    if (l.locked) {
      text(l.char, l.homeX, l.homeY)
    }
  }

  // physics — gravity always on like Daniel's code
  for (let l of letters) {
    if (l.locked) continue
    let vx = (l.x - l.px) * DAMPING
    let vy = (l.y - l.py) * DAMPING
    l.px = l.x
    l.py = l.y
    l.x += vx
    l.y += vy + GRAVITY

    // floor bounce
    if (l.y > height - 30) {
      l.y = height - 30
      l.py = l.y + vy * 0.4
    }
    if (l.x < 10) l.x = 10
    if (l.x > width - 10) l.x = width - 10
  }

  solveConstraints()

  // draw unlocked letters
  fill(neonPink)
  noStroke()
  for (let l of letters) {
    if (!l.locked) {
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
        lastPeelTime = now
      }
    }
  }
}

function mouseReleased() {
  // nothing — gravity keeps running naturally!
}