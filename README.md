# Mingming Snake Game

A lightweight browser-based Snake game. Open the `index.html` file in any modern browser to start playing.

## Getting Started

1. Download or clone this repository.
2. Open the `index.html` file directly in your preferred web browser (Chrome, Firefox, Edge, Safari, etc.).

   > **Tip:** If you would rather serve the files over HTTP, run `python3 -m http.server 8000`
   > from the repository root and visit `http://localhost:8000` in your browser.

No build step or bundler is required—the game runs entirely in the browser.

## Controls

- **Move Up:** Arrow Up or `W`
- **Move Down:** Arrow Down or `S`
- **Move Left:** Arrow Left or `A`
- **Move Right:** Arrow Right or `D`
- **Restart:** Click the **Restart** button, press **Space**, **Enter**, or press any direction key when the game is idle.

## Features

- Smooth, frame-based snake movement on a 20×20 grid rendered to the canvas.
- Randomly spawning food with increasing score (+10 per food collected).
- Collision detection for walls and self-hits, followed by a restart prompt.
- Responsive layout with a styled play area, live score display, and idle instructions.
- Keyboard-accessible controls, including starting a new game directly from movement keys.
