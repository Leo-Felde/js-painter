// ============================================================================
// CANVAS SETUP
// ============================================================================

window.addEventListener("beforeunload", (e) => {
  if (strokes.length > 5) {
    e.preventDefault();
    e.returnValue = "";
    return "";
  }
});

const PIXEL_SCALE = 4;
const DISPLAY_WIDTH = 560;
const DISPLAY_HEIGHT = 420;

const canvas = document.getElementById("main-canvas");
const wrapper = document.getElementById("main-wrapper");
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
const penSizes = [5, 7, 9];
let penSizeIndex = 1;
let penWidth = penSizes[penSizeIndex];
const brushSizes = [7, 10, 16, 21, 26, 36];
let brushSizeIndex = 3;
let colorWidth = brushSizes[brushSizeIndex];
let eraserWidth = 15;
let currentWidth = penWidth;

// Undo system
let maxUndos = 5;
let currentUndos = 0;
let nukedStrokes = null; // Store nuked strokes for undo

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
const brushButton = document.getElementById("brush-btn");
const eraserButton = document.getElementById("eraser-btn");
const undoButton = document.getElementById("undo-btn");
const nukeButton = document.getElementById("nuke-btn");

const primaryBtn = document.getElementById("primary-color");
const secondaryBtn = document.getElementById("secondary-color");
const tertiaryBtn = document.getElementById("tertiary-color");
const backgroundBtn = document.getElementById("background-color");

const transparencyMaskCheckbox = document.getElementById(
  "transparency-mask-checkbox",
);
transparencyMaskCheckbox.checked = false;

let isTransparencyMask = false;
let backgroundBrushColor = "#ffffff";

const isMobile =
  navigator?.userAgentData?.mobile ??
  /Mobi|Android|iPhone/i.test(navigator.userAgent) ??
  false;
// ================================================================1============
// PALETTE & STYLING
// ============================================================================

const paletteBtn = document.getElementById("palette-btn");
const paletteModal = document.getElementById("palette-modal");
const paletteModalClose = document.getElementById("palette-modal-close");
const paletteList = document.getElementById("palette-list");

let currentEditingPalette = null;

paletteBtn.addEventListener("click", () => {
  paletteModal.style.display = "block";
  populatePaletteList();
});

paletteModalClose.addEventListener("click", () => {
  paletteModal.style.display = "none";
});

paletteModal.addEventListener("click", (e) => {
  if (e.target === paletteModal) {
    paletteModal.style.display = "none";
  }
});

// DEFAULT PALETTE INITIALIZATION
let colors = DEFAULT_PALETTE.find((p) => p.name === "default");
const styleSheet = new CSSStyleSheet();

let lastSelectedColor = {
  type: "primary",
  btn: primaryBtn,
  color: colors.primary,
};

let backgroundColor = colors.background ?? "#ffffff";
let strokeColor = colors.foreground ?? "#000000";

const applyPalette = () => {
  // Update CSS variables
  document.documentElement.style.setProperty(
    "--color-foreground",
    colors.foreground,
  );
  document.documentElement.style.setProperty(
    "--color-background",
    colors.background,
  );
  document.documentElement.style.setProperty("--color-primary", colors.primary);
  document.documentElement.style.setProperty(
    "--color-secondary",
    colors.secondary,
  );
  document.documentElement.style.setProperty(
    "--color-tertiary",
    colors.tertiary,
  );

  // Update canvas and buttons
  canvas.style.backgroundColor = colors.background;
  primaryBtn.style.backgroundColor = colors.primary;
  secondaryBtn.style.backgroundColor = colors.secondary;
  tertiaryBtn.style.backgroundColor = colors.tertiary;
  backgroundBtn.style.backgroundColor = colors.background;

  // Update state
  backgroundColor = colors.background;
  strokeColor = colors.foreground;

  if (currentMode === "color") {
    setActiveColorButton(lastSelectedColor.btn, lastSelectedColor.color);
  } else {
    currentColor = colors.foreground;
  }

  // Remap colors in existing strokes
  remapStrokeColors();

  // Redraw canvas
  drawAllStrokes();
};
selectPalette(colors);

function populatePaletteList() {
  paletteList.innerHTML = "";

  DEFAULT_PALETTE.forEach((palette) => {
    const paletteItem = document.createElement("div");
    paletteItem.className = "palette-item";
    paletteItem.innerHTML = `
      <div class="palette-item-name">${palette.name}</div>
      <div class="palette-item-preview">
        <div class="palette-color" style="background-color: ${palette.background}"></div>
        <div class="palette-color" style="background-color: ${palette.foreground}"></div>
        <div class="palette-color" style="background-color: ${palette.primary}"></div>
        <div class="palette-color" style="background-color: ${palette.secondary}"></div>
        <div class="palette-color" style="background-color: ${palette.tertiary}"></div>
      </div>
    `;

    paletteItem.addEventListener("click", () => {
      selectPalette(palette);
    });

    paletteList.appendChild(paletteItem);
  });
}

function selectPalette(palette) {
  currentEditingPalette = { ...palette };

  lastSelectedColor.color = palette[lastSelectedColor.type];

  document.getElementById("palette-bg-input").value = palette.background;
  document.getElementById("palette-bg-input-text").value = palette.background;
  document.getElementById("palette-fg-input").value = palette.foreground;
  document.getElementById("palette-fg-input-text").value = palette.foreground;
  document.getElementById("palette-primary-input").value = palette.primary;
  document.getElementById("palette-primary-input-text").value = palette.primary;
  document.getElementById("palette-secondary-input").value = palette.secondary;
  document.getElementById("palette-secondary-input-text").value =
    palette.secondary;
  document.getElementById("palette-tertiary-input").value = palette.tertiary;
  document.getElementById("palette-tertiary-input-text").value =
    palette.tertiary;

  backgroundBrushColor = palette.background;

  colors = currentEditingPalette;
  applyPalette();
}

function updateCurrentPalette() {
  if (!currentEditingPalette) return;

  currentEditingPalette.background =
    document.getElementById("palette-bg-input").value;
  currentEditingPalette.foreground =
    document.getElementById("palette-fg-input").value;
  currentEditingPalette.primary = document.getElementById(
    "palette-primary-input",
  ).value;
  currentEditingPalette.secondary = document.getElementById(
    "palette-secondary-input",
  ).value;
  currentEditingPalette.tertiary = document.getElementById(
    "palette-tertiary-input",
  ).value;

  colors = currentEditingPalette;
  applyPalette();
}

// ============================================================================
// PALETTE COLOR INPUT LISTENERS
// ============================================================================

// Background color inputs
document.getElementById("palette-bg-input").addEventListener("input", (e) => {
  if (currentEditingPalette) {
    currentEditingPalette.background = e.target.value;
    document.getElementById("palette-bg-input-text").value = e.target.value;
    updateCurrentPalette();
  }
});

document
  .getElementById("palette-bg-input-text")
  .addEventListener("input", (e) => {
    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
      currentEditingPalette.background = e.target.value;
      document.getElementById("palette-bg-input").value = e.target.value;
      updateCurrentPalette();
    }
  });

// Foreground color inputs
document.getElementById("palette-fg-input").addEventListener("input", (e) => {
  if (currentEditingPalette) {
    currentEditingPalette.foreground = e.target.value;
    document.getElementById("palette-fg-input-text").value = e.target.value;
    updateCurrentPalette();
  }
});

document
  .getElementById("palette-fg-input-text")
  .addEventListener("input", (e) => {
    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
      currentEditingPalette.foreground = e.target.value;
      document.getElementById("palette-fg-input").value = e.target.value;
      updateCurrentPalette();
    }
  });

// Primary color inputs
document
  .getElementById("palette-primary-input")
  .addEventListener("input", (e) => {
    if (currentEditingPalette) {
      currentEditingPalette.primary = e.target.value;
      document.getElementById("palette-primary-input-text").value =
        e.target.value;
      updateCurrentPalette();
    }
  });

document
  .getElementById("palette-primary-input-text")
  .addEventListener("input", (e) => {
    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
      currentEditingPalette.primary = e.target.value;
      document.getElementById("palette-primary-input").value = e.target.value;
      updateCurrentPalette();
    }
  });

// Secondary color inputs
document
  .getElementById("palette-secondary-input")
  .addEventListener("input", (e) => {
    if (currentEditingPalette) {
      currentEditingPalette.secondary = e.target.value;
      document.getElementById("palette-secondary-input-text").value =
        e.target.value;
      updateCurrentPalette();
    }
  });

document
  .getElementById("palette-secondary-input-text")
  .addEventListener("input", (e) => {
    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
      currentEditingPalette.secondary = e.target.value;
      document.getElementById("palette-secondary-input").value = e.target.value;
      updateCurrentPalette();
    }
  });

// Tertiary color inputs
document
  .getElementById("palette-tertiary-input")
  .addEventListener("input", (e) => {
    if (currentEditingPalette) {
      currentEditingPalette.tertiary = e.target.value;
      document.getElementById("palette-tertiary-input-text").value =
        e.target.value;
      updateCurrentPalette();
    }
  });

document
  .getElementById("palette-tertiary-input-text")
  .addEventListener("input", (e) => {
    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
      currentEditingPalette.tertiary = e.target.value;
      document.getElementById("palette-tertiary-input").value = e.target.value;
      updateCurrentPalette();
    }
  });

// ============================================================================
// BUTTON HELPERS
// ============================================================================
function clearAllActiveButtons() {
  primaryBtn.classList.remove("active");
  secondaryBtn.classList.remove("active");
  tertiaryBtn.classList.remove("active");
  backgroundBtn.classList.remove("active");
  penButton.classList.remove("active");
  brushButton.classList.remove("active");
  eraserButton.classList.remove("active");
}

function setActiveColorButton(activeBtn, color) {
  clearAllActiveButtons();
  activeBtn.classList.add("active");
  brushButton.classList.add("active");

  currentMode = "color";
  currentColor = color;
  currentWidth = colorWidth;
  canvas.style.cursor = "default";
}

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================
document.addEventListener("keydown", (e) => {
  if (isMobile) return;

  // don't trigger while typing or with modals open :)
  if (
    e.target.tagName === "INPUT" ||
    e.target.tagName === "TEXTAREA" ||
    paletteModal.style.display === "block" ||
    exportModal.style.display === "block"
  ) {
    return;
  }

  // Ctrl+Z for undo
  if ((e.ctrlKey || e.metaKey) && e.key === "z") {
    undoButton.click();
  }

  // 1, 2, 3, 4 for colors
  if (e.key === "1") {
    e.preventDefault();
    primaryBtn.click();
  }
  if (e.key === "2") {
    e.preventDefault();
    secondaryBtn.click();
  }
  if (e.key === "3") {
    e.preventDefault();
    tertiaryBtn.click();
  }
  if (e.key === "4" && isTransparencyMask) {
    e.preventDefault();
    backgroundBtn.click();
  }

  // B for Pencil
  if (e.key.toLowerCase() === "b") {
    e.preventDefault();
    penButton.click();
  }

  // C for Brush
  if (e.key.toLowerCase() === "c") {
    e.preventDefault();
    brushButton.click();
  }

  // E for Eraser
  if (e.key.toLowerCase() === "e") {
    e.preventDefault();
    eraserButton.click();
  }

  // W for Wiggle
  if (e.key.toLowerCase() === "w") {
    e.preventDefault();
    wiggleButton.click();
  }

  // [ and ] for size adjustment
  if (e.key === "[") {
    e.preventDefault();
    const widthButtons = document.querySelectorAll(
      ".size-btn:not([style*='display: none'])",
    );
    if (widthButtons.length > 0) {
      const currentIndex = Array.from(widthButtons).findIndex((btn) =>
        btn.classList.contains("active"),
      );
      if (currentIndex > 0) {
        widthButtons[currentIndex - 1].click();
      }
    }
  }

  if (e.key === "]") {
    e.preventDefault();
    const widthButtons = document.querySelectorAll(
      ".size-btn:not([style*='display: none'])",
    );
    if (widthButtons.length > 0) {
      const currentIndex = Array.from(widthButtons).findIndex((btn) =>
        btn.classList.contains("active"),
      );
      if (currentIndex < widthButtons.length - 1) {
        widthButtons[currentIndex + 1].click();
      }
    }
  }
});

// ============================================================================
// EXPORT FUNCTIONALITY
// ============================================================================

const exportModal = document.getElementById("export-modal");
const exportModalClose = document.getElementById("export-modal-close");
const exportStaticCheckbox = document.getElementById("export-static");
const exportTransparentCheckbox = document.getElementById("export-transparent");
const exportFilenameInput = document.getElementById("export-filename-input");
const exportDoBtn = document.getElementById("export-do-btn");
const exportCancelBtn = document.getElementById("export-cancel-btn");
const headerTitleInput = document.getElementById("header-title");

exportModalClose.addEventListener("click", () => {
  exportModal.style.display = "none";
});

exportCancelBtn.addEventListener("click", () => {
  exportModal.style.display = "none";
});

exportModal.addEventListener("click", (e) => {
  if (e.target === exportModal) {
    exportModal.style.display = "none";
  }
});

exportStaticCheckbox.addEventListener("change", () => {
  if (exportStaticCheckbox.checked) {
    exportDoBtn.textContent = "Export as PNG";
  } else {
    exportDoBtn.textContent = "Export as GIF";
  }
});

exportDoBtn.addEventListener("click", () => {
  const filename = exportFilenameInput.value || "untitled";
  const isTransparent = exportTransparentCheckbox.checked;
  const isStatic = exportStaticCheckbox.checked;

  if (isStatic) {
    exportAsPNG(isTransparent, filename);
  } else {
    exportAsGIF(isTransparent, filename);
  }

  exportModal.style.display = "none";
});

// Update export functions with filename parameter
function exportAsPNG(transparent = false, filename = "untitled") {
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
  link.download = `${filename}.png`;
  link.click();
}

async function exportAsGIF(transparent = false, filename = "untitled") {
  if (!window.GIF) {
    const script = document.createElement("script");
    script.src = "gif.js";
    script.async = true;
    document.head.appendChild(script);

    await new Promise((resolve) => {
      script.onload = resolve;
    });
  }

  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: canvas.width,
    height: canvas.height,
    workerScript: "gif.worker.js",
  });

  let frameCount = 0;
  const totalFrames = WIGGLE_FPS * 2;
  const savedWiggleFrame = wiggleFrame;

  function captureFrame() {
    if (frameCount >= totalFrames) {
      gif.render();
      return;
    }

    wiggleFrame++;
    drawAllStrokes();

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (!transparent) {
      tempCtx.fillStyle = canvas.style.backgroundColor;
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    }

    tempCtx.drawImage(canvas, 0, 0);
    gif.addFrame(tempCanvas, { delay: WIGGLE_INTERVAL });
    frameCount++;

    requestAnimationFrame(captureFrame);
  }

  return new Promise((resolve) => {
    gif.on("finished", function (blob) {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}.gif`;
      link.click();
      wiggleFrame = savedWiggleFrame;
      resolve();
    });

    captureFrame();
  });
}
// ============================================================================
// COLOR BUTTON EVENT LISTENERS
// ============================================================================
primaryBtn.addEventListener("click", (e) => {
  lastSelectedColor = {
    type: "primary",
    btn: primaryBtn,
    color: colors.primary,
  };
  setActiveColorButton(primaryBtn, colors.primary);
  updateSizeButtons();
});

secondaryBtn.addEventListener("click", (e) => {
  lastSelectedColor = {
    type: "secondary",
    btn: secondaryBtn,
    color: colors.secondary,
  };
  setActiveColorButton(secondaryBtn, colors.secondary);
  updateSizeButtons();
});

tertiaryBtn.addEventListener("click", (e) => {
  lastSelectedColor = {
    type: "tertiary",
    btn: tertiaryBtn,
    color: colors.tertiary,
  };
  setActiveColorButton(tertiaryBtn, colors.tertiary);
  updateSizeButtons();
});
backgroundBtn.addEventListener("click", (e) => {
  if (!isTransparencyMask) return;
  lastSelectedColor = {
    type: "background",
    btn: backgroundBtn,
    color: colors.background,
  };
  setActiveColorButton(backgroundBtn, colors.background);
  updateSizeButtons();
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
  updateSizeButtons();
});

brushButton.addEventListener("click", (e) => {
  clearAllActiveButtons();
  brushButton.classList.add("active");

  currentMode = "color";
  setActiveColorButton(lastSelectedColor.btn, lastSelectedColor.color);
  canvas.style.cursor = "default";
  updateSizeButtons();
});

eraserButton.addEventListener("click", (e) => {
  clearAllActiveButtons();
  eraserButton.classList.add("active");

  currentMode = "eraser";
  currentWidth = eraserWidth;
  canvas.style.cursor = "cell";
});

undoButton.addEventListener("click", (e) => {
  if (nukedStrokes !== null) {
    strokes = nukedStrokes;
    nukedStrokes = null;
  } else if (currentUndos > 0) {
    nukedStrokes = null;
    strokes.pop();
  }
  currentUndos--;
});

nukeButton.addEventListener("click", (e) => {
  if (strokes.length > 0) {
    nukedStrokes = [...strokes]; // Save strokes before nuking
    strokes.length = 0;
  }
});

// Stroke size
document.querySelectorAll(".size-btn").forEach((btn, index) => {
  btn.addEventListener("click", () => {
    if (currentMode === "pen") {
      penSizeIndex = index;
      penWidth = penSizes[penSizeIndex];
      currentWidth = penWidth;
    } else if (currentMode === "color") {
      brushSizeIndex = index;
      colorWidth = brushSizes[brushSizeIndex];
      currentWidth = colorWidth;
    }
    updateSizeButtons();
  });
});

const updateSizeButtons = () => {
  const widthButtons = document.querySelectorAll(".size-btn");
  widthButtons.forEach((btn, index) => {
    btn.classList.remove("active");
    btn.classList.remove("circle-mode");

    if (currentMode === "pen") {
      if (index < 3) {
        btn.style.display = "block";
        if (index === penSizeIndex) {
          btn.classList.add("active");
        }
      } else {
        btn.style.display = "none";
      }
    } else if (currentMode === "color") {
      // Show all 6 buttons for brush
      btn.style.display = "block";
      btn.classList.add("circle-mode");
      if (index === brushSizeIndex) {
        btn.classList.add("active");
      }
    }
  });
};

// ============================================================================
// CANVAS DRAWING EVENT LISTENERS
// ============================================================================
canvas.addEventListener("mousedown", (e) => {
  if (isMobile) return;
  handleStart(e);
});
canvas.addEventListener("touchstart", (e) => {
  if (!isMobile) return;
  e.preventDefault();
  let touch = e.touches[0];

  handleStart(touch);
});

function handleStart(e) {
  const pos = getScaledMousePos(e);
  isDrawing = true;
  currentPoints = [{ x: pos.x, y: pos.y }];
  startAnimation();
  handleMovement();
}

canvas.addEventListener("touchmove", (e) => {
  if (!isMobile) return;
  e.preventDefault();
  let touch = e.touches[0];
  handleMovement(touch);
});
canvas.addEventListener("mousemove", (e) => {
  if (isMobile) return;
  handleMovement(e);
});

function handleMovement(e) {
  if (!isDrawing || e === undefined) return;
  const pos = getScaledMousePos(e);
  currentPoints.push({ x: pos.x, y: pos.y });
}

canvas.addEventListener("touchend", (e) => {
  if (!isMobile) return;
  e.preventDefault();
  isDrawing = false;
  stopDrawing();
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
      colorType:
        currentMode === "color" ? lastSelectedColor.type : "foreground",
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
  if (e === undefined) return;
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

function remapStrokeColors() {
  strokes.forEach((stroke) => {
    if (stroke.colorType === "foreground") {
      stroke.color = colors.foreground;
    } else {
      stroke.color = colors[stroke.colorType];
    }
  });
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
    const base = points[0];
    const segments = 12;
    const radius = lineWidth / 2;

    targetCtx.beginPath();

    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;

      let wiggle = getWiggle(i);
      const r = radius + (wiggle.x + wiggle.y) * 0.3; // shape noise

      const x = base.x + Math.cos(t) * r;
      const y = base.y + Math.sin(t) * r;

      if (i === 0) targetCtx.moveTo(x, y);
      else targetCtx.lineTo(x, y);
    }

    targetCtx.closePath();
    targetCtx.fill();
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

// ============================================================================
// MENU BAR EVENT LISTENERS
// ============================================================================

const menuOptionsBtn = document.getElementById("menu-options-btn");
const optionsDropdown = document.getElementById("options-dropdown");
const menuWiggleToggle = document.getElementById("menu-wiggle-toggle");
const menuPalette = document.getElementById("menu-palette");
const menuExport = document.getElementById("menu-export");

menuOptionsBtn.addEventListener("click", () => {
  optionsDropdown.style.display =
    optionsDropdown.style.display === "none" ? "block" : "none";
});

menuWiggleToggle.addEventListener("click", () => {
  wiggleButton.click();
  optionsDropdown.style.display = "none";
});

menuPalette.addEventListener("click", () => {
  paletteBtn.click();
  optionsDropdown.style.display = "none";
});

menuExport.addEventListener("click", () => {
  exportModal.style.display = "block";
  exportFilenameInput.value = headerTitleInput.value || "untitled";
  optionsDropdown.style.display = "none";
});

// Close dropdown when clicking elsewhere
document.addEventListener("click", (e) => {
  if (
    !menuOptionsBtn.contains(e.target) &&
    !optionsDropdown.contains(e.target)
  ) {
    optionsDropdown.style.display = "none";
  }
});

// Update wiggle toggle text based on state
function updateWiggleToggleText() {
  menuWiggleToggle.textContent = isWiggly ? "Stop Wiggling" : "Resume Wiggling";
}

// Update text whenever wiggle is toggled
const originalWiggleClick = wiggleButton.click;
wiggleButton.addEventListener("click", () => {
  updateWiggleToggleText();
});

transparencyMaskCheckbox.addEventListener("change", (e) => {
  isTransparencyMask = e.target.checked;

  if (isTransparencyMask) {
    canvas.classList.add("transparency-mask");
    exportTransparentCheckbox.checked = true;
    backgroundBtn.style.display = "block";
  } else {
    canvas.classList.remove("transparency-mask");
    exportTransparentCheckbox.checked = false;

    backgroundBtn.style.display = "none";
    if (currentMode === "color" && lastSelectedColor.type === "background") {
      lastSelectedColor = {
        type: "primary",
        btn: primaryBtn,
        color: colors.primary,
      };
      setActiveColorButton(primaryBtn, colors.primary);
    }
  }

  drawAllStrokes();
});
