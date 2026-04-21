let isWiggly = true;
let strokes = [];
let currentPoints = [];
let animationId = null;

// limits max undos, -1 for unlimited
let maxUndos = 5;
let currentUndos = 0;

const colors = DEFAULT_PALETTE.find((p) => p.name === "Nord-ish");
const PIXEL_SCALE = 4;

const DISPLAY_WIDTH = 800;
const DISPLAY_HEIGHT = 600;

const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.lineWidth = 5;
ctx.lineCap = "square";
ctx.lineJoin = "miter";
ctx.miterLimit = 2;

let backgroundColor = colors.background;
let strokeColor = colors.foreground;

canvas.style.backgroundColor = colors.background;
document.body.style.backgroundImage = `radial-gradient(${colors.foreground} 0.8px, ${colors.background} 0.8px)`;
document.body.style.color = colors.foreground;

let isDrawing = false;
let isErasing = false;
let eraserWidth = 15;

const wiggleButton = document.getElementById("wiggle-btn");
const penButton = document.getElementById("pen-btn");
const eraserButton = document.getElementById("eraser-btn");
const undoButton = document.getElementById("undo-btn");
const nukeButton = document.getElementById("nuke-btn");

// toggles wigglyniliness
wiggleButton.addEventListener("click", (e) => {
  isWiggly = !isWiggly;
  if (isWiggly) {
    wiggleButton.classList.add("active");
  } else {
    wiggleButton.classList.remove("active");
  }
});

// toggles eraser
penButton.addEventListener("click", (e) => {
  isErasing = false;
  canvas.style.cursor = "default";
  penButton.classList.add("active");
  eraserButton.classList.remove("active");
});

eraserButton.addEventListener("click", (e) => {
  isErasing = true;
  canvas.style.cursor = "cell";
  penButton.classList.remove("active");
  eraserButton.classList.add("active");
});

// Undo last action
undoButton.addEventListener("click", (e) => {
  if (currentUndos > 0) {
    strokes.pop();
    currentUndos--;
  }
});

// deletes whole drawing
nukeButton.addEventListener("click", (e) => {
  strokes.length = 0;
});

// mouse drawing events
canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  currentPoints = [{ x: e.offsetX, y: e.offsetY }];
  startAnimation();
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  currentPoints.push({ x: e.offsetX, y: e.offsetY });
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;

  stopDrawing();
});

canvas.addEventListener("mouseleave", (e) => {
  if (isDrawing) {
    stopDrawing();
  }
});

function stopDrawing() {
  if (currentPoints.length >= 1) {
    // Store the stroke WITH its color/eraser state
    strokes.push({
      points: [...currentPoints],
      isEraser: isErasing,
      color: isErasing ? backgroundColor : strokeColor,
    });

    if (currentUndos < (maxUndos > 0 ? maxUndos : currentUndos + 1)) {
      currentUndos++;
    }
  }
  isDrawing = false;
  currentPoints = [];
}

const WIGGLENESS = 2; // wiggleniliness coeficient more equals more wiggly!
const WIGGLE_FPS = 12; // Slows down the wiggle
const WIGGLE_INTERVAL = 1000 / WIGGLE_FPS;
let lastWiggleTime = 0;
let wiggleFrame = 0;
let globalPointCounter = 0;

// Pre-generate a large array of random values between -0.5 and 0.5
const NOISE_SIZE = 5000;
const noiseTableX = Array.from(
  { length: NOISE_SIZE },
  () => Math.random() - 0.5,
);
const noiseTableY = Array.from(
  { length: NOISE_SIZE },
  () => Math.random() - 0.5,
);

function startAnimation() {
  if (animationId) return;

  function animate(timestamp) {
    if (!lastWiggleTime) lastWiggleTime = timestamp;

    // Only tick the wiggle frame forward 12 times a second
    if (timestamp - lastWiggleTime >= WIGGLE_INTERVAL) {
      wiggleFrame++;
      lastWiggleTime = timestamp;
    }

    // Draw everything at 60 FPS so the mouse feels instantly responsive!
    drawAllStrokes();
    animationId = requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

function drawAllStrokes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Reset the point counter every frame so static points get the same random value
  globalPointCounter = 0;

  strokes.forEach((stroke) => {
    drawStroke(stroke.points, stroke.isEraser, stroke.color);
  });

  if (currentPoints.length >= 1) {
    drawStroke(
      currentPoints,
      isErasing,
      isErasing ? backgroundColor : strokeColor,
    );
  }
}

function drawStroke(points, isEraserMode, color) {
  if (points.length === 0) return;

  ctx.save();
  ctx.lineCap = "square";
  ctx.lineJoin = "miter";

  if (isEraserMode) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = eraserWidth;
  } else {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 5;
  }

  // Helper function to grab a locked random value from our noise table
  function getWiggle() {
    if (!isWiggly || isEraserMode) return { x: 0, y: 0 };

    // We multiply wiggleFrame by a large prime number (137).
    // This forces the wiggle to "jump" randomly in place every 12 frames,
    // rather than looking like an ant crawling smoothly along the line.
    const index = (globalPointCounter + wiggleFrame * 137) % NOISE_SIZE;

    return {
      x: Math.round(noiseTableX[index] * WIGGLENESS),
      y: Math.round(noiseTableY[index] * WIGGLENESS),
    };
  }

  if (points.length === 1) {
    ctx.beginPath();
    let wiggle = getWiggle();
    globalPointCounter++; // Move to the next random number for the next point

    let x = points[0].x + wiggle.x;
    let y = points[0].y + wiggle.y;

    const halfWidth = ctx.lineWidth / 2;
    ctx.fillRect(x - halfWidth, y - halfWidth, ctx.lineWidth, ctx.lineWidth);
  } else {
    ctx.beginPath();

    let startWiggle = getWiggle();
    globalPointCounter++;
    ctx.moveTo(points[0].x + startWiggle.x, points[0].y + startWiggle.y);

    for (let i = 1; i < points.length; i++) {
      let wiggle = getWiggle();
      globalPointCounter++;
      ctx.lineTo(points[i].x + wiggle.x, points[i].y + wiggle.y);
    }

    ctx.stroke();
  }

  ctx.restore();
}
