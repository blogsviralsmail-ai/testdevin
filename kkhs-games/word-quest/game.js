(function () {
  'use strict';

  // --- Word Database ---
  var WORD_SETS = [
    { letters: 'CATDOG', words: ['CAT', 'COD', 'COG', 'COT', 'DAG', 'DOC', 'DOG', 'DOT', 'GAT', 'GOD', 'GOT', 'OAT', 'TAG', 'TAD', 'TAO', 'TOD', 'TOG', 'ADO', 'AGO', 'GAD', 'OCA', 'COAT', 'GOAT', 'TACO', 'TOGA'] },
    { letters: 'SUNRKE', words: ['RUN', 'SUN', 'USE', 'RUE', 'URN', 'INK', 'NUB', 'RUB', 'SUE', 'ERN', 'SEN', 'RES', 'NUS', 'RUNE', 'RUSE', 'SURE', 'USER', 'NUKE', 'RUNES', 'NURSE'] },
    { letters: 'PLAYTE', words: ['PAL', 'PAT', 'PAY', 'PEA', 'APE', 'APT', 'ATE', 'EAT', 'LAP', 'LAY', 'LEA', 'LET', 'ALP', 'ALE', 'TAP', 'TEA', 'YAP', 'YET', 'PET', 'PLY', 'LATE', 'LEAP', 'PALE', 'PEAL', 'PLAY', 'PLEA', 'TALE', 'TAPE', 'TYPE', 'PLATE', 'PETAL', 'LEAPT'] },
    { letters: 'FHSIRE', words: ['FIG', 'FIN', 'FIR', 'HER', 'HIS', 'IRE', 'SHE', 'SIR', 'HEF', 'REF', 'RIF', 'SER', 'FIRE', 'FISH', 'HIRE', 'RISE', 'RIFE', 'FIRS', 'HERS', 'SHIRE', 'FRESH', 'FISHER'] },
    { letters: 'BRDAEN', words: ['BAD', 'BAN', 'BAR', 'BED', 'BEN', 'DEN', 'EAR', 'END', 'ERA', 'RAN', 'RED', 'AND', 'ARE', 'BANE', 'BAND', 'BARE', 'BARN', 'BEAN', 'BEAR', 'BEND', 'BEAD', 'DEAR', 'EARN', 'NEAR', 'READ', 'BRAND', 'BREAD'] },
    { letters: 'TMLIGH', words: ['GIT', 'HIM', 'HIT', 'LIT', 'MIG', 'GILT', 'GRIT', 'GRIM', 'HILT', 'GIRTH', 'LIGHT', 'MIGHT', 'TIGHT', 'BLIGHT'] },
    { letters: 'WORNDS', words: ['DON', 'NOR', 'NOW', 'OWN', 'ROD', 'ROW', 'SON', 'SOW', 'WON', 'DOWN', 'DONS', 'GOWN', 'NODS', 'ROWS', 'SNOW', 'SOWN', 'WORD', 'WORN', 'DROWN', 'FROWN', 'SWORD', 'WORDS', 'DOWNS', 'SHOWN', 'SWORN', 'CROWN', 'DROWNS'] },
    { letters: 'STAREK', words: ['ATE', 'ARE', 'ART', 'ASK', 'EAR', 'EAT', 'ERA', 'RAT', 'SAT', 'SEA', 'SET', 'TAR', 'TEA', 'EARS', 'EAST', 'EATS', 'RATE', 'REST', 'SAKE', 'SEAR', 'SEAT', 'STAR', 'TAKE', 'TASK', 'TEAR', 'SAKE', 'RATES', 'SKATE', 'STARE', 'STEAK', 'TAKES', 'TEARS', 'STAKE'] },
    { letters: 'HCEMSA', words: ['ACE', 'ACS', 'ASH', 'CAM', 'HAM', 'HAS', 'HEM', 'MAC', 'MAS', 'SAC', 'SHE', 'ACES', 'ACME', 'CAME', 'CASE', 'CASH', 'EACH', 'HAMS', 'LAME', 'MACE', 'MASH', 'MESA', 'SAME', 'SEAM', 'SHAM', 'SHAME', 'CHASE', 'MACES', 'SCHEMA'] },
    { letters: 'FLOWED', words: ['DEW', 'ELF', 'FED', 'FEW', 'FLO', 'FLU', 'FLY', 'FOE', 'LED', 'LOW', 'ODE', 'OLD', 'OWE', 'OWL', 'OWN', 'WED', 'WOE', 'DOLE', 'FLOW', 'FLED', 'FLEW', 'FOLD', 'FOWL', 'LODE', 'OWED', 'WELD', 'WOLF', 'FLOWED'] }
  ];

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
      FBInstant.getLeaderboardAsync('wordquest_highscore').then(function (lb) {
        return lb.setScoreAsync(s);
      }).catch(function () {});
    }
  }

  function fbShare(s) {
    if (typeof FBInstant === 'undefined') return;
    FBInstant.shareAsync({
      intent: 'SCORE',
      image: document.getElementById('gameCanvas').toDataURL('image/png'),
      text: playerName + ' scored ' + s + ' in KKHS Word Quest! Can you find more words?',
      data: { score: s }
    }).catch(function () {});
  }

  function showLeaderboard() {
    if (typeof FBInstant === 'undefined') { alert('Leaderboard available on Facebook'); return; }
    FBInstant.getLeaderboardAsync('wordquest_highscore').then(function (lb) {
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
  var audioCtx = null;
  function getAC() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); return audioCtx; }
  function playSelect() {
    if (!soundOn) return;
    try { var a = getAC(); var o = a.createOscillator(); var g = a.createGain(); o.type = 'sine'; o.frequency.value = 440; g.gain.setValueAtTime(0.1, a.currentTime); g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.08); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.08); } catch (e) {}
  }
  function playCorrect() {
    if (!soundOn) return;
    try { var a = getAC(); [523, 659, 784].forEach(function (f, i) { var o = a.createOscillator(); var g = a.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.15, a.currentTime + i * 0.1); g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + i * 0.1 + 0.15); o.connect(g); g.connect(a.destination); o.start(a.currentTime + i * 0.1); o.stop(a.currentTime + i * 0.1 + 0.15); }); } catch (e) {}
  }
  function playWrong() {
    if (!soundOn) return;
    try { var a = getAC(); var o = a.createOscillator(); var g = a.createGain(); o.type = 'sawtooth'; o.frequency.value = 200; g.gain.setValueAtTime(0.1, a.currentTime); g.gain.exponentialRampToValueAtTime(0.01, a.currentTime + 0.2); o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + 0.2); } catch (e) {}
  }

  // --- Game State ---
  var STATE = { MENU: 0, PLAYING: 1, GAMEOVER: 2 };
  var state = STATE.MENU;
  var currentSet = null;
  var letters = [];
  var letterPositions = [];
  var selectedIndices = [];
  var currentWord = '';
  var foundWords = [];
  var score = 0;
  var level = 1;
  var totalWordsFound = 0;
  var timeLeft = 60;
  var timerInterval = null;
  var particles = [];
  var isDragging = false;
  var letterRadius;

  function setupLevel() {
    var setIdx = (level - 1) % WORD_SETS.length;
    currentSet = WORD_SETS[setIdx];
    letters = currentSet.letters.split('');
    // Shuffle letters
    for (var i = letters.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = letters[i]; letters[i] = letters[j]; letters[j] = tmp;
    }
    foundWords = [];
    selectedIndices = [];
    currentWord = '';
    timeLeft = 60 + level * 5;
    calcLetterPositions();
    updateWordDisplay();
    updateFoundWords();
    document.getElementById('level').textContent = level;
    document.getElementById('score').textContent = score;
  }

  function calcLetterPositions() {
    letterRadius = Math.min(W * 0.1, 35);
    var cx = W / 2;
    var cy = H * 0.72;
    var ringR = letterRadius * 2.2;
    letterPositions = [];
    var n = letters.length;
    for (var i = 0; i < n; i++) {
      var angle = (Math.PI * 2 * i / n) - Math.PI / 2;
      letterPositions.push({
        x: cx + Math.cos(angle) * ringR,
        y: cy + Math.sin(angle) * ringR
      });
    }
  }

  function updateWordDisplay() {
    document.getElementById('wordDisplay').textContent = currentWord || '';
  }

  function updateFoundWords() {
    var container = document.getElementById('foundWords');
    container.innerHTML = '';
    foundWords.forEach(function (w) {
      var tag = document.createElement('span');
      tag.className = 'word-tag';
      tag.textContent = w;
      container.appendChild(tag);
    });
  }

  function submitWord() {
    if (currentWord.length < 3) {
      playWrong();
      resetSelection();
      return;
    }

    if (foundWords.indexOf(currentWord) >= 0) {
      playWrong();
      resetSelection();
      return;
    }

    if (currentSet.words.indexOf(currentWord) >= 0) {
      // Valid word
      var wordScore = currentWord.length * 10 + (currentWord.length > 4 ? 20 : 0);
      score += wordScore;
      foundWords.push(currentWord);
      totalWordsFound++;
      playCorrect();
      spawnWordParticles();
      updateFoundWords();
      document.getElementById('score').textContent = score;

      // Check if all words found
      if (foundWords.length >= currentSet.words.length) {
        // Bonus and next level
        score += 50;
        level++;
        setupLevel();
      }
    } else {
      playWrong();
    }
    resetSelection();
  }

  function resetSelection() {
    selectedIndices = [];
    currentWord = '';
    updateWordDisplay();
  }

  function spawnWordParticles() {
    var cx = W / 2;
    var cy = H * 0.45;
    for (var i = 0; i < 10; i++) {
      particles.push({
        x: cx, y: cy,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 1) * 5,
        size: Math.random() * 5 + 2,
        color: '#48c9b0',
        life: 1
      });
    }
  }

  // --- Drawing ---
  function drawBg() {
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0d1b2a');
    grad.addColorStop(1, '#1b2838');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  function drawLetters() {
    for (var i = 0; i < letters.length; i++) {
      var pos = letterPositions[i];
      var isSelected = selectedIndices.indexOf(i) >= 0;

      // Circle bg
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, letterRadius, 0, Math.PI * 2);
      if (isSelected) {
        ctx.fillStyle = '#48c9b0';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
      }
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#1abc9c' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Letter
      ctx.fillStyle = isSelected ? '#0d1b2a' : '#fff';
      ctx.font = 'bold ' + (letterRadius * 0.9) + 'px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letters[i], pos.x, pos.y);
    }

    // Draw line connecting selected
    if (selectedIndices.length > 1) {
      ctx.strokeStyle = 'rgba(72,201,176,0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (var j = 0; j < selectedIndices.length; j++) {
        var p = letterPositions[selectedIndices[j]];
        if (j === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }
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

  function drawTimer() {
    // Timer arc
    var cx = W / 2;
    var cy = H * 0.42;
    var r = 30;
    var maxTime = 60 + level * 5;
    var frac = timeLeft / maxTime;
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = frac > 0.3 ? '#48c9b0' : '#ff4757';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.ceil(timeLeft), cx, cy);
  }

  // --- Input ---
  function hitTestLetter(x, y) {
    for (var i = 0; i < letterPositions.length; i++) {
      var p = letterPositions[i];
      var dx = x - p.x;
      var dy = y - p.y;
      if (Math.sqrt(dx * dx + dy * dy) < letterRadius * 1.2) return i;
    }
    return -1;
  }

  function onStart(e) {
    if (state !== STATE.PLAYING) return;
    e.preventDefault();
    var p = e.touches ? e.touches[0] : e;
    var idx = hitTestLetter(p.clientX, p.clientY);
    if (idx >= 0) {
      isDragging = true;
      resetSelection();
      selectedIndices.push(idx);
      currentWord = letters[idx];
      updateWordDisplay();
      playSelect();
    }
  }

  function onMove(e) {
    if (!isDragging || state !== STATE.PLAYING) return;
    e.preventDefault();
    var p = e.touches ? e.touches[0] : e;
    var idx = hitTestLetter(p.clientX, p.clientY);
    if (idx >= 0 && selectedIndices.indexOf(idx) < 0) {
      selectedIndices.push(idx);
      currentWord += letters[idx];
      updateWordDisplay();
      playSelect();
    }
  }

  function onEnd(e) {
    if (!isDragging) return;
    e.preventDefault();
    isDragging = false;
    submitWord();
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
    score = 0;
    level = 1;
    totalWordsFound = 0;
    setupLevel();
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(function () {
      if (state !== STATE.PLAYING) return;
      timeLeft -= 1;
      document.getElementById('timer').textContent = Math.floor(timeLeft / 60) + ':' + (timeLeft % 60 < 10 ? '0' : '') + Math.floor(timeLeft % 60);
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  function endGame() {
    state = STATE.GAMEOVER;
    if (timerInterval) clearInterval(timerInterval);
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
    document.getElementById('finalScore').textContent = score;
    document.getElementById('wordsFoundCount').textContent = totalWordsFound;
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
    if (timerInterval) clearInterval(timerInterval);
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

  // --- Loop ---
  function update() {
    for (var i = particles.length - 1; i >= 0; i--) {
      particles[i].x += particles[i].vx;
      particles[i].y += particles[i].vy;
      particles[i].vy += 0.1;
      particles[i].life -= 0.025;
      if (particles[i].life <= 0) particles.splice(i, 1);
    }
  }

  function draw() {
    drawBg();
    if (state === STATE.PLAYING) {
      drawTimer();
      drawLetters();
      drawParticles();
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
