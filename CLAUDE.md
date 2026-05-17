# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Summarise everything that is important in this project - the architecture, decisions we made, current state, and is left to do - so i can paste it into a new session 

## Project Overview

This is a browser-based **Space Invaders arcade game** implemented as a single-file HTML application. The game features:
- Classic arcade gameplay (player movement, shooting, enemy waves)
- 7 distinct enemy movement patterns that randomly change per wave
- Progressive difficulty with increasing enemy speed
- Lives system and score tracking
- Canvas-based rendering with a retro green-on-black aesthetic

## How to Run

```bash
# Option 1: Open directly in browser (if you have a local HTTP server running)
# Assuming you're serving from the project root on port 8000:
# Navigate to http://localhost:8000/space-invaders/index.html

# Option 2: Start a Python HTTP server from the project root
python -m http.server 8000

# Then open http://localhost:8000/space-invaders/index.html in your browser
```

**Browser Requirements:** Any modern browser with HTML5 Canvas support (Chrome, Firefox, Safari, Edge).

## Project Structure

```
space-invaders/
└── index.html    # Single file containing all HTML, CSS, and JavaScript
```

The entire game logic is embedded in one HTML file (~550 lines). No build process or external dependencies are needed.

## Architecture Overview

### Game Loop (requestAnimationFrame)
The game runs on a 60fps game loop via `requestAnimationFrame`. Each frame:
1. **Clear canvas** - Draw black background
2. **Update state** (if PLAYING):
   - Player movement and bullets
   - Enemy movement via assigned pattern
   - Spawn new waves when all enemies destroyed
3. **Collision detection**:
   - Player bullets vs enemies
   - Enemy bullets vs player
   - Enemies reaching bottom
4. **Render** - Draw player, enemies, bullets, UI
5. **Handle game-over state**

### Core Game Objects

**Player**
- Position: Bottom-center of canvas (800×600)
- Properties: `x, y, width, height, speed, bullets[]`
- Controls: Arrow keys/A-D to move, SPACE to shoot
- Bounds: Clamped to canvas width

**Enemies**
- Spawned in 5×3 grid formation (15 per wave)
- Properties: `x, y, baseY, width, height, speed, direction, pattern, spiralOffset`
- Each enemy has a reference to its movement pattern
- Speed increases by 1.0 per new wave; direction reversal increases speed by 0.5

**Bullets**
- Player bullets: 4×10px, green (#0f0), travel upward at 7 px/frame
- Enemy bullets: 4×10px, yellow (#ff0), travel downward at 4 px/frame
- Automatically removed when off-canvas

### Game State Machine

```
IDLE (0) → PLAYING (1) → GAME_OVER (2)
                      ↘ WON (3)
```

- **IDLE**: Start screen, waiting for SPACE to begin
- **PLAYING**: Active gameplay
- **GAME_OVER**: Loss condition (lives reach 0 or enemies reach bottom)
- **WON**: Theoretical victory state (not triggered; waves are infinite)

## Pattern System

### Architecture

The **pattern system** (lines 169–280) enables 7 different enemy movement behaviors that randomly change per wave. Each pattern is defined in the `patterns` array and contains:

```javascript
{
  name: 'PATTERN_NAME',
  update: (enemy, frameCount, enemies, canvasWidth) => {
    // Update enemy position based on pattern logic
    // Return true if direction reversal is needed
  }
}
```

### Available Patterns

| Pattern | Behavior | Difficulty |
|---------|----------|-----------|
| **LINEAR** | Classic left-right sweep with 40px descent | Medium |
| **SINE_WAVE** | Horizontal movement + vertical sinusoidal oscillation | Medium-High |
| **DIAGONAL** | 45° downward descent while moving horizontally | High |
| **BOUNCING** | Vertical bouncing at canvas edges | Medium |
| **SPIRAL** | Circular orbital motion around screen center | Medium-High |
| **ZIGZAG** | Sharp angular zigzag descent | Very High |
| **TREMOR** | Rapid horizontal twitching while drifting | Medium |

### How Pattern Selection Works

1. **Wave spawn** (`spawnInitialEnemies`, line 315):
   - Increments wave counter
   - Calls `selectRandomPattern()` to pick a pattern
   - Stores pattern name in `currentPatternName` (for HUD display)
   - Assigns the pattern object to each enemy

2. **Pattern application** (`updateEnemies`, line 408):
   - Calls `enemy.pattern.update(...)` for each enemy
   - Returns boolean indicating if direction reversal is needed
   - Updates HUD to display current pattern

3. **To add a new pattern**: Push a new pattern object to the `patterns` array (line 170) with a unique name and update function.

## Key Game Mechanics

### Scoring
- **Enemy destroyed**: +10 points
- **Wave cleared** (all enemies destroyed): +100 bonus points
- Triggers new wave spawn with increased speed

### Lives System
- **Start**: 3 lives
- **Loss conditions**:
  - Enemy bullet hits player → -1 life
  - Any enemy reaches bottom of canvas → instant game over
  - Lives reach 0 → game over

### Difficulty Progression
- **Speed increase per wave**: `enemySpeed += 1`
- **Speed increase per direction change**: `enemySpeed += 0.5`
- **Pattern variety**: Each wave randomly selects a movement pattern
- Difficulty increases every wave regardless of pattern

## Collision Detection

Uses **AABB (Axis-Aligned Bounding Box)** intersection testing (lines 453–500):

```javascript
// Check if two rectangles overlap
if (rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y) {
  // Collision!
}
```

Applies to:
- Player bullets hitting enemies → remove both, add score
- Enemy bullets hitting player → remove bullet, decrease lives
- Enemies reaching bottom (`y + height >= 600`) → instant game over

## UI and HUD

The HUD displays in real-time (updated via `updateHUD()`, line 502):
- **Score**: Total points
- **Wave**: Current wave number (incremented per wave spawn)
- **Pattern**: Current movement pattern name
- **Lives**: Remaining lives

## Important Implementation Details

### Frame Counter
- `frameCount` (line 401) tracks total frames since game start
- Used for pattern timing (sine waves, spirals, zigzag phases)
- Resets only on game restart

### Enemy Base Position
- `enemy.baseY` stores the starting Y position for each enemy
- Used by SINE_WAVE and other patterns to calculate oscillation offsets

### Direction Reversal
- Most patterns return `changeDir` boolean from their update function
- If true, all enemies reverse direction and descend 40px
- Exception: SPIRAL pattern doesn't trigger direction reversal

## Common Modifications

### Adjust Game Difficulty
- **Enemy speed**: Change `enemySpeed` initial value (line 164) or speed multipliers in pattern updates
- **Enemy fire rate**: Adjust `spawnRate > 30` threshold (line 427)
- **Player speed**: Modify `player.speed` (line 154)

### Add a New Pattern
1. Add object to `patterns` array (line 170)
2. Define `name` and `update` function
3. Update function receives: `enemy, frameCount, enemies, canvasWidth`
4. Return boolean for direction reversal need

### Adjust Canvas Size
- Change `<canvas width="800" height="600">` (line 112)
- Update corresponding collision checks and enemy spawning logic

### Adjust Colors
- Player ship: `ctx.fillStyle = '#0f0'` (line 351)
- Enemies: `ctx.fillStyle = '#f0f'` (line 365)
- Bullets: `ctx.fillStyle = '#0f0'` and `'#ff0'` (lines 375, 380)
- Text/UI: `.info`, `.controls`, `.game-over` classes in CSS (lines 42–100)

## Performance Considerations

- **Canvas rendering**: All drawing is done with native Canvas API (no frameworks)
- **Enemy limit**: Maximum 15 enemies per wave in standard spawning
- **Collision checks**: O(n²) for player bullets vs enemies; O(n) for enemy bullets vs player
- **Frame rate**: Runs at 60fps via `requestAnimationFrame`

## Testing the Game

Manual testing checklist:
- [ ] Game starts with SPACE from idle state
- [ ] Player moves smoothly with arrow keys/A-D
- [ ] Bullets spawn and travel correctly
- [ ] Enemies move in their assigned pattern
- [ ] Enemies randomly fire bullets
- [ ] Collisions remove bullets and enemies, update score
- [ ] Wave increments and pattern changes after clearing all enemies
- [ ] Enemy speed visibly increases per wave
- [ ] Game over triggers when lives reach 0 or enemies reach bottom
- [ ] All 7 patterns display and work over multiple waves
