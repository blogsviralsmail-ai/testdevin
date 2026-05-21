(function () {
  'use strict';

  // --- FB Instant Games SDK ---
  var fbReady = false;
  var playerName = 'Player';
  var playerPhoto = '';
  var bestScore = 0;
  var contextId = null;

  function fbShowMenu() {
    if (fbReady) return;
    fbReady = true;
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('menu-screen').classList.remove('hidden');
  }

  function initFB() {
    var fallbackTimer = setTimeout(fbShowMenu, 3000);

    if (typeof FBInstant === 'undefined' || !FBInstant.initializeAsync) {
      clearTimeout(fallbackTimer);
      fbShowMenu();
      return;
    }
    FBInstant.initializeAsync().then(function () {
      playerName = FBInstant.player.getName() || 'Player';
      playerPhoto = FBInstant.player.getPhoto() || '';
      contextId = FBInstant.context.getID();
      FBInstant.setLoadingProgress(100);
      return FBInstant.startGameAsync();
    }).then(function () {
      clearTimeout(fallbackTimer);
      // Load player data after game starts (non-blocking)
      FBInstant.player.getDataAsync(['bestScore']).then(function (data) {
        if (data && data.bestScore) {
          bestScore = data.bestScore;
          document.getElementById('bestScore').textContent = bestScore;
        }
      }).catch(function () {});
      fbShowMenu();
    }).catch(function (e) {
      console.error('FB Init error:', e);
      clearTimeout(fallbackTimer);
      // Must still call startGameAsync to dismiss FB loading overlay
      if (FBInstant.startGameAsync) {
        FBInstant.startGameAsync().then(fbShowMenu).catch(fbShowMenu);
      } else {
        fbShowMenu();
      }
    });
  }

  function saveBestScore(score) {
    if (typeof FBInstant === 'undefined') return;
    FBInstant.player.setDataAsync({ bestScore: score }).catch(function () {});
    FBInstant.setSessionData({ score: score });
    if (FBInstant.getLeaderboardAsync) {
      FBInstant.getLeaderboardAsync('basketball_highscore').then(function (lb) {
        return lb.setScoreAsync(score);
      }).catch(function () {});
    }
  }

  function shareScore(score) {
    if (typeof FBInstant === 'undefined') return;
    var canvas = document.getElementById('gameCanvas');
    var shareImg = canvas.toDataURL('image/png');
    FBInstant.shareAsync({
      intent: 'SCORE',
      image: shareImg,
      text: playerName + ' scored ' + score + ' in KKHS Basketball! Can you beat it?',
      data: { score: score }
    }).catch(function () {});
  }

  function showLeaderboard() {
    if (typeof FBInstant === 'undefined') { alert('Leaderboard available on Facebook'); return; }
    FBInstant.getLeaderboardAsync('basketball_highscore').then(function (lb) {
      return lb.getEntriesAsync(10, 0);
    }).then(function (entries) {
      var msg = 'Top 10:\n';
      entries.forEach(function (e, i) {
        msg += (i + 1) + '. ' + e.getPlayer().getName() + ' - ' + e.getScore() + '\n';
      });
      alert(msg);
    }).catch(function () {
      alert('Leaderboard not available');
    });
  }

  // --- Canvas Setup ---
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  var W, H, scale;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    scale = Math.min(W / 400, H / 700);
  }
  window.addEventListener('resize', resize);
  resize();

  // --- Audio ---
  var soundOn = true;
  var audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playSound(freq, duration, type) {
    if (!soundOn) return;
    try {
      var ac = getAudioCtx();
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration);
    } catch (e) {}
  }

  function playSwoosh() { playSound(300, 0.15, 'sine'); }
  function playScore() { playSound(523, 0.1, 'sine'); setTimeout(function () { playSound(659, 0.1, 'sine'); }, 100); setTimeout(function () { playSound(784, 0.15, 'sine'); }, 200); }
  function playMiss() { playSound(200, 0.3, 'triangle'); }
  function playBounce() { playSound(400, 0.08, 'square'); }

  // --- Game State ---
  var STATE = { MENU: 0, PLAYING: 1, GAMEOVER: 2 };
  var state = STATE.MENU;
  var score = 0;
  var streak = 0;
  var balls = [];
  var particles = [];
  var hoopX, hoopY, hoopW;
  var hoopSpeed = 0;
  var hoopDir = 1;
  var throwStart = null;
  var isDragging = false;
  var ballRadius;
  var gravity;
  var currentBall = null;
  var ballStartX, ballStartY;
  var aimLine = null;
  var netSwayTimer = 0;
  var netSwayAmount = 0;

  function resetGame() {
    score = 0;
    streak = 0;
    hoopSpeed = 0;
    hoopDir = 1;
    balls = [];
    particles = [];
    netSwayTimer = 0;
    netSwayAmount = 0;
    ballRadius = 18 * scale;
    gravity = 0.4 * scale;
    hoopW = 70 * scale;
    hoopX = W / 2;
    hoopY = H * 0.25;
    ballStartX = W / 2;
    ballStartY = H * 0.75;
    spawnBall();
    updateHUD();
  }

  function spawnBall() {
    currentBall = {
      x: ballStartX,
      y: ballStartY,
      vx: 0,
      vy: 0,
      r: ballRadius,
      thrown: false,
      scored: false,
      missed: false,
      rotation: 0,
      rotSpeed: 0
    };
  }

  function updateHUD() {
    document.getElementById('score').textContent = score;
    document.getElementById('streak').textContent = streak;
  }

  // --- Drawing ---
  function drawBackground() {
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#16213e');
    grad.addColorStop(1, '#0f3460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Court lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(0, H * 0.6);
    ctx.lineTo(W, H * 0.6);
    ctx.stroke();
  }

  function drawHoop() {
    var rimY = hoopY;
    var rimLeft = hoopX - hoopW / 2;
    var rimRight = hoopX + hoopW / 2;
    var rimThick = 4 * scale;

    // Backboard
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(hoopX - hoopW * 0.6, rimY - 40 * scale, hoopW * 1.2, 50 * scale);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(hoopX - hoopW * 0.6, rimY - 40 * scale, hoopW * 1.2, 50 * scale);

    // Backboard square
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.strokeRect(hoopX - hoopW * 0.3, rimY - 25 * scale, hoopW * 0.6, 30 * scale);

    // Rim
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = rimThick;
    ctx.beginPath();
    ctx.moveTo(rimLeft, rimY);
    ctx.lineTo(rimRight, rimY);
    ctx.stroke();

    // Rim ends (circles)
    ctx.fillStyle = '#ff4500';
    ctx.beginPath();
    ctx.arc(rimLeft, rimY, rimThick, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rimRight, rimY, rimThick, 0, Math.PI * 2);
    ctx.fill();

    // Net
    var netH = 35 * scale;
    var netSegs = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1.5 * scale;
    for (var i = 0; i <= netSegs; i++) {
      var t = i / netSegs;
      var topX = rimLeft + (rimRight - rimLeft) * t;
      var botX = hoopX + (topX - hoopX) * 0.5 + Math.sin(netSwayTimer + i) * netSwayAmount;
      ctx.beginPath();
      ctx.moveTo(topX, rimY);
      ctx.quadraticCurveTo((topX + botX) / 2, rimY + netH * 0.6, botX, rimY + netH);
      ctx.stroke();
    }
    // Horizontal net lines
    for (var j = 1; j <= 3; j++) {
      var ny = rimY + (netH / 4) * j;
      ctx.beginPath();
      for (var i2 = 0; i2 <= netSegs; i2++) {
        var t2 = i2 / netSegs;
        var topX2 = rimLeft + (rimRight - rimLeft) * t2;
        var frac = (ny - rimY) / netH;
        var nx = hoopX + (topX2 - hoopX) * (1 - frac * 0.5) + Math.sin(netSwayTimer + i2) * netSwayAmount * frac;
        if (i2 === 0) ctx.moveTo(nx, ny); else ctx.lineTo(nx, ny);
      }
      ctx.stroke();
    }
  }

  function drawBall(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rotation);

    // Ball shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(3 * scale, 3 * scale, b.r, b.r * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ball body
    var grad = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.3, b.r * 0.1, 0, 0, b.r);
    grad.addColorStop(0, '#ff8c42');
    grad.addColorStop(0.6, '#e65c00');
    grad.addColorStop(1, '#b34700');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fill();

    // Ball lines
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(-b.r, 0);
    ctx.lineTo(b.r, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, b.r * 0.5, -Math.PI * 0.5, Math.PI * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, b.r * 0.5, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();

    ctx.restore();
  }

  function drawParticles() {
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawAimLine() {
    if (!aimLine || !currentBall || currentBall.thrown) return;
    ctx.setLineDash([5 * scale, 5 * scale]);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(currentBall.x, currentBall.y);
    ctx.lineTo(currentBall.x + aimLine.vx * 5, currentBall.y + aimLine.vy * 5);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawTrajectoryDots() {
    if (!aimLine || !currentBall || currentBall.thrown) return;
    var px = currentBall.x, py = currentBall.y;
    var vx = aimLine.vx, vy = aimLine.vy;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (var i = 0; i < 15; i++) {
      px += vx;
      py += vy;
      vy += gravity;
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.arc(px, py, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // --- Particles ---
  function spawnScoreParticles(x, y) {
    for (var i = 0; i < 15; i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 8 * scale,
        vy: (Math.random() - 1) * 6 * scale,
        size: (Math.random() * 4 + 2) * scale,
        color: Math.random() > 0.5 ? '#f7a440' : '#ff6b35',
        life: 1
      });
    }
  }

  // --- Physics & Collision ---
  function checkScore(b) {
    if (b.scored || b.missed) return;
    var rimLeft = hoopX - hoopW / 2;
    var rimRight = hoopX + hoopW / 2;
    var rimY2 = hoopY;

    // Ball passing through hoop from above
    if (b.vy > 0 && b.y > rimY2 - b.r && b.y < rimY2 + b.r * 2 &&
        b.x > rimLeft + b.r * 0.3 && b.x < rimRight - b.r * 0.3) {
      b.scored = true;
      streak++;
      var points = streak >= 5 ? 5 : streak >= 3 ? 3 : streak >= 2 ? 2 : 1;
      score += points;
      updateHUD();
      spawnScoreParticles(b.x, b.y);
      playScore();
      netSwayAmount = 8 * scale;
      netSwayTimer = 0;

      // Increase difficulty
      if (hoopSpeed < 3 * scale) hoopSpeed += 0.15 * scale;

      // Spawn next ball after delay
      setTimeout(function () {
        if (state === STATE.PLAYING) spawnBall();
      }, 400);
    }
  }

  function checkMiss(b) {
    if (b.scored || b.missed) return;
    if (b.y > H + b.r * 2 || b.x < -b.r * 2 || b.x > W + b.r * 2) {
      b.missed = true;
      streak = 0;
      updateHUD();
      playMiss();
      // Game over
      setTimeout(function () {
        endGame();
      }, 300);
    }
  }

  function checkRimBounce(b) {
    if (b.scored) return;
    var rimLeft = hoopX - hoopW / 2;
    var rimRight = hoopX + hoopW / 2;
    var rimY2 = hoopY;
    var rimR = 5 * scale;

    // Left rim
    var dx = b.x - rimLeft;
    var dy = b.y - rimY2;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < b.r + rimR && b.vy > -2) {
      var nx = dx / dist;
      var ny = dy / dist;
      var dot = b.vx * nx + b.vy * ny;
      b.vx -= 1.5 * dot * nx;
      b.vy -= 1.5 * dot * ny;
      b.vx *= 0.7;
      b.vy *= 0.7;
      b.x = rimLeft + nx * (b.r + rimR);
      b.y = rimY2 + ny * (b.r + rimR);
      playBounce();
    }

    // Right rim
    dx = b.x - rimRight;
    dy = b.y - rimY2;
    dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < b.r + rimR && b.vy > -2) {
      var nx2 = dx / dist;
      var ny2 = dy / dist;
      var dot2 = b.vx * nx2 + b.vy * ny2;
      b.vx -= 1.5 * dot2 * nx2;
      b.vy -= 1.5 * dot2 * ny2;
      b.vx *= 0.7;
      b.vy *= 0.7;
      b.x = rimRight + nx2 * (b.r + rimR);
      b.y = rimY2 + ny2 * (b.r + rimR);
      playBounce();
    }
  }

  // --- Input ---
  function getXY(e) {
    var t = e.touches ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  }

  function onStart(e) {
    if (state !== STATE.PLAYING || !currentBall || currentBall.thrown) return;
    e.preventDefault();
    var p = getXY(e);
    var dx = p.x - currentBall.x;
    var dy = p.y - currentBall.y;
    if (Math.sqrt(dx * dx + dy * dy) < ballRadius * 3) {
      isDragging = true;
      throwStart = p;
    }
  }

  function onMove(e) {
    if (!isDragging || !throwStart) return;
    e.preventDefault();
    var p = getXY(e);
    aimLine = {
      vx: (throwStart.x - p.x) * 0.15,
      vy: (throwStart.y - p.y) * 0.15
    };
  }

  function onEnd(e) {
    if (!isDragging || !throwStart) return;
    e.preventDefault();
    isDragging = false;
    var p;
    if (e.changedTouches) p = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    else p = { x: e.clientX, y: e.clientY };

    var dx = throwStart.x - p.x;
    var dy = throwStart.y - p.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 15 && dy > 0) {
      var power = Math.min(dist * 0.15, 20 * scale);
      var angle = Math.atan2(dy, dx);
      currentBall.vx = Math.cos(angle) * power;
      currentBall.vy = -Math.abs(Math.sin(angle) * power);
      currentBall.thrown = true;
      currentBall.rotSpeed = currentBall.vx * 0.05;
      playSwoosh();
    }

    throwStart = null;
    aimLine = null;
  }

  canvas.addEventListener('mousedown', onStart);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onEnd);
  canvas.addEventListener('touchstart', onStart, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onEnd, { passive: false });

  // --- Game Flow ---
  function startGame() {
    state = STATE.PLAYING;
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
      saveBestScore(bestScore);
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

  // --- UI Events ---
  document.getElementById('playBtn').addEventListener('click', startGame);
  document.getElementById('retryBtn').addEventListener('click', startGame);
  document.getElementById('menuBtn').addEventListener('click', showMenu);
  document.getElementById('shareBtn').addEventListener('click', function () { shareScore(score); });
  document.getElementById('leaderboardBtn').addEventListener('click', showLeaderboard);
  document.getElementById('soundToggle').addEventListener('click', function () {
    soundOn = !soundOn;
    this.textContent = 'Sound: ' + (soundOn ? 'ON' : 'OFF');
  });

  // --- Main Loop ---
  function update() {
    if (state !== STATE.PLAYING) return;

    // Move hoop
    if (hoopSpeed > 0) {
      hoopX += hoopSpeed * hoopDir;
      if (hoopX > W - hoopW) hoopDir = -1;
      if (hoopX < hoopW) hoopDir = 1;
    }

    // Net sway decay
    if (netSwayAmount > 0) {
      netSwayTimer += 0.3;
      netSwayAmount *= 0.95;
      if (netSwayAmount < 0.5) netSwayAmount = 0;
    }

    // Update current ball
    if (currentBall && currentBall.thrown) {
      currentBall.vy += gravity;
      currentBall.x += currentBall.vx;
      currentBall.y += currentBall.vy;
      currentBall.rotation += currentBall.rotSpeed;
      checkRimBounce(currentBall);
      checkScore(currentBall);
      checkMiss(currentBall);
    }

    // Update particles
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15 * scale;
      p.life -= 0.02;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    drawBackground();

    if (state === STATE.PLAYING) {
      drawHoop();
      drawAimLine();
      drawTrajectoryDots();
      if (currentBall) drawBall(currentBall);
      drawParticles();

      // Score popup
      if (streak >= 2 && currentBall && currentBall.scored) {
        ctx.fillStyle = '#f7a440';
        ctx.font = 'bold ' + (24 * scale) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(streak + 'x STREAK!', W / 2, H * 0.5);
      }
    }
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // --- Init ---
  initFB();
  loop();

})();
