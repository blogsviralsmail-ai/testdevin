(function () {
  'use strict';

  // --- FB SDK ---
  var bestScore = 0;
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
      playerName = FBInstant.player.getName() || 'Player';
      FBInstant.setLoadingProgress(100);
      return FBInstant.startGameAsync();
    }).then(function () {
      clearTimeout(fallbackTimer);
      FBInstant.player.getDataAsync(['bestScore']).then(function (data) {
        if (data && data.bestScore) {
          bestScore = data.bestScore;
          document.getElementById('bestScore').textContent = bestScore;
        }
      }).catch(function () {});
      fbReady();
    }).catch(function (e) {
      console.error('FB Init error:', e);
      clearTimeout(fallbackTimer);
      if (FBInstant.startGameAsync) {
        FBInstant.startGameAsync().then(fbReady).catch(fbReady);
      } else {
        fbReady();
      }
    });
  }

  function saveBest(s) {
    if (typeof FBInstant === 'undefined') return;
    FBInstant.player.setDataAsync({ bestScore: s }).catch(function () {});
    if (FBInstant.getLeaderboardAsync) {
      FBInstant.getLeaderboardAsync('puzzle_highscore').then(function (lb) {
        return lb.setScoreAsync(s);
      }).catch(function () {});
    }
  }

  function fbShare(s) {
    if (typeof FBInstant === 'undefined') return;
    FBInstant.shareAsync({
      intent: 'SCORE',
      image: document.getElementById('gameCanvas').toDataURL('image/png'),
      text: playerName + ' scored ' + s + ' in KKHS Magic Puzzle! Can you solve it faster?',
      data: { score: s }
    }).catch(function () {});
  }

  function showLeaderboard() {
    if (typeof FBInstant === 'undefined') { alert('Leaderboard available on Facebook'); return; }
    FBInstant.getLeaderboardAsync('puzzle_highscore').then(function (lb) {
      return lb.getEntriesAsync(10, 0);
    }).then(function (entries) {
      var msg = 'Top 10:\n';
      entries.forEach(function (e, i) { msg += (i + 1) + '. ' + e.getPlayer().getName() + ' - ' + e.getScore() + '\n'; });
      alert(msg);
    }).catch(function () { alert('Not available'); });
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
  function playTap() {
    if (!soundOn) return;
    try { var a = getAC(); var o = a.createOscillator(); var g = a.createGain(); o.type = 'sine'; o.frequency.value = 500; g.gain.setValueAtTime(0.15, a.currentTime); g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.1); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.1); } catch (e) {}
  }
  function playWin() {
    if (!soundOn) return;
    try { var a = getAC(); [523, 659, 784, 1047].forEach(function (f, i) { var o = a.createOscillator(); var g = a.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.15, a.currentTime + i * 0.12); g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + i * 0.12 + 0.2); o.connect(g); g.connect(a.destination); o.start(a.currentTime + i * 0.12); o.stop(a.currentTime + i * 0.12 + 0.2); }); } catch (e) {}
  }

  // --- Game State ---
  var gridSize = 3;
  var tiles = [];
  var emptyPos = { row: 0, col: 0 };
  var tileSize, gridOffset;
  var moves = 0;
  var score = 0;
  var level = 1;
  var timerStart = 0;
  var timerElapsed = 0;
  var timerRunning = false;
  var animTile = null;
  var animProgress = 0;
  var STATE = { MENU: 0, PLAYING: 1, ANIMATING: 2, WON: 3, GAMEOVER: 4 };
  var state = STATE.MENU;
  var TILE_COLORS = [
    '#e94560', '#ff6b9d', '#c44569', '#f78fb3',
    '#574b90', '#786fa6', '#303952', '#596275',
    '#e15f41', '#f5cd79', '#546de5', '#3dc1d3',
    '#e66767', '#f19066', '#778beb', '#786fa6',
    '#cf6a87', '#63cdda', '#ea8685', '#596275',
    '#574b90', '#303952', '#e15f41', '#f5cd79',
    '#e94560'
  ];

  function calcLayout() {
    tileSize = Math.min((W - 40) / gridSize, (H * 0.55) / gridSize);
    var gridW = gridSize * tileSize;
    gridOffset = { x: (W - gridW) / 2, y: (H - gridW) / 2 + 20 };
  }

  function initTiles() {
    tiles = [];
    var num = gridSize * gridSize;
    for (var i = 0; i < num - 1; i++) {
      tiles.push(i + 1);
    }
    tiles.push(0); // empty
    emptyPos = { row: gridSize - 1, col: gridSize - 1 };
  }

  function shuffleTiles() {
    // Perform random valid moves to ensure solvability
    var shuffleMoves = gridSize * gridSize * 20;
    for (var i = 0; i < shuffleMoves; i++) {
      var neighbors = getMovableNeighbors();
      var pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      swapTile(pick.row, pick.col, true);
    }
    moves = 0;
  }

  function getMovableNeighbors() {
    var n = [];
    var dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (var i = 0; i < dirs.length; i++) {
      var nr = emptyPos.row + dirs[i][0];
      var nc = emptyPos.col + dirs[i][1];
      if (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
        n.push({ row: nr, col: nc });
      }
    }
    return n;
  }

  function swapTile(row, col, silent) {
    var idx1 = row * gridSize + col;
    var idx2 = emptyPos.row * gridSize + emptyPos.col;
    var tmp = tiles[idx1];
    tiles[idx1] = tiles[idx2];
    tiles[idx2] = tmp;
    emptyPos = { row: row, col: col };
    if (!silent) {
      moves++;
      document.getElementById('moves').textContent = moves;
      playTap();
    }
  }

  function checkWin() {
    for (var i = 0; i < tiles.length - 1; i++) {
      if (tiles[i] !== i + 1) return false;
    }
    return tiles[tiles.length - 1] === 0;
  }

  function calcScore() {
    var timeBonus = Math.max(0, 300 - Math.floor(timerElapsed));
    var moveBonus = Math.max(0, 200 - moves * 2);
    var sizeMultiplier = gridSize - 1;
    return (timeBonus + moveBonus + 100) * sizeMultiplier;
  }

  function formatTime(seconds) {
    var m = Math.floor(seconds / 60);
    var s = Math.floor(seconds % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  // --- Drawing ---
  function drawBg() {
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawTile(num, x, y, size) {
    if (num === 0) return;
    var pad = 3;
    var ts = size - pad * 2;
    var color = TILE_COLORS[(num - 1) % TILE_COLORS.length];

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    roundRect(ctx, x + pad + 2, y + pad + 2, ts, ts, 8);
    ctx.fill();

    // Tile body
    ctx.fillStyle = color;
    roundRect(ctx, x + pad, y + pad, ts, ts, 8);
    ctx.fill();

    // Gradient overlay
    var grad = ctx.createLinearGradient(x + pad, y + pad, x + pad, y + pad + ts);
    grad.addColorStop(0, 'rgba(255,255,255,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0.1)');
    roundRect(ctx, x + pad, y + pad, ts, ts, 8);
    ctx.fillStyle = grad;
    ctx.fill();

    // Number
    ctx.fillStyle = '#fff';
    ctx.font = 'bold ' + (ts * 0.4) + 'px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num, x + size / 2, y + size / 2);
  }

  function roundRect(ctx2, x, y, w, h, r) {
    ctx2.beginPath();
    ctx2.moveTo(x + r, y);
    ctx2.lineTo(x + w - r, y);
    ctx2.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx2.lineTo(x + w, y + h - r);
    ctx2.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx2.lineTo(x + r, y + h);
    ctx2.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx2.lineTo(x, y + r);
    ctx2.quadraticCurveTo(x, y, x + r, y);
    ctx2.closePath();
  }

  function drawBoard() {
    // Board background
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    roundRect(ctx, gridOffset.x - 5, gridOffset.y - 5, gridSize * tileSize + 10, gridSize * tileSize + 10, 12);
    ctx.fill();

    for (var r = 0; r < gridSize; r++) {
      for (var c = 0; c < gridSize; c++) {
        var idx = r * gridSize + c;
        var num = tiles[idx];
        var x = gridOffset.x + c * tileSize;
        var y = gridOffset.y + r * tileSize;

        if (animTile && animTile.row === r && animTile.col === c) {
          // Animate moving tile
          var destX = gridOffset.x + animTile.destCol * tileSize;
          var destY = gridOffset.y + animTile.destRow * tileSize;
          var curX = x + (destX - x) * animProgress;
          var curY = y + (destY - y) * animProgress;
          drawTile(num, curX, curY, tileSize);
        } else {
          drawTile(num, x, y, tileSize);
        }
      }
    }
  }

  // --- Input ---
  function onClick(e) {
    if (state !== STATE.PLAYING) return;
    var p = e.touches ? e.touches[0] : e;
    var mx = p.clientX - gridOffset.x;
    var my = p.clientY - gridOffset.y;
    var col = Math.floor(mx / tileSize);
    var row = Math.floor(my / tileSize);

    if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return;

    // Check if adjacent to empty
    var dr = Math.abs(row - emptyPos.row);
    var dc = Math.abs(col - emptyPos.col);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      swapTile(row, col);

      if (checkWin()) {
        timerRunning = false;
        var lvlScore = calcScore();
        score += lvlScore;
        playWin();
        document.getElementById('winMoves').textContent = moves;
        document.getElementById('winTime').textContent = formatTime(timerElapsed);
        document.getElementById('winScore').textContent = lvlScore;
        state = STATE.WON;
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('win-screen').classList.remove('hidden');
      }
    }
  }

  canvas.addEventListener('click', onClick);
  canvas.addEventListener('touchstart', function (e) { e.preventDefault(); onClick(e); }, { passive: false });

  // --- Game Flow ---
  function startGame() {
    state = STATE.PLAYING;
    level = 1;
    score = 0;
    startLevel();
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
  }

  function startLevel() {
    moves = 0;
    calcLayout();
    initTiles();
    shuffleTiles();
    timerStart = Date.now();
    timerElapsed = 0;
    timerRunning = true;
    document.getElementById('moves').textContent = 0;
    document.getElementById('level').textContent = level;
    document.getElementById('score').textContent = score;
    state = STATE.PLAYING;
  }

  function nextLevel() {
    level++;
    if (level > 10) {
      // Game complete
      endGame();
      return;
    }
    if (level === 4 && gridSize < 4) gridSize = 4;
    if (level === 7 && gridSize < 5) gridSize = 5;
    startLevel();
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
  }

  function endGame() {
    state = STATE.GAMEOVER;
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;
    if (score > bestScore) {
      bestScore = score;
      document.getElementById('bestScore').textContent = bestScore;
      document.getElementById('newBest').classList.remove('hidden');
      saveBest(bestScore);
    } else {
      document.getElementById('newBest').classList.add('hidden');
    }
  }

  function showMenu() {
    state = STATE.MENU;
    gridSize = 3;
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('win-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
  }

  // Difficulty buttons
  document.querySelectorAll('.diff-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.diff-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      gridSize = parseInt(this.getAttribute('data-size'));
    });
  });

  document.getElementById('playBtn').addEventListener('click', startGame);
  document.getElementById('retryBtn').addEventListener('click', startGame);
  document.getElementById('menuBtn').addEventListener('click', showMenu);
  document.getElementById('nextBtn').addEventListener('click', nextLevel);
  document.getElementById('shareBtn').addEventListener('click', function () { fbShare(score); });
  document.getElementById('shareBtn2').addEventListener('click', function () { fbShare(score); });
  document.getElementById('leaderboardBtn').addEventListener('click', showLeaderboard);
  document.getElementById('soundToggle').addEventListener('click', function () {
    soundOn = !soundOn;
    this.textContent = 'Sound: ' + (soundOn ? 'ON' : 'OFF');
  });

  // --- Loop ---
  function update() {
    if (timerRunning) {
      timerElapsed = (Date.now() - timerStart) / 1000;
      document.getElementById('timer').textContent = formatTime(timerElapsed);
    }
  }

  function draw() {
    drawBg();
    if (state >= STATE.PLAYING) {
      drawBoard();
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  initFB();
  loop();
})();
