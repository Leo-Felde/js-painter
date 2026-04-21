// ============================================================================
// CANVAS SETUP
// ============================================================================
const PIXEL_SCALE = 4;
const DISPLAY_WIDTH = 560;
const DISPLAY_HEIGHT = 420;

const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.lineCap = "round";
ctx.lineJoin = "round";
ctx.miterLimit = 2;

const offscreenCanvas = document.createElement("canvas");
const offCtx = offscreenCanvas.getContext("2d");
offscreenCanvas.width = canvas.width;
offscreenCanvas.height = canvas.height;
offCtx.imageSmoothingEnabled = false;
offCtx.miterLimit = 2;

// ============================================================================
// STATE VARIABLES
// ============================================================================
let isWiggly = true;
let isDrawing = false;
let strokes = [];
let currentPoints = [];
let animationId = null;

// Drawing modes and properties
let currentMode = "pen"; // "pen", "color", or "eraser"
let currentColor = "#000000";
let penWidth = 7;
let colorWidth = 14;
let eraserWidth = 15;
let currentWidth = penWidth;

// Undo system
let maxUndos = 5;
let currentUndos = 0;

// ============================================================================
// WIGGLE ANIMATION
// ============================================================================
const WIGGLENESS = 2;
const WIGGLE_FPS = 12;
const WIGGLE_INTERVAL = 1000 / WIGGLE_FPS;
const NOISE_SIZE = 5000;

let lastWiggleTime = 0;
let wiggleFrame = 0;
let globalPointCounter = 0;
let currentStrokeSeed = Math.floor(Math.random() * NOISE_SIZE);

const noiseTableX = Array.from(
  { length: NOISE_SIZE },
  () => Math.random() - 0.5,
);
const noiseTableY = Array.from(
  { length: NOISE_SIZE },
  () => Math.random() - 0.5,
);

// ============================================================================
// UI ELEMENTS
// ============================================================================
const wiggleButton = document.getElementById("wiggle-btn");
const penButton = document.getElementById("pen-btn");
const eraserButton = document.getElementById("eraser-btn");
const undoButton = document.getElementById("undo-btn");
const nukeButton = document.getElementById("nuke-btn");

const primaryBtn = document.getElementById("primary-color");
const secondaryBtn = document.getElementById("secondary-color");
const tertiaryBtn = document.getElementById("tertiary-color");

// ============================================================================
// PALETTE & STYLING
// ============================================================================
const colors = DEFAULT_PALETTE.find((p) => p.name === "Nord-ish");

let backgroundColor = "#ffffff";
let strokeColor = "#000000";

const applyPalette = () => {
  canvas.style.backgroundColor = colors.background;
  document.body.style.backgroundImage = `radial-gradient(${colors.foreground} 0.8px, ${colors.background} 0.8px)`;
  document.body.style.color = colors.foreground;

  primaryBtn.style.backgroundColor = colors.primary;
  secondaryBtn.style.backgroundColor = colors.secondary;
  tertiaryBtn.style.backgroundColor = colors.tertiary;

  backgroundColor = colors.background;
  strokeColor = colors.foreground;
  currentColor = colors.foreground;
};

applyPalette();

// ============================================================================
// BUTTON HELPERS
// ============================================================================
const clearAllActiveButtons = () => {
  primaryBtn.classList.remove("active");
  secondaryBtn.classList.remove("active");
  tertiaryBtn.classList.remove("active");
  penButton.classList.remove("active");
  eraserButton.classList.remove("active");
};

const setActiveColorButton = (activeBtn, color) => {
  clearAllActiveButtons();
  activeBtn.classList.add("active");

  currentMode = "color";
  currentColor = color;
  currentWidth = colorWidth;
  canvas.style.cursor = "default";
};

// ============================================================================
// EXPORT FUNCTIONALITY
// ============================================================================

// Export as static PNG
function exportAsPNG(transparent = false) {
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const exportCtx = exportCanvas.getContext("2d");

  if (!transparent) {
    exportCtx.fillStyle = canvas.style.backgroundColor;
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  }

  exportCtx.drawImage(canvas, 0, 0);

  const link = document.createElement("a");
  link.href = exportCanvas.toDataURL("image/png");
  link.download = `painting-${Date.now()}.png`;
  link.click();
}

// Export as animated GIF (using gif.js library)
async function exportAsGIF() {
  // COMO FAZER???????
}

// Add export buttons to your HTML and wire them up:
document
  .getElementById("export-png-btn")
  .addEventListener("click", () => exportAsPNG(false));
document
  .getElementById("export-png-transparent-btn")
  .addEventListener("click", () => exportAsPNG(true));
document
  .getElementById("export-gif-btn")
  .addEventListener("click", () => exportAsGIF(false));

// ============================================================================
// COLOR BUTTON EVENT LISTENERS
// ============================================================================
primaryBtn.addEventListener("click", (e) => {
  setActiveColorButton(primaryBtn, colors.primary);
});

secondaryBtn.addEventListener("click", (e) => {
  setActiveColorButton(secondaryBtn, colors.secondary);
});

tertiaryBtn.addEventListener("click", (e) => {
  setActiveColorButton(tertiaryBtn, colors.tertiary);
});

// ============================================================================
// TOOL BUTTON EVENT LISTENERS
// ============================================================================
wiggleButton.addEventListener("click", (e) => {
  isWiggly = !isWiggly;
  if (isWiggly) {
    wiggleButton.classList.add("active");
  } else {
    wiggleButton.classList.remove("active");
  }
});

penButton.addEventListener("click", (e) => {
  clearAllActiveButtons();
  penButton.classList.add("active");

  currentMode = "pen";
  currentColor = colors.foreground;
  currentWidth = penWidth;
  canvas.style.cursor = "default";
});

eraserButton.addEventListener("click", (e) => {
  clearAllActiveButtons();
  eraserButton.classList.add("active");

  currentMode = "eraser";
  currentWidth = eraserWidth;
  canvas.style.cursor = "cell";
});

undoButton.addEventListener("click", (e) => {
  if (currentUndos > 0) {
    strokes.pop();
    currentUndos--;
  }
});

nukeButton.addEventListener("click", (e) => {
  strokes.length = 0;
  currentUndos = 0;
});

// ============================================================================
// CANVAS DRAWING EVENT LISTENERS
// ============================================================================
canvas.addEventListener("mousedown", (e) => {
  const pos = getScaledMousePos(e);
  isDrawing = true;
  currentPoints = [{ x: pos.x, y: pos.y }];
  startAnimation();
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  const pos = getScaledMousePos(e);
  currentPoints.push({ x: pos.x, y: pos.y });
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

// ============================================================================
// STROKE MANAGEMENT
// ============================================================================
function stopDrawing() {
  if (currentPoints.length >= 1) {
    strokes.push({
      points: [...currentPoints],
      mode: currentMode,
      color: currentColor,
      lineWidth: currentWidth,
      layer: currentMode === "color" ? 0 : 1,
      seed: currentStrokeSeed,
    });

    if (currentUndos < (maxUndos > 0 ? maxUndos : currentUndos + 1)) {
      currentUndos++;
    }
  }
  isDrawing = false;
  currentPoints = [];
  currentStrokeSeed = Math.floor(Math.random() * NOISE_SIZE);
}

// ============================================================================
// ANIMATION LOOP
// ============================================================================
function startAnimation() {
  if (animationId) return;

  function animate(timestamp) {
    if (!lastWiggleTime) lastWiggleTime = timestamp;

    if (timestamp - lastWiggleTime >= WIGGLE_INTERVAL) {
      wiggleFrame++;
      lastWiggleTime = timestamp;
    }

    drawAllStrokes();
    animationId = requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

// ============================================================================
// RENDERING
// ============================================================================

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// due to the actual resolution being smaller than the screen, get position relative to canvas size :)
function getScaledMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function drawAllStrokes() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  offCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

  const allStrokes = [...strokes];
  if (currentPoints.length >= 1) {
    allStrokes.push({
      points: currentPoints,
      mode: currentMode,
      color: currentColor,
      lineWidth: currentWidth,
      layer: currentMode === "color" ? 0 : 1,
      seed: currentStrokeSeed,
    });
  }

  // PASS 1: Draw Colors and Erasers to the main canvas
  allStrokes.forEach((stroke) => {
    if (stroke.layer === 0 || stroke.mode === "eraser") {
      drawStroke(
        ctx,
        stroke.points,
        stroke.mode,
        stroke.color,
        stroke.lineWidth,
        stroke.seed,
      );
    }
  });

  // PASS 2: Draw Pens and Erasers to the offscreen canvas
  allStrokes.forEach((stroke) => {
    if (stroke.layer === 1 || stroke.mode === "eraser") {
      drawStroke(
        offCtx,
        stroke.points,
        stroke.mode,
        stroke.color,
        stroke.lineWidth,
        stroke.seed,
      );
    }
  });

  // MERGE: Put the Pen layer on top of the Color layer
  ctx.drawImage(offscreenCanvas, 0, 0);
}

function drawStroke(targetCtx, points, mode, color, lineWidth, strokeSeed = 0) {
  if (points.length === 0) return;

  targetCtx.save();

  if (mode === "eraser") {
    targetCtx.globalCompositeOperation = "destination-out";
  } else {
    targetCtx.globalCompositeOperation = "source-over";
  }

  targetCtx.lineCap = "round";
  targetCtx.lineJoin = "round";
  targetCtx.lineWidth = lineWidth;
  targetCtx.strokeStyle = color;
  targetCtx.fillStyle = color;

  function getWiggle(pointIndex) {
    if (!isWiggly || mode === "eraser") return { x: 0, y: 0 };
    const index = (strokeSeed + pointIndex + wiggleFrame * 137) % NOISE_SIZE;
    return {
      x: Math.round(noiseTableX[index] * WIGGLENESS),
      y: Math.round(noiseTableY[index] * WIGGLENESS),
    };
  }

  if (points.length === 1) {
    let wiggle = getWiggle(0);
    let x = points[0].x + wiggle.x;
    let y = points[0].y + wiggle.y;
    const halfWidth = lineWidth / 2;
    targetCtx.fillRect(x - halfWidth, y - halfWidth, lineWidth, lineWidth);
  } else {
    targetCtx.beginPath();
    let startWiggle = getWiggle(0);
    targetCtx.moveTo(points[0].x + startWiggle.x, points[0].y + startWiggle.y);

    for (let i = 1; i < points.length; i++) {
      let wiggle = getWiggle(i);
      targetCtx.lineTo(points[i].x + wiggle.x, points[i].y + wiggle.y);
    }
    targetCtx.stroke();
  }

  targetCtx.restore();
}
