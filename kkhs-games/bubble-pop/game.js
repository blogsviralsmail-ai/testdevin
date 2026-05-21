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
      FBInstant.setLoadingProgress(50);
      playerName = FBInstant.player.getName() || 'Player';
      return FBInstant.player.getDataAsync(['bestScore']);
    }).then(function (data) {
      if (data && data.bestScore) bestScore = data.bestScore;
      document.getElementById('bestScore').textContent = bestScore;
      FBInstant.setLoadingProgress(100);
      return FBInstant.startGameAsync();
    }).then(function () {
      clearTimeout(fallbackTimer); fbReady();
    }).catch(function (e) {
      console.error('FB Init error:', e);
      clearTimeout(fallbackTimer); fbReady();
    });
  }

  function saveBest(s) {
    if (typeof FBInstant === 'undefined') return;
    FBInstant.player.setDataAsync({ bestScore: s }).catch(function () {});
    if (FBInstant.getLeaderboardAsync) {
      FBInstant.getLeaderboardAsync('bubble_highscore').then(function (lb) {
        return lb.setScoreAsync(s);
      }).catch(function () {});
    }
  }

  function fbShare(s) {
    if (typeof FBInstant === 'undefined') return;
    var c = document.getElementById('gameCanvas');
    FBInstant.shareAsync({
      intent: 'SCORE',
      image: c.toDataURL('image/png'),
      text: playerName + ' popped ' + s + ' points in KKHS Bubble Pop! Try to beat it!',
      data: { score: s }
    }).catch(function () {});
  }

  function showLeaderboard() {
    if (typeof FBInstant === 'undefined') { alert('Leaderboard available on Facebook'); return; }
    FBInstant.getLeaderboardAsync('bubble_highscore').then(function (lb) {
      return lb.getEntriesAsync(10, 0);
    }).then(function (entries) {
      var msg = 'Top 10:\n';
      entries.forEach(function (e, i) {
        msg += (i + 1) + '. ' + e.getPlayer().getName() + ' - ' + e.getScore() + '\n';
      });
      alert(msg);
    }).catch(function () { alert('Leaderboard not available'); });
  }

  // --- Canvas ---
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  var W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // --- Audio ---
  var soundOn = true;
  var audioCtx = null;
  function getAC() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return audioCtx; }
  function playPop() {
    if (!soundOn) return;
    try {
      var ac = getAC(); var o = ac.createOscillator(); var g = ac.createGain();
      o.type = 'sine'; o.frequency.value = 600 + Math.random() * 400;
      g.gain.setValueAtTime(0.2, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.15);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.15);
    } catch (e) {}
  }
  function playShoot() {
    if (!soundOn) return;
    try {
      var ac = getAC(); var o = ac.createOscillator(); var g = ac.createGain();
      o.type = 'triangle'; o.frequency.value = 350;
      g.gain.setValueAtTime(0.15, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.1);
      o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.1);
    } catch (e) {}
  }

  // --- Game Config ---
  var COLORS = ['#ff4757', '#2ed573', '#1e90ff', '#ffa502', '#a55eea', '#ff6b81'];
  var COLS = 8;
  var ROWS = 12;
  var bubbleR, gridOffsetX, gridOffsetY;
  var grid = [];
  var shooterBubble = null;
  var nextColor = 0;
  var flyingBubble = null;
  var score = 0;
  var combo = 0;
  var aimAngle = -Math.PI / 2;
  var particles = [];
  var STATE = { MENU: 0, PLAYING: 1, AIMING: 2, FLYING: 3, GAMEOVER: 4 };
  var state = STATE.MENU;
  var pushCounter = 0;
  var PUSH_INTERVAL = 5;

  function calcDimensions() {
    bubbleR = Math.floor(Math.min(W / (COLS * 2 + 1), (H * 0.65) / (ROWS * 1.8))) ;
    gridOffsetX = (W - COLS * bubbleR * 2) / 2 + bubbleR;
    gridOffsetY = bubbleR + 50;
  }

  function getGridPos(row, col) {
    var x = gridOffsetX + col * bubbleR * 2;
    if (row % 2 === 1) x += bubbleR;
    var y = gridOffsetY + row * bubbleR * 1.75;
    return { x: x, y: y };
  }

  function randomColor() {
    return Math.floor(Math.random() * COLORS.length);
  }

  function initGrid() {
    grid = [];
    for (var r = 0; r < ROWS; r++) {
      grid[r] = [];
      var maxCols = (r % 2 === 1) ? COLS - 1 : COLS;
      for (var c = 0; c < maxCols; c++) {
        grid[r][c] = r < 5 ? randomColor() : -1;
      }
    }
  }

  function spawnShooter() {
    var c = nextColor;
    nextColor = randomColor();
    shooterBubble = { color: c, x: W / 2, y: H - bubbleR * 2 - 30 };
  }

  function resetGame() {
    score = 0;
    combo = 0;
    pushCounter = 0;
    particles = [];
    calcDimensions();
    initGrid();
    spawnShooter();
    updateHUD();
  }

  function updateHUD() {
    document.getElementById('score').textContent = score;
    if (combo > 1) {
      document.getElementById('comboDisplay').textContent = combo + 'x Combo!';
    } else {
      document.getElementById('comboDisplay').textContent = '';
    }
  }

  // --- Collision & Matching ---
  function snapToGrid(bx, by) {
    var bestR = 0, bestC = 0, bestDist = Infinity;
    for (var r = 0; r < ROWS; r++) {
      var maxC = (r % 2 === 1) ? COLS - 1 : COLS;
      for (var c = 0; c < maxC; c++) {
        if (grid[r] && grid[r][c] !== undefined && grid[r][c] >= 0) continue;
        var pos = getGridPos(r, c);
        var dx = bx - pos.x;
        var dy = by - pos.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
          bestDist = dist;
          bestR = r;
          bestC = c;
        }
      }
    }
    return { row: bestR, col: bestC };
  }

  function getNeighbors(r, c) {
    var neighbors = [];
    var even = (r % 2 === 0);
    var offsets = even ?
      [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]] :
      [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]];
    for (var i = 0; i < offsets.length; i++) {
      var nr = r + offsets[i][0];
      var nc = c + offsets[i][1];
      var maxC = (nr % 2 === 1) ? COLS - 1 : COLS;
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < maxC) {
        neighbors.push({ row: nr, col: nc });
      }
    }
    return neighbors;
  }

  function findMatches(r, c, color) {
    var visited = {};
    var matches = [];
    var queue = [{ row: r, col: c }];
    visited[r + ',' + c] = true;

    while (queue.length > 0) {
      var curr = queue.shift();
      if (grid[curr.row] && grid[curr.row][curr.col] === color) {
        matches.push(curr);
        var neighbors = getNeighbors(curr.row, curr.col);
        for (var i = 0; i < neighbors.length; i++) {
          var n = neighbors[i];
          var key = n.row + ',' + n.col;
          if (!visited[key]) {
            visited[key] = true;
            queue.push(n);
          }
        }
      }
    }
    return matches;
  }

  function findFloating() {
    var connected = {};
    var queue = [];

    // Mark all bubbles connected to top row
    for (var c = 0; c < COLS; c++) {
      if (grid[0] && grid[0][c] >= 0) {
        queue.push({ row: 0, col: c });
        connected['0,' + c] = true;
      }
    }

    while (queue.length > 0) {
      var curr = queue.shift();
      var neighbors = getNeighbors(curr.row, curr.col);
      for (var i = 0; i < neighbors.length; i++) {
        var n = neighbors[i];
        var key = n.row + ',' + n.col;
        if (!connected[key] && grid[n.row] && grid[n.row][n.col] >= 0) {
          connected[key] = true;
          queue.push(n);
        }
      }
    }

    var floating = [];
    for (var r = 0; r < ROWS; r++) {
      var maxC = (r % 2 === 1) ? COLS - 1 : COLS;
      for (var cc = 0; cc < maxC; cc++) {
        if (grid[r][cc] >= 0 && !connected[r + ',' + cc]) {
          floating.push({ row: r, col: cc });
        }
      }
    }
    return floating;
  }

  function removeBubbles(list) {
    for (var i = 0; i < list.length; i++) {
      var pos = getGridPos(list[i].row, list[i].col);
      var color = grid[list[i].row][list[i].col];
      // Spawn particles
      for (var j = 0; j < 6; j++) {
        particles.push({
          x: pos.x, y: pos.y,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          size: bubbleR * 0.4,
          color: color >= 0 ? COLORS[color] : '#fff',
          life: 1
        });
      }
      grid[list[i].row][list[i].col] = -1;
    }
    playPop();
  }

  function placeBubble(bx, by, color) {
    var snap = snapToGrid(bx, by);
    if (!grid[snap.row]) grid[snap.row] = [];
    grid[snap.row][snap.col] = color;

    var matches = findMatches(snap.row, snap.col, color);
    if (matches.length >= 3) {
      combo++;
      score += matches.length * 10 * combo;
      removeBubbles(matches);

      var floating = findFloating();
      if (floating.length > 0) {
        score += floating.length * 15 * combo;
        removeBubbles(floating);
      }
    } else {
      combo = 0;
      pushCounter++;
      if (pushCounter >= PUSH_INTERVAL) {
        pushCounter = 0;
        pushRowDown();
      }
    }
    updateHUD();

    // Check game over
    for (var c2 = 0; c2 < COLS; c2++) {
      if (grid[ROWS - 1] && grid[ROWS - 1][c2] >= 0) {
        endGame();
        return;
      }
    }
    spawnShooter();
    state = STATE.AIMING;
  }

  function pushRowDown() {
    // Shift all rows down and add new row at top
    for (var r = ROWS - 1; r > 0; r--) {
      grid[r] = grid[r - 1];
    }
    var maxC0 = COLS;
    grid[0] = [];
    for (var c = 0; c < maxC0; c++) {
      grid[0][c] = randomColor();
    }
  }

  function checkHitGrid(bx, by) {
    for (var r = 0; r < ROWS; r++) {
      var maxC = (r % 2 === 1) ? COLS - 1 : COLS;
      for (var c = 0; c < maxC; c++) {
        if (grid[r][c] < 0) continue;
        var pos = getGridPos(r, c);
        var dx = bx - pos.x;
        var dy = by - pos.y;
        if (Math.sqrt(dx * dx + dy * dy) < bubbleR * 1.8) {
          return true;
        }
      }
    }
    return by - bubbleR <= gridOffsetY;
  }

  // --- Drawing ---
  function drawBg() {
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0a23');
    grad.addColorStop(1, '#16213e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawBubble(x, y, colorIdx, r) {
    if (colorIdx < 0) return;
    var rad = r || bubbleR;
    var color = COLORS[colorIdx];

    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();

    // Highlight
    var grad = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.3, rad * 0.1, x, y, rad);
    grad.addColorStop(0, 'rgba(255,255,255,0.4)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.beginPath();
    ctx.arc(x, y, rad - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawGrid() {
    for (var r = 0; r < ROWS; r++) {
      var maxC = (r % 2 === 1) ? COLS - 1 : COLS;
      for (var c = 0; c < maxC; c++) {
        if (grid[r] && grid[r][c] >= 0) {
          var pos = getGridPos(r, c);
          drawBubble(pos.x, pos.y, grid[r][c]);
        }
      }
    }
  }

  function drawShooter() {
    if (!shooterBubble) return;
    var sx = shooterBubble.x;
    var sy = shooterBubble.y;

    // Aim line
    if (state === STATE.AIMING) {
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(aimAngle) * 200, sy + Math.sin(aimAngle) * 200);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    drawBubble(sx, sy, shooterBubble.color);

    // Next bubble indicator
    drawBubble(W / 2 - bubbleR * 3, sy, nextColor, bubbleR * 0.6);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('NEXT', W / 2 - bubbleR * 3, sy + bubbleR + 12);
  }

  function drawFlyingBubble() {
    if (!flyingBubble) return;
    drawBubble(flyingBubble.x, flyingBubble.y, flyingBubble.color);
  }

  function drawParticles() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // --- Input ---
  function onPointerMove(e) {
    if (state !== STATE.AIMING) return;
    var p = e.touches ? e.touches[0] : e;
    var dx = p.clientX - shooterBubble.x;
    var dy = p.clientY - shooterBubble.y;
    var angle = Math.atan2(dy, dx);
    if (angle < -0.1) aimAngle = angle;
  }

  function onPointerUp(e) {
    if (state !== STATE.AIMING || !shooterBubble) return;
    e.preventDefault();
    shoot();
  }

  function shoot() {
    var speed = 12;
    flyingBubble = {
      x: shooterBubble.x,
      y: shooterBubble.y,
      vx: Math.cos(aimAngle) * speed,
      vy: Math.sin(aimAngle) * speed,
      color: shooterBubble.color
    };
    shooterBubble = null;
    state = STATE.FLYING;
    playShoot();
  }

  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('touchmove', function (e) { e.preventDefault(); onPointerMove(e); }, { passive: false });
  canvas.addEventListener('touchend', function (e) { e.preventDefault(); onPointerUp(e); }, { passive: false });

  // --- Game Flow ---
  function startGame() {
    state = STATE.AIMING;
    resetGame();
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
  }

  function endGame() {
    state = STATE.GAMEOVER;
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
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
  }

  document.getElementById('playBtn').addEventListener('click', startGame);
  document.getElementById('retryBtn').addEventListener('click', startGame);
  document.getElementById('menuBtn').addEventListener('click', showMenu);
  document.getElementById('shareBtn').addEventListener('click', function () { fbShare(score); });
  document.getElementById('leaderboardBtn').addEventListener('click', showLeaderboard);
  document.getElementById('soundToggle').addEventListener('click', function () {
    soundOn = !soundOn;
    this.textContent = 'Sound: ' + (soundOn ? 'ON' : 'OFF');
  });

  // --- Main Loop ---
  function update() {
    if (state === STATE.FLYING && flyingBubble) {
      flyingBubble.x += flyingBubble.vx;
      flyingBubble.y += flyingBubble.vy;

      // Wall bounce
      if (flyingBubble.x - bubbleR <= 0 || flyingBubble.x + bubbleR >= W) {
        flyingBubble.vx *= -1;
        flyingBubble.x = Math.max(bubbleR, Math.min(W - bubbleR, flyingBubble.x));
      }

      // Hit top or grid
      if (checkHitGrid(flyingBubble.x, flyingBubble.y)) {
        placeBubble(flyingBubble.x, flyingBubble.y, flyingBubble.color);
        flyingBubble = null;
      }

      // Miss (went off bottom somehow)
      if (flyingBubble && flyingBubble.y > H + bubbleR * 2) {
        flyingBubble = null;
        spawnShooter();
        state = STATE.AIMING;
      }
    }

    // Particles
    for (var i = particles.length - 1; i >= 0; i--) {
      particles[i].x += particles[i].vx;
      particles[i].y += particles[i].vy;
      particles[i].vy += 0.15;
      particles[i].life -= 0.025;
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    drawBg();
    if (state >= STATE.AIMING) {
      drawGrid();
      drawShooter();
      drawFlyingBubble();
      drawParticles();

      // Danger line
      var dangerY = getGridPos(ROWS - 2, 0).y;
      ctx.strokeStyle = 'rgba(255,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, dangerY);
      ctx.lineTo(W, dangerY);
      ctx.stroke();
      ctx.setLineDash([]);
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
