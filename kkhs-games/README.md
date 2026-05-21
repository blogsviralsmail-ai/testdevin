# KKHS Games - Facebook Instant Games Collection

Five original HTML5 games built for Facebook Instant Games platform, branded under **KKHS Games**.

## Games

| # | Game | Description | Genre |
|---|------|-------------|-------|
| 1 | **KKHS Basketball** | Aim and throw basketballs through a moving hoop. Streak system multiplies points! | Sports/Casual |
| 2 | **KKHS Bubble Pop** | Classic bubble shooter - match 3+ bubbles of the same color to pop them. | Puzzle |
| 3 | **KKHS Magic Puzzle** | Sliding number puzzle with progressive difficulty (3x3 to 5x5). | Puzzle |
| 4 | **KKHS Word Quest** | Find hidden words by connecting letters in a circle. Timed rounds! | Word/Trivia |
| 5 | **KKHS Ludo Star** | Classic Ludo board game. Play against AI opponents. | Board/Strategy |

## Features (All Games)

- Facebook Instant Games SDK 8.0 integration
- Leaderboard support
- Score sharing to Facebook
- Sound effects with mute toggle
- Responsive design (mobile + desktop)
- Original code - no copyright issues
- KKHS Games branding throughout
- No external dependencies (pure HTML5 Canvas)

## Facebook Instant Games Compliance

- `fbapp-config.json` configured for RICH_GAMEPLAY
- Portrait orientation optimized
- `FBInstant.initializeAsync()` → `setLoadingProgress()` → `startGameAsync()` flow
- Player data persistence via `FBInstant.player.setDataAsync()`
- Leaderboard integration via `FBInstant.getLeaderboardAsync()`
- Share functionality via `FBInstant.shareAsync()`
- Fallback for local testing without FB SDK

## How to Upload to Facebook

1. Navigate to each game directory (e.g., `basketball/`)
2. Create a ZIP file containing all files in that directory
3. Go to Facebook Developer Dashboard → Your App → Web Hosting
4. Upload the ZIP file
5. Set it as the Production version
6. Test from the Instant Games tab

## Building ZIP Bundles

```bash
cd kkhs-games
for game in basketball bubble-pop puzzle word-quest ludo; do
  cd $game && zip -r ../kkhs-${game}.zip . && cd ..
done
```

## Local Testing

Each game works standalone in a browser (FB SDK functions gracefully degrade).
Open any `index.html` file directly or serve via:

```bash
cd kkhs-games/basketball
python3 -m http.server 8080
```

Then visit `http://localhost:8080`
