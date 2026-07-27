let letters = []
let queue = []
let ropeOrder = []
let lastPeelTime = 0
let peelRadius = 25
let peelDelay = 50
let grabbedLetter = null
let grabOffsetX = 0
let grabOffsetY = 0
let stickerImages = []
let stickers = []

const DAMPING = 0.97
const GRAVITY = 0.15
const ITERATIONS = 12

function preload() {
  stickerImages = [
    loadImage('portfolio update/icedmatchalatte.png'),
    loadImage('portfolio update/goodvibes.png'),
    loadImage('portfolio update/bow.png'),
    loadImage('portfolio update/matchatogo.png'),
    loadImage('portfolio update/whisk.png'),
    loadImage('portfolio update/strawberry.png'),
    loadImage('portfolio update/hot.png'),
    loadImage('portfolio update/pinkcup.png'),
    loadImage('portfolio update/curvyglass.png'),
    loadImage('portfolio update/flower.png'),
    loadImage('portfolio update/girlie.png'),
    // add the rest of your filenames here, matching your folder exactly
  ]
}

function setup() {
  createCanvas(windowWidth, windowHeight)
  textSize(20)
  textFont("Georgia")
  buildLetters()
  placeStickers()  
}

function buildLetters() {
  letters = []
  queue = []
  ropeOrder = []

 let paragraph = "Matcha isn't just green tea ground into powder. The tea plants are shaded for weeks before harvest, which boosts chlorophyll and amino acids, giving matcha its vivid green color and umami depth. Unlike steeped tea where you discard the leaves, with matcha you whisk the entire leaf into your cup, which means you're consuming far more caffeine and antioxidants than a regular cup of green tea."
  textSize(20)
  textFont("Georgia")

  let maxWidth = min(490, windowWidth - 100)
  let startX = (windowWidth - maxWidth) / 2
  let x = startX
  let y = 80

  let words = paragraph.split(" ")
  let currentLine = []
  let allLines = []
  
  for (let w = 0; w < words.length; w++) {
    let word = words[w]
    let forceBreak = false
  
    if (word.includes("\n")) {
      forceBreak = true
      word = word.replace("\n", "")
    }
  
    word = word + (w < words.length - 1 ? " " : "")
    let wordWidth = textWidth(word)
  
    if (x + wordWidth > maxWidth && x > 0) {
      allLines.push({ letters: currentLine, width: x, y: y })
      currentLine = []
      x = 0
      y = y + 28
    }
  
    for (let i = 0; i < word.length; i++) {
      let ch = word[i]
      let w2 = textWidth(ch)
      currentLine.push({ char: ch, xOffset: x, w: w2 })
      x = x + w2
    }
  
    if (forceBreak) {
      allLines.push({ letters: currentLine, width: x, y: y })
      currentLine = []
      x = 0
      y = y + 28
    }
  }
  allLines.push({ letters: currentLine, width: x, y: y })

  // now center each line and build final letters array
// justify each line except the last one
for (let lineIndex = 0; lineIndex < allLines.length; lineIndex++) {
  let line = allLines[lineIndex]
  let isLastLine = lineIndex === allLines.length - 1

  if (isLastLine || line.letters.length === 0) {
    // last line stays left-aligned within centered block, not stretched
    let lineStartX = startX + (maxWidth - line.width) / 2
    for (let l of line.letters) {
      let finalX = lineStartX + l.xOffset
      letters.push({
        index: letters.length,
        char: l.char,
        x: finalX, y: line.y,
        homeX: finalX, homeY: line.y,
        px: finalX, py: line.y,
        locked: true,
        ropeIndex: -1
      })
    }
    continue
  }

  // count spaces in this line to distribute extra width
  let spaceCount = line.letters.filter(l => l.char === ' ').length
  let extraSpace = maxWidth - line.width
  let extraPerSpace = spaceCount > 0 ? extraSpace / spaceCount : 0

  let cursorX = startX
  for (let l of line.letters) {
    letters.push({
      index: letters.length,
      char: l.char,
      x: cursorX, y: line.y,
      homeX: cursorX, homeY: line.y,
      px: cursorX, py: line.y,
      locked: true,
      ropeIndex: -1
    })
    cursorX += l.w
    if (l.char === ' ') {
      cursorX += extraPerSpace
    }
  }
}


  queue = buildQueue()
  ropeOrder = queue.slice()
}

function placeStickers() {
  stickers = []
  let maxWidth = min(550, windowWidth - 100)
  let paragraphLeft = (windowWidth - maxWidth) / 2
  let paragraphRight = paragraphLeft + maxWidth

  let layout = [
    { imgIndex: 0, side: 'left', xPercent: 0.3, yPercent: 0.1, targetSize: 110, rotation: 0.15 },
    { imgIndex: 1, side: 'right', xPercent: 0.2, yPercent: 0.4, targetSize: 90, rotation: 0.3 },
    { imgIndex: 2, side: 'left', xPercent: 0.5, yPercent: 0.3, targetSize: 60 },
    { imgIndex: 3, side: 'right', xPercent: 0.2, yPercent: 0.05, targetSize: 100 },
    { imgIndex: 4, side: 'left', xPercent: 0.2, yPercent: 0.4, targetSize: 90 },
    { imgIndex: 5, side: 'right', xPercent: 0.5, yPercent: 0.55, targetSize: 100, rotation: 0.3  },
    { imgIndex: 6, side: 'left', xPercent: 0.45, yPercent: 0.6, targetSize: 110 },
    { imgIndex: 7, side: 'right', xPercent: 0.3, yPercent: 0.8, targetSize: 100 },
    { imgIndex: 9, side: 'right', xPercent: 0.6, yPercent: 0.25, targetSize: 60 },
    { imgIndex: 10, side: 'left', xPercent: 0.2, yPercent: 0.8, targetSize: 80, rotation: 0.3  }
  ]

  for (let entry of layout) {
    let img = stickerImages[entry.imgIndex]
    if (!img) continue

    let x
    if (entry.side === 'left') {
      x = entry.xPercent * (paragraphLeft - 40) + 20
    } else {
      let space = windowWidth - paragraphRight - 40
      x = paragraphRight + 20 + entry.xPercent * space
    }

    let y = 60 + entry.yPercent * (windowHeight - 150)

    let aspectRatio = img.width / img.height
    let w, h
    if (aspectRatio > 1) {
      w = entry.targetSize
      h = entry.targetSize / aspectRatio
    } else {
      h = entry.targetSize
      w = entry.targetSize * aspectRatio
    }

    stickers.push({
      img: img,
      x: x,
      y: y,
      w: w,
      h: h,
      rotation: entry.rotation
    })
  }
}

function drawStickers() {
  for (let s of stickers) {
    push()
    translate(s.x, s.y)
    rotate(s.rotation)
    imageMode(CENTER)
    image(s.img, 0, 0, s.w, s.h)
    pop()
  }
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
  placeStickers()  
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

function solveLetterCollisions() {
  const RADIUS = 7
  for (let i = 0; i < letters.length; i++) {
    if (letters[i].locked) continue
    const a = letters[i]
    for (let j = i + 1; j < letters.length; j++) {
      if (letters[j].locked) continue
      if (Math.abs(i - j) === 1) continue
      const b = letters[j]
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx*dx + dy*dy) || 0.001
      const minDist = RADIUS * 2
      if (dist < minDist) {
        const overlap = (minDist - dist) / dist * 0.5
        a.x -= dx * overlap
        a.y -= dy * overlap
        b.x += dx * overlap
        b.y += dy * overlap
      }
    }
  }
}

function draw() {
  background(244, 239, 230)  // soft cream/oat
  drawGrain()
  drawStickers()  
  let sageGreen = color(124, 148, 115)  // muted sage green
  fill(sageGreen)
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
  solveLetterCollisions()
  // draw unlocked letters
  fill(sageGreen)
  noStroke()
  for (let l of letters) {
    if (!l.locked) {
      text(l.char, l.x, l.y)
    }
  }

  // change cursor based on proximity to interactive letters
let nearInteractive = false
for (let l of letters) {
  if (l.locked) continue
  let d = dist(mouseX, mouseY, l.x, l.y)
  if (d < 40) {
    nearInteractive = true
    break
  }
}

if (grabbedLetter) {
  cursor('grabbing')
} else if (nearInteractive) {
  cursor('grab')
} else {
  cursor(ARROW)
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

  if (grabbedLetter) {
    grabbedLetter.x = mouseX - grabOffsetX
    grabbedLetter.y = mouseY - grabOffsetY
    grabbedLetter.px = grabbedLetter.x
    grabbedLetter.py = grabbedLetter.y
  }
}




function mousePressed() {
  let nearest = null
  let nearestDist = 40
  for (let l of letters) {
    if (l.locked) continue
    let d = dist(mouseX, mouseY, l.x, l.y)
    if (d < nearestDist) {
      nearestDist = d
      nearest = l
    }
  }
  if (nearest) {
    grabbedLetter = nearest
    grabOffsetX = mouseX - nearest.x
    grabOffsetY = mouseY - nearest.y
  }
}


function mouseReleased() {
  grabbedLetter = null
}

function drawGrain() {
  randomSeed(42) // keeps the grain pattern consistent, not flickering every frame
  noStroke()
  for (let i = 0; i < 800; i++) {
    let gx = random(width)
    let gy = random(height)
    let size = random(1, 3)
    fill(255, 255, 255, random(15, 35)) // very faint white dots
    ellipse(gx, gy, size, size)
  }
}