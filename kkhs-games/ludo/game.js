(function () {
  'use strict';

  // --- FB SDK ---
  var totalWins = 0;
  var playerName = 'Player';
  var fbInited = false;

  function fbReady() {
    if (fbInited) return;
    fbInited = true;
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
  }

  function initFB() {
    var fallbackTimer = setTimeout(fbReady, 3000);
    if (typeof FBInstant === 'undefined' || !FBInstant.initializeAsync) {
      clearTimeout(fallbackTimer); fbReady(); return;
    }
    FBInstant.initializeAsync().then(function () {
      FBInstant.setLoadingProgress(50);
      playerName = FBInstant.player.getName() || 'Player';
      return FBInstant.player.getDataAsync(['totalWins']);
    }).then(function (data) {
      if (data && data.totalWins) totalWins = data.totalWins;
      document.getElementById('bestScore').textContent = totalWins;
      FBInstant.setLoadingProgress(100);
      return FBInstant.startGameAsync();
    }).then(function () {
      clearTimeout(fallbackTimer); fbReady();
    }).catch(function (e) {
      console.error('FB Init error:', e);
      clearTimeout(fallbackTimer); fbReady();
    });
  }

  function saveWins() {
    if (typeof FBInstant === 'undefined') return;
    FBInstant.player.setDataAsync({ totalWins: totalWins }).catch(function () {});
    if (FBInstant.getLeaderboardAsync) {
      FBInstant.getLeaderboardAsync('ludo_wins').then(function (lb) {
        return lb.setScoreAsync(totalWins);
      }).catch(function () {});
    }
  }

  function fbShare() {
    if (typeof FBInstant === 'undefined') return;
    FBInstant.shareAsync({
      intent: 'INVITE',
      image: document.getElementById('gameCanvas').toDataURL('image/png'),
      text: playerName + ' is playing KKHS Ludo Star! Come join the fun!',
      data: {}
    }).catch(function () {});
  }

  // --- Canvas ---
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  var W, H;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize);
  resize();

  // --- Audio ---
  var soundOn = true;
  var ac = null;
  function getAC() { if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)(); return ac; }
  function playDice() {
    if (!soundOn) return;
    try { var a = getAC(); var o = a.createOscillator(); var g = a.createGain(); o.type = 'square'; o.frequency.value = 300; g.gain.setValueAtTime(0.1, a.currentTime); g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.15); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.15); } catch (e) {}
  }
  function playMove() {
    if (!soundOn) return;
    try { var a = getAC(); var o = a.createOscillator(); var g = a.createGain(); o.type = 'sine'; o.frequency.value = 500; g.gain.setValueAtTime(0.1, a.currentTime); g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.1); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.1); } catch (e) {}
  }
  function playCapture() {
    if (!soundOn) return;
    try { var a = getAC(); [400, 300, 200].forEach(function (f, i) { var o = a.createOscillator(); var g = a.createGain(); o.type = 'square'; o.frequency.value = f; g.gain.setValueAtTime(0.12, a.currentTime + i * 0.1); g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + i * 0.1 + 0.15); o.connect(g); g.connect(a.destination); o.start(a.currentTime + i * 0.1); o.stop(a.currentTime + i * 0.1 + 0.15); }); } catch (e) {}
  }
  function playWin() {
    if (!soundOn) return;
    try { var a = getAC(); [523, 659, 784, 1047].forEach(function (f, i) { var o = a.createOscillator(); var g = a.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.15, a.currentTime + i * 0.15); g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + i * 0.15 + 0.25); o.connect(g); g.connect(a.destination); o.start(a.currentTime + i * 0.15); o.stop(a.currentTime + i * 0.15 + 0.25); }); } catch (e) {}
  }

  // --- Ludo Board ---
  var PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
  var PLAYER_NAMES = ['Red', 'Blue', 'Green', 'Yellow'];
  var numPlayers = 2;
  var boardSize, cellSize, boardX, boardY;

  // Path coordinates for each player (52 shared + 5 home straight + 1 center)
  // The main path is 52 cells. Each player starts at different offsets.
  // We define the board as a 15x15 grid.
  // Main track cells (row, col) going clockwise:
  var MAIN_PATH = [
    [6,1],[6,2],[6,3],[6,4],[6,5],  // left top row (L to R)
    [5,6],[4,6],[3,6],[2,6],[1,6],[0,6], // top left col (B to T)
    [0,7],[0,8],                     // top row cross
    [1,8],[2,8],[3,8],[4,8],[5,8],   // top right col (T to B)
    [6,9],[6,10],[6,11],[6,12],[6,13],[6,14], // right top row
    [7,14],[8,14],                   // right col cross
    [8,13],[8,12],[8,11],[8,10],[8,9], // right bottom row
    [9,8],[10,8],[11,8],[12,8],[13,8],[14,8], // bottom right col
    [14,7],[14,6],                   // bottom cross
    [13,6],[12,6],[11,6],[10,6],[9,6], // bottom left col
    [8,5],[8,4],[8,3],[8,2],[8,1],[8,0], // left bottom row
    [7,0],[6,0]                      // left col cross back to start area
  ];

  // Home straight paths (leading to center)
  var HOME_PATHS = [
    [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]],    // Red: left middle row
    [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]],    // Blue: top middle col
    [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]], // Green: right middle row
    [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]]  // Yellow: bottom middle col
  ];

  // Start positions on main path for each player
  var PLAYER_START = [0, 13, 26, 39];
  // Entry to home path: the cell index on main path where player turns into home
  var HOME_ENTRY = [50, 11, 24, 37];

  // Home base positions (where pieces wait before entering)
  var HOME_BASES = [
    [[2,2],[2,4],[4,2],[4,4]],       // Red: top-left
    [[2,10],[2,12],[4,10],[4,12]],    // Blue: top-right
    [[10,10],[10,12],[12,10],[12,12]],// Green: bottom-right
    [[10,2],[10,4],[12,2],[12,4]]     // Yellow: bottom-left
  ];

  // Game State
  var STATE = { MENU: 0, ROLLING: 1, CHOOSING: 2, MOVING: 3, AI_TURN: 4, GAMEOVER: 5 };
  var state = STATE.MENU;
  var currentPlayer = 0;
  var diceValue = 0;
  var diceRolling = false;
  var diceFrame = 0;
  var pieces = []; // pieces[player][piece] = { pos: -1 (home), 0-51 (main path), 52-57 (home straight), 58 (finished) }
  var movablePieces = [];
  var animating = false;
  var animPiece = null;
  var animFrom = null;
  var animTo = null;
  var animProgress = 0;

  function calcBoard() {
    boardSize = Math.min(W - 20, H * 0.65);
    cellSize = boardSize / 15;
    boardX = (W - boardSize) / 2;
    boardY = (H - boardSize) / 2 + 30;
  }

  function cellToPixel(row, col) {
    return {
      x: boardX + col * cellSize + cellSize / 2,
      y: boardY + row * cellSize + cellSize / 2
    };
  }

  function getPiecePixel(playerIdx, pieceState) {
    if (pieceState === -1) {
      // In home base
      return null; // handled separately
    } else if (pieceState >= 0 && pieceState < 52) {
      // On main path
      var actualIdx = (pieceState + PLAYER_START[playerIdx]) % 52;
      var cell = MAIN_PATH[actualIdx];
      return cellToPixel(cell[0], cell[1]);
    } else if (pieceState >= 52 && pieceState < 58) {
      // On home straight
      var homeIdx = pieceState - 52;
      var homeCell = HOME_PATHS[playerIdx][homeIdx];
      return cellToPixel(homeCell[0], homeCell[1]);
    } else {
      // Finished (center)
      return cellToPixel(7, 7);
    }
  }

  function initPieces() {
    pieces = [];
    for (var p = 0; p < 4; p++) {
      pieces[p] = [-1, -1, -1, -1];
    }
  }

  function getMovable(player, dice) {
    var movable = [];
    for (var i = 0; i < 4; i++) {
      var pos = pieces[player][i];
      if (pos === 58) continue; // already finished

      if (pos === -1) {
        // Can only come out on 6
        if (dice === 6) movable.push(i);
      } else if (pos >= 52) {
        // On home straight
        var newPos = pos + dice;
        if (newPos <= 58) movable.push(i);
      } else {
        // On main path
        var stepsToHome = HOME_ENTRY[player] >= (pos + PLAYER_START[player]) % 52 ?
          HOME_ENTRY[player] - (pos + PLAYER_START[player]) % 52 :
          52 - (pos + PLAYER_START[player]) % 52 + HOME_ENTRY[player];

        if (stepsToHome === 0) stepsToHome = 52;

        if (dice <= stepsToHome) {
          movable.push(i);
        } else if (dice > stepsToHome) {
          var homeSteps = dice - stepsToHome;
          if (homeSteps <= 6) movable.push(i);
        }
      }
    }
    return movable;
  }

  function movePiece(player, pieceIdx, dice) {
    var pos = pieces[player][pieceIdx];
    var extraTurn = false;

    if (pos === -1) {
      // Move out to start
      pieces[player][pieceIdx] = 0;
      playMove();
      checkCapture(player, pieceIdx);
    } else if (pos >= 52) {
      pieces[player][pieceIdx] = Math.min(pos + dice, 58);
      playMove();
    } else {
      var newPos = pos + dice;
      var actualOld = (pos + PLAYER_START[player]) % 52;
      var homeEntry = HOME_ENTRY[player];

      // Check if passing home entry
      var stepsToHome;
      if (homeEntry >= actualOld) {
        stepsToHome = homeEntry - actualOld;
      } else {
        stepsToHome = 52 - actualOld + homeEntry;
      }
      if (stepsToHome === 0) stepsToHome = 52;

      if (dice > stepsToHome && stepsToHome <= 51) {
        // Entering home straight
        var homeSteps = dice - stepsToHome;
        if (homeSteps <= 6) {
          pieces[player][pieceIdx] = 51 + homeSteps;
        }
      } else {
        if (newPos >= 52) newPos -= 52;
        pieces[player][pieceIdx] = newPos;
        if (checkCapture(player, pieceIdx)) {
          extraTurn = true;
        }
      }
      playMove();
    }

    // Check win
    var allFinished = true;
    for (var i = 0; i < 4; i++) {
      if (pieces[player][i] !== 58) { allFinished = false; break; }
    }
    if (allFinished) {
      endGame(player);
      return;
    }

    // Next turn
    if (dice === 6 || extraTurn) {
      // Same player rolls again
      setTimeout(function () { startTurn(player); }, 500);
    } else {
      nextPlayer();
    }
  }

  function checkCapture(player, pieceIdx) {
    var pos = pieces[player][pieceIdx];
    if (pos < 0 || pos >= 52) return false;
    var actualPos = (pos + PLAYER_START[player]) % 52;

    // Safe spots (start positions and star cells)
    var safeSpots = [0, 8, 13, 21, 26, 34, 39, 47];
    if (safeSpots.indexOf(actualPos) >= 0) return false;

    var captured = false;
    for (var p = 0; p < numPlayers; p++) {
      if (p === player) continue;
      for (var i = 0; i < 4; i++) {
        if (pieces[p][i] >= 0 && pieces[p][i] < 52) {
          var otherActual = (pieces[p][i] + PLAYER_START[p]) % 52;
          if (otherActual === actualPos) {
            pieces[p][i] = -1; // Send back home
            captured = true;
            playCapture();
          }
        }
      }
    }
    return captured;
  }

  function nextPlayer() {
    var next = (currentPlayer + 1) % numPlayers;
    setTimeout(function () { startTurn(next); }, 600);
  }

  function startTurn(player) {
    currentPlayer = player;
    diceValue = 0;
    movablePieces = [];
    state = STATE.ROLLING;

    var color = PLAYER_COLORS[player];
    var name = player === 0 ? 'Your' : PLAYER_NAMES[player] + "'s";
    document.getElementById('turnDisplay').textContent = name + ' Turn';
    document.getElementById('turnDisplay').style.color = color;
    document.getElementById('diceResult').textContent = '';

    if (player !== 0) {
      // AI turn
      state = STATE.AI_TURN;
      setTimeout(function () { aiRoll(); }, 800);
    } else {
      document.getElementById('diceBtn').style.display = 'block';
    }
  }

  function rollDice() {
    if (state !== STATE.ROLLING || diceRolling) return;
    diceRolling = true;
    document.getElementById('diceBtn').style.display = 'none';
    playDice();

    var rolls = 0;
    var maxRolls = 10;
    var rollInterval = setInterval(function () {
      diceValue = Math.floor(Math.random() * 6) + 1;
      document.getElementById('diceResult').textContent = diceValue;
      rolls++;
      if (rolls >= maxRolls) {
        clearInterval(rollInterval);
        diceRolling = false;
        afterRoll();
      }
    }, 80);
  }

  function afterRoll() {
    movablePieces = getMovable(currentPlayer, diceValue);
    if (movablePieces.length === 0) {
      // No moves, next player
      nextPlayer();
    } else if (movablePieces.length === 1) {
      // Auto move
      movePiece(currentPlayer, movablePieces[0], diceValue);
    } else {
      // Let player choose (or AI)
      if (currentPlayer === 0) {
        state = STATE.CHOOSING;
      } else {
        aiChoose();
      }
    }
  }

  function aiRoll() {
    diceRolling = true;
    playDice();
    var rolls = 0;
    var rollInterval = setInterval(function () {
      diceValue = Math.floor(Math.random() * 6) + 1;
      document.getElementById('diceResult').textContent = diceValue;
      rolls++;
      if (rolls >= 10) {
        clearInterval(rollInterval);
        diceRolling = false;
        afterRoll();
      }
    }, 80);
  }

  function aiChoose() {
    // Simple AI: prefer capturing, then furthest piece, then leaving home
    var bestPiece = movablePieces[0];
    var bestScore = -1;

    for (var i = 0; i < movablePieces.length; i++) {
      var pi = movablePieces[i];
      var pos = pieces[currentPlayer][pi];
      var sc = 0;

      if (pos === -1) {
        sc = 10; // Coming out
      } else {
        sc = pos + diceValue; // Prefer advancing
        // Check if would capture
        var newPos = pos + diceValue;
        if (newPos < 52) {
          var actualNew = (newPos + PLAYER_START[currentPlayer]) % 52;
          for (var p = 0; p < numPlayers; p++) {
            if (p === currentPlayer) continue;
            for (var j = 0; j < 4; j++) {
              if (pieces[p][j] >= 0 && pieces[p][j] < 52) {
                if ((pieces[p][j] + PLAYER_START[p]) % 52 === actualNew) {
                  sc += 100; // Capture bonus
                }
              }
            }
          }
        }
      }
      if (sc > bestScore) { bestScore = sc; bestPiece = pi; }
    }

    setTimeout(function () {
      movePiece(currentPlayer, bestPiece, diceValue);
    }, 400);
  }

  // Player click to choose piece
  function onBoardClick(e) {
    if (state !== STATE.CHOOSING) return;
    var p = e.touches ? e.touches[0] : e;
    var mx = p.clientX;
    var my = p.clientY;

    for (var i = 0; i < movablePieces.length; i++) {
      var pi = movablePieces[i];
      var pos = pieces[0][pi];
      var px, py;

      if (pos === -1) {
        var base = HOME_BASES[0][pi];
        var bp = cellToPixel(base[0], base[1]);
        px = bp.x; py = bp.y;
      } else {
        var pp = getPiecePixel(0, pos);
        px = pp.x; py = pp.y;
      }

      var dx = mx - px;
      var dy = my - py;
      if (Math.sqrt(dx * dx + dy * dy) < cellSize * 1.2) {
        movePiece(0, pi, diceValue);
        state = STATE.MOVING;
        return;
      }
    }
  }

  canvas.addEventListener('click', onBoardClick);
  canvas.addEventListener('touchstart', function (e) { e.preventDefault(); onBoardClick(e); }, { passive: false });

  // --- Drawing ---
  function drawBg() {
    ctx.fillStyle = '#1a0a2e';
    ctx.fillRect(0, 0, W, H);
  }

  function drawBoard() {
    calcBoard();

    // Board background
    ctx.fillStyle = '#f5f0e1';
    ctx.fillRect(boardX, boardY, boardSize, boardSize);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    for (var i = 0; i <= 15; i++) {
      ctx.beginPath();
      ctx.moveTo(boardX + i * cellSize, boardY);
      ctx.lineTo(boardX + i * cellSize, boardY + boardSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(boardX, boardY + i * cellSize);
      ctx.lineTo(boardX + boardSize, boardY + i * cellSize);
      ctx.stroke();
    }

    // Home bases (colored quadrants)
    var homeSize = 6 * cellSize;
    // Red (top-left)
    ctx.fillStyle = 'rgba(231,76,60,0.3)';
    ctx.fillRect(boardX, boardY, homeSize, homeSize);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.strokeRect(boardX, boardY, homeSize, homeSize);

    // Blue (top-right)
    ctx.fillStyle = 'rgba(52,152,219,0.3)';
    ctx.fillRect(boardX + 9 * cellSize, boardY, homeSize, homeSize);
    ctx.strokeStyle = '#3498db';
    ctx.strokeRect(boardX + 9 * cellSize, boardY, homeSize, homeSize);

    // Green (bottom-right)
    ctx.fillStyle = 'rgba(46,204,113,0.3)';
    ctx.fillRect(boardX + 9 * cellSize, boardY + 9 * cellSize, homeSize, homeSize);
    ctx.strokeStyle = '#2ecc71';
    ctx.strokeRect(boardX + 9 * cellSize, boardY + 9 * cellSize, homeSize, homeSize);

    // Yellow (bottom-left)
    ctx.fillStyle = 'rgba(243,156,18,0.3)';
    ctx.fillRect(boardX, boardY + 9 * cellSize, homeSize, homeSize);
    ctx.strokeStyle = '#f39c12';
    ctx.strokeRect(boardX, boardY + 9 * cellSize, homeSize, homeSize);

    // Center triangle area
    var cx = boardX + 7.5 * cellSize;
    var cy = boardY + 7.5 * cellSize;
    var triSize = 3 * cellSize;

    // Draw 4 triangles in center
    var triColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
    var triAngles = [
      [[6, 6], [6, 9], [7.5, 7.5]],   // Red (top)
      [[6, 9], [9, 9], [7.5, 7.5]],   // Blue (right)
      [[9, 6], [9, 9], [7.5, 7.5]],   // Green (bottom)
      [[6, 6], [9, 6], [7.5, 7.5]]    // Yellow (left)
    ];
    for (var t = 0; t < 4; t++) {
      ctx.fillStyle = triColors[t];
      ctx.beginPath();
      ctx.moveTo(boardX + triAngles[t][0][1] * cellSize, boardY + triAngles[t][0][0] * cellSize);
      ctx.lineTo(boardX + triAngles[t][1][1] * cellSize, boardY + triAngles[t][1][0] * cellSize);
      ctx.lineTo(boardX + triAngles[t][2][1] * cellSize, boardY + triAngles[t][2][0] * cellSize);
      ctx.closePath();
      ctx.fill();
    }

    // Home straight colored cells
    var homeColors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
    for (var pi = 0; pi < 4; pi++) {
      ctx.fillStyle = homeColors[pi] + '88';
      for (var hi = 0; hi < 6; hi++) {
        var hc = HOME_PATHS[pi][hi];
        ctx.fillRect(boardX + hc[1] * cellSize + 1, boardY + hc[0] * cellSize + 1, cellSize - 2, cellSize - 2);
      }
    }

    // Safe spots (stars)
    var safeSpots = [
      [6, 2], [2, 6], [6, 12], [12, 6],  // colored start spots
      [6, 8], [8, 12], [8, 6], [2, 8]     // star safe spots
    ];
    ctx.fillStyle = 'rgba(255,215,0,0.4)';
    ctx.font = (cellSize * 0.6) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var s = 0; s < safeSpots.length; s++) {
      var sp = cellToPixel(safeSpots[s][0], safeSpots[s][1]);
      ctx.fillText('\u2605', sp.x, sp.y);
    }

    // Draw home base circles
    for (var pl = 0; pl < numPlayers; pl++) {
      ctx.fillStyle = '#f5f0e1';
      var baseAreaStart = HOME_BASES[pl][0];
      var baseAreaSize = 3 * cellSize;
      var bx = boardX + (baseAreaStart[1] - 0.5) * cellSize;
      var by = boardY + (baseAreaStart[0] - 0.5) * cellSize;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(bx + baseAreaSize / 2, by + baseAreaSize / 2, baseAreaSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PLAYER_COLORS[pl];
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawPiece(x, y, color, highlight) {
    var r = cellSize * 0.35;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.arc(x + 1, y + 2, r, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    var grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, 'rgba(255,255,255,0.5)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Movable indicator
    if (highlight) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(x, y, r + 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawPieces() {
    for (var pl = 0; pl < numPlayers; pl++) {
      var color = PLAYER_COLORS[pl];
      for (var i = 0; i < 4; i++) {
        var pos = pieces[pl][i];
        var isMovable = (state === STATE.CHOOSING && pl === 0 && movablePieces.indexOf(i) >= 0);

        if (pos === -1) {
          // In home base
          var base = HOME_BASES[pl][i];
          var bp = cellToPixel(base[0], base[1]);
          drawPiece(bp.x, bp.y, color, isMovable);
        } else if (pos === 58) {
          // Finished - draw in center
          var cx = boardX + 7.5 * cellSize + (i - 1.5) * cellSize * 0.3;
          var cy = boardY + 7.5 * cellSize + (pl - 1.5) * cellSize * 0.3;
          drawPiece(cx, cy, color, false);
        } else {
          var pp = getPiecePixel(pl, pos);
          if (pp) drawPiece(pp.x, pp.y, color, isMovable);
        }
      }
    }
  }

  function drawDice() {
    if (!diceValue) return;
    var dx = W / 2;
    var dy = boardY - 35;
    var ds = 30;

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(dx - ds + 5, dy - ds);
    ctx.lineTo(dx + ds - 5, dy - ds);
    ctx.quadraticCurveTo(dx + ds, dy - ds, dx + ds, dy - ds + 5);
    ctx.lineTo(dx + ds, dy + ds - 5);
    ctx.quadraticCurveTo(dx + ds, dy + ds, dx + ds - 5, dy + ds);
    ctx.lineTo(dx - ds + 5, dy + ds);
    ctx.quadraticCurveTo(dx - ds, dy + ds, dx - ds, dy + ds - 5);
    ctx.lineTo(dx - ds, dy - ds + 5);
    ctx.quadraticCurveTo(dx - ds, dy - ds, dx - ds + 5, dy - ds);
    ctx.fill();

    ctx.fillStyle = '#1a0a2e';
    ctx.font = 'bold ' + (ds * 1.2) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(diceValue, dx, dy);
  }

  // --- Game Flow ---
  function startGame() {
    initPieces();
    calcBoard();
    currentPlayer = 0;
    diceValue = 0;
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    startTurn(0);
  }

  function endGame(winner) {
    state = STATE.GAMEOVER;
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    if (winner === 0) {
      document.getElementById('winTitle').textContent = 'You Win!';
      document.getElementById('winTitle').style.color = '#ffd700';
      totalWins++;
      saveWins();
    } else {
      document.getElementById('winTitle').textContent = PLAYER_NAMES[winner] + ' Wins!';
      document.getElementById('winTitle').style.color = PLAYER_COLORS[winner];
    }
    document.getElementById('finalScore').textContent = totalWins;
    playWin();
  }

  function showMenu() {
    state = STATE.MENU;
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
  }

  // Player buttons
  document.querySelectorAll('.player-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.player-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      numPlayers = parseInt(this.getAttribute('data-players'));
    });
  });

  document.getElementById('playBtn').addEventListener('click', startGame);
  document.getElementById('retryBtn').addEventListener('click', startGame);
  document.getElementById('menuBtn').addEventListener('click', showMenu);
  document.getElementById('diceBtn').addEventListener('click', rollDice);
  document.getElementById('shareBtn').addEventListener('click', fbShare);
  document.getElementById('shareBtn2').addEventListener('click', fbShare);
  document.getElementById('soundToggle').addEventListener('click', function () {
    soundOn = !soundOn;
    this.textContent = 'Sound: ' + (soundOn ? 'ON' : 'OFF');
  });

  // --- Loop ---
  function draw() {
    drawBg();
    if (state !== STATE.MENU) {
      drawBoard();
      drawPieces();
      drawDice();
    }
  }

  function loop() {
    draw();
    requestAnimationFrame(loop);
  }

  initFB();
  loop();
})();
