# Chirp Paint — Wiggly Canvas Playground
[![](https://img.shields.io/badge/Live_Demo-Play_Now!-yellow?&logo=javascript)](https://leo-felde.github.io/js-wiggly-canvas/)
<p>A minimalist drawing tool built with vanilla JavaScript and HTML5 Canvas</p>

Pick your colors, draw, and share your art! No installs, no setups, just fun

---

<div align="center">

### Simple but complete
<img width="500" alt="Drawing Interface preview" src="https://github.com/user-attachments/assets/8b517451-f094-4eb7-b600-9eab16fd8413" />

### Colorful
<img width="500" alt="Palette Menu preview" src="https://github.com/user-attachments/assets/19f7bdf9-c6f0-484d-a512-ec6140d141af" />

### Export as GIF
<img width="500" alt="Exported as gif example" src="https://github.com/user-attachments/assets/c95b0b2b-12d8-4301-9215-1fe0c3ae3de3" />

### Or as PNG with no background
<img width="500" alt="Static as image example" src="https://github.com/user-attachments/assets/8b2bbb49-95be-4569-9b3c-e14f33c520e5" />

</div>

> ### 🚀 [**Try drawing NOW!**](https://leo-felde.github.io/js-wiggly-canvas/)

## Key Enhancements
* **Higher Resolution:** Almost DOUBLE the resolution of the original wigglypaint!
* **Tamed Wiggle:** The wiggle can be **turned off completely** (why would you?) for static illustrations.
* **Dual Export:** Support for static **PNG** and animated **GIF**!

## Features
* **Dynamic Animation:** Real-time rendering of animated strokes.
* **Palette Selection:** A curated 3-color palette, easily customizable and expandable.
* **Local Processing:** GIF encoding happens entirely in your browser using Web Workers.
* **Zero Dependencies:** Built with pure HTML5, CSS3, and Vanilla JS! who doesn't love js????

## Tech Stack
* **Canvas API:** For high-performance drawing and frame manipulation.
* **JavaScript (ES6+):** Core logic and animation loop.
* **gif.js:** A JavaScript GIF encoder that runs in the background via Web Workers.

## Installation & Local Setup
This project uses **Web Workers** for GIF encoding, browsers block the worker from running via the `file://` protocol, **if you want the Export as GIF to work** follow the instructions bellow.
Otherwise, just open the index.html and export as static image (png).

1.  **Clone the project:**
    ```bash
    git clone https://github.com/Leo-Felde/js-wiggly-canvas.git
    cd js-wiggly-canvas
    ```

2.  **Run a local server:**
    If you have Node.js, you can use:
    ```bash
    npx http-server
    ```
    Or if you have Python installed (nerd):
    ```bash
    python -m http.server 8080
    ```

3.  **Open the App:**
    Go to `http://127.0.0.1:8080` in your browser and have fun.

## How to Use
1.  **Toggle Wiggle:** For precision drawings, toggle the wiggly animation under the Options Menu
2.  **Draw:** Select the Pencil or Brush and click and drag on the canvas to create your masterpiece
3.  **Change Colors:** Under the Options Menu, select from many 5-color palettes or make your own
4.  **Background transparency** In the Palette Menu, toggle the Transparency Mask and add the background wherever you want
5.  **Export:** Export as animated gif, static image with or without the background

## TODOS?
- [ ] **MORE (or less?) WIGGLE** Ajust and control PRECISELY how much MORE wigglyness you deserve.
- [ ] **LESS Jank** The UX could use some more love and art.

## 📜 Credits
- Inspired by the original [WigglyPaint](https://wiggly.paint/).
- GIF generation logic powered by [gif.js](https://github.com/jnordberg/gif.js).
