# Chirp-Paint a Wiggly canvas playground
name is a work in proggress™.

<div align="center">
    <img width="500" height="430" alt="A cool gif showing the tool" src="https://github.com/user-attachments/assets/fa7a05de-d160-467c-a54a-ffdf48831cd4" />
</div>

> ### 🚀 [**Try the Live Demo here!**](https://leo-felde.github.io/js-wiggly-canvas/)

A minimalist, high(er?)-resolution creative painting tool built with vanilla JavaScript and HTML5 Canvas. Inspired by the concept of "wiggly" art, this project allows users to readly create art whithout downloading or configuring apps.
Just pick a color palette and start drawing!

## Key Enhancements
* **Higher Resolution:** Optimized canvas rendering for sharper lines and cleaner exports.
* **Tamed Wiggle:** The wiggle intensity is more subtle by default and can be **turned off completely** (why would you?) for static illustrations.
* **Dual Export:** Support for high-quality **PNG** snapshots and **GIF** for all it's wiggly glory.

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
Because this project uses **Web Workers** for GIF encoding, browsers block the worker from running via the `file://` protocol. You **must** run this project through a local server.
You only need this if you want to export your beautiful art as a gif with it's wigglyness, otherwise you can just open index.html and get painting!

1.  **Clone the project:**
    ```bash
    git clone https://github.com/Leo-Felde/js-painter.git
    cd js-painter
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
    Go to `http://127.0.0.1:8080` in your browser.

## How to Use
1.  **Draw:** Click and drag on the canvas to create your wiggly masterpiece.
2.  **Toggle Wiggle:** Use the UI control, just under the BIRD to adjust or stop the animation.
3.  **Change Colors:** Select from the 3-color palette (more colors coming soon?).
4.  **Export:** * Click the disket at the bottom left on the toolbar. Selet static for PNG and toggle between background transparency.

## TODOS?
- [ ] **MORE (or less?) WIGGLE** Ajust and control PRECISELY how much MORE wigglyness you deserve.
- [ ] **MORE Palettes:** More readly avaliable palettes!!!!!!!
- [ ] **LESS Jank** I'll the honest... The UX in this is not my greatest work... but it functions. Needs improving tho.

## 📜 Credits
- Inspired by the original [WigglyPaint](https://wiggly.paint/).
- GIF generation logic powered by [gif.js](https://github.com/jnordberg/gif.js).
