/* ========== CONTENT RENDERER ========== */
/* Renders Video, Chart, PDF, Interactive tabs using richContentData from content-data.js */

(function () {
  const params = getParams();
  const key = params.classId + '-' + params.subject + '-' + params.chapter;

  function getChapterRichData() {
    // Check CBSE content data first if board is cbse
    if (params.board === 'cbse' && typeof cbseRichContentData !== 'undefined') {
      const cbseKey = 'cbse-' + key;
      if (cbseRichContentData[cbseKey]) return cbseRichContentData[cbseKey];
    }
    if (typeof richContentData !== 'undefined' && richContentData[key]) {
      return richContentData[key];
    }
    return generateDefaultRichContent(params);
  }

  function generateDefaultRichContent(p) {
    const activeSubjects = (typeof getActiveSubjectData === 'function') ? getActiveSubjectData() : subjectData;
    const activeChapters = (typeof getActiveChapterData === 'function') ? getActiveChapterData() : chapterData;
    const subj = (activeSubjects[p.classId] || []).find(s => s.id === p.subject) || {};
    const chapters = activeChapters[p.classId + '-' + p.subject] || [];
    const ch = chapters.find(c => String(c.id) === String(p.chapter)) || {};
    const chName = ch.name || 'Chapter ' + p.chapter;
    const chNameEn = ch.nameEn || '';
    const subjName = subj.name || p.subject;
    const subjNameEn = subj.nameEn || p.subject;
    const isCBSE = p.board === 'cbse';
    return {
      videos: [
        { title: chName + ' - Video Lesson', titleEn: chNameEn + ' - Explained', id: 'dQw4w9WgXcQ', duration: '15:00', views: '10K+' },
        { title: chName + ' - Quick Revision', titleEn: chNameEn + ' - Summary', id: 'dQw4w9WgXcQ', duration: '8:00', views: '5K+' }
      ],
      charts: [
        {
          title: chName + ' - Overview Chart',
          desc: isCBSE ? (chNameEn + ' - Key concepts overview') : (chNameEn + ' ના મુખ્ય concepts નો overview'),
          type: 'diagram',
          items: [
            { icon: '📖', label: 'Introduction', sublabel: isCBSE ? 'परिचय' : 'પરિચય' },
            { icon: '🔑', label: 'Key Concepts', sublabel: isCBSE ? 'मुख्य धारणाएँ' : 'મુખ્ય ખ્યાલો' },
            { icon: '📝', label: 'Practice', sublabel: isCBSE ? 'अभ्यास' : 'અભ્યાસ' },
            { icon: '✅', label: 'Summary', sublabel: isCBSE ? 'सारांश' : 'સારાંશ' }
          ]
        }
      ],
      pdf: {
        title: chName + ' - Study Notes',
        sections: isCBSE ? [
          { heading: 'Introduction (परिचय)', body: chNameEn + ' is an important part of ' + subjNameEn + '. In this chapter we will learn the key concepts as per NCERT syllabus.' },
          { heading: 'Key Points (मुख्य बिंदु)', list: ['Fundamental concepts of ' + chNameEn, 'Practical examples and applications', 'Important definitions and terms', 'Practice questions for CBSE board exams'] },
          { heading: 'Summary (सारांश)', body: 'In this chapter we learned the key concepts of ' + chNameEn + '. Practice regularly for better understanding.' }
        ] : [
          { heading: 'પરિચય (Introduction)', body: chNameEn + ' એ ' + subjNameEn + ' નો એક મહત્વપૂર્ણ ભાગ છે. આ પ્રકરણમાં આપણે મુખ્ય concepts શીખીશું.' },
          { heading: 'મુખ્ય મુદ્દાઓ (Key Points)', list: [chNameEn + ' ના મૂળભૂત સિદ્ધાંતો', 'વ્યવહારિક ઉદાહરણો', 'મહત્વપૂર્ણ પરિભાષાઓ', 'અભ્યાસ પ્રશ્નો'] },
          { heading: 'સારાંશ (Summary)', body: 'આ પ્રકરણમાં આપણે ' + chNameEn + ' ના મુખ્ય ખ્યાલો શીખ્યા. નિયમિત અભ્યાસ કરો.' }
        ]
      },
      interactive: [
        {
          type: 'truefalse',
          title: chName + ' - True/False',
          desc: isCBSE ? 'Are these statements True or False?' : 'નીચેના વિધાનો True છે કે False?',
          items: [
            { statement: chNameEn + ' is part of ' + subjNameEn, answer: true },
            { statement: chNameEn + ' is not important for exams', answer: false },
            { statement: 'Practice is essential for understanding ' + chNameEn, answer: true }
          ]
        }
      ]
    };
  }

  /* ===== RENDER VIDEOS ===== */
  function renderVideos(data) {
    const container = document.getElementById('video-container');
    if (!container) return;
    let html = '';
    (data.videos || []).forEach(v => {
      html += `
        <div class="video-card">
          <div class="video-embed">
            <iframe src="https://www.youtube.com/embed/${v.id}" allowfullscreen loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
          </div>
          <div class="video-info">
            <h3>${v.title}</h3>
            <p>${v.titleEn || ''}</p>
            <div class="video-meta">
              <span>⏱ ${v.duration || '10:00'}</span>
              <span>👁 ${v.views || '1K+'}</span>
            </div>
          </div>
        </div>`;
    });
    container.innerHTML = html;
  }

  /* ===== RENDER CHARTS ===== */
  function renderCharts(data) {
    const container = document.getElementById('chart-container');
    if (!container) return;
    let html = '';
    (data.charts || []).forEach(chart => {
      html += `<div class="chart-card"><h3>${chart.title}</h3>`;
      if (chart.desc) html += `<p class="chart-desc">${chart.desc}</p>`;

      if (chart.type === 'table' && chart.headers && chart.rows) {
        html += '<table class="chart-table"><thead><tr>';
        chart.headers.forEach(h => { html += `<th>${h}</th>`; });
        html += '</tr></thead><tbody>';
        chart.rows.forEach(row => {
          html += '<tr>';
          row.forEach(cell => { html += `<td>${cell}</td>`; });
          html += '</tr>';
        });
        html += '</tbody></table>';
      }

      if (chart.type === 'flowchart' && chart.steps) {
        html += '<div class="flowchart">';
        chart.steps.forEach((step, i) => {
          const cls = step.color || '';
          html += `<div class="flow-box ${cls}">${step.label}</div>`;
          if (i < chart.steps.length - 1) html += '<div class="flow-arrow">↓</div>';
        });
        html += '</div>';
      }

      if (chart.type === 'diagram' && chart.items) {
        html += '<div class="diagram-grid">';
        chart.items.forEach(item => {
          html += `<div class="diagram-item">
            <div class="icon">${item.icon || '📌'}</div>
            <div class="label">${item.label}</div>
            ${item.sublabel ? `<div class="sublabel">${item.sublabel}</div>` : ''}
          </div>`;
        });
        html += '</div>';
      }

      html += '</div>';
    });
    container.innerHTML = html;
  }

  /* ===== RENDER PDF ===== */
  function renderPDF(data) {
    const container = document.getElementById('pdf-container');
    if (!container) return;
    const pdf = data.pdf;
    if (!pdf) { container.innerHTML = '<p>No PDF notes available yet.</p>'; return; }
    let html = `<div class="pdf-card"><h3>📄 ${pdf.title}</h3><div class="pdf-content">`;
    (pdf.sections || []).forEach(sec => {
      html += `<h4>${sec.heading}</h4>`;
      if (sec.body) html += `<p>${sec.body}</p>`;
      if (sec.highlight) html += `<div class="highlight-box">${sec.highlight}</div>`;
      if (sec.formula) html += `<div class="formula-box">${sec.formula}</div>`;
      if (sec.note) html += `<div class="note-box">📌 ${sec.note}</div>`;
      if (sec.list) {
        html += '<ul>';
        sec.list.forEach(item => { html += `<li>${item}</li>`; });
        html += '</ul>';
      }
    });
    html += `</div>
      <button class="pdf-download-btn" onclick="window.print()">📥 Download / Print PDF</button>
    </div>`;
    container.innerHTML = html;
  }

  /* ===== RENDER INTERACTIVE ===== */
  function renderInteractive(data) {
    const container = document.getElementById('interactive-container');
    if (!container) return;
    let html = '';
    (data.interactive || []).forEach((act, actIdx) => {
      html += `<div class="activity-card">
        <h3>${act.title} <span class="activity-type">${act.type.toUpperCase()}</span></h3>
        <p class="activity-desc">${act.desc || ''}</p>`;

      if (act.type === 'fillblank') {
        (act.items || []).forEach((item, i) => {
          const uid = `fb-${actIdx}-${i}`;
          html += `<div class="fill-blank-item">${item.before}
            <input type="text" class="blank-input" id="${uid}" data-answer="${item.answer}" placeholder="___________">
            ${item.after || ''}</div>`;
        });
        html += `<button class="check-btn" onclick="checkFillBlanks(${actIdx})">✅ Check Answers</button>`;
      }

      if (act.type === 'matching') {
        html += '<div class="match-container"><div class="match-column"><h4>Column A</h4>';
        (act.pairs || []).forEach((pair, i) => {
          html += `<div class="match-item" data-match-a="${actIdx}-${i}" onclick="selectMatch(this,'a',${actIdx},${i})">${pair.a}</div>`;
        });
        html += '</div><div class="match-column"><h4>Column B</h4>';
        const shuffled = [...(act.pairs || [])].map((p, i) => ({ b: p.b, idx: i }));
        shuffled.sort(() => Math.random() - 0.5);
        shuffled.forEach(item => {
          html += `<div class="match-item" data-match-b="${actIdx}-${item.idx}" onclick="selectMatch(this,'b',${actIdx},${item.idx})">${item.b}</div>`;
        });
        html += '</div></div>';
        html += `<button class="check-btn" onclick="checkMatching(${actIdx})">✅ Check Matches</button>`;
      }

      if (act.type === 'truefalse') {
        (act.items || []).forEach((item, i) => {
          const uid = `tf-${actIdx}-${i}`;
          html += `<div class="tf-item">
            <span>${item.statement}</span>
            <div class="tf-buttons">
              <button class="tf-btn" id="${uid}-t" data-answer="${item.answer}" onclick="selectTF('${uid}',true)">True</button>
              <button class="tf-btn" id="${uid}-f" data-answer="${!item.answer}" onclick="selectTF('${uid}',false)">False</button>
            </div>
          </div>`;
        });
        html += `<button class="check-btn" onclick="checkTrueFalse(${actIdx})">✅ Check Answers</button>`;
      }

      if (act.type === 'ordering') {
        html += `<div class="order-list" id="order-${actIdx}">`;
        const items = [...(act.items || [])];
        items.sort(() => Math.random() - 0.5);
        items.forEach((item, i) => {
          html += `<div class="order-item" data-correct="${item.order}">
            <div class="order-num">${i + 1}</div>
            <span>${item.text}</span>
            <div class="order-arrows">
              <button onclick="moveOrder(this,-1)">▲</button>
              <button onclick="moveOrder(this,1)">▼</button>
            </div>
          </div>`;
        });
        html += '</div>';
        html += `<button class="check-btn" onclick="checkOrdering(${actIdx})">✅ Check Order</button>`;
      }

      html += `<div class="activity-result" id="result-${actIdx}">
        <div class="score" id="score-${actIdx}"></div>
        <p id="score-msg-${actIdx}"></p>
      </div></div>`;
    });
    container.innerHTML = html;
  }

  /* ===== TAB SWITCHING (override from app.js) ===== */
  window.switchTab = function (tab) {
    const tabs = ['content', 'video', 'chart', 'pdf', 'quiz', 'interactive'];
    tabs.forEach(t => {
      const el = document.getElementById('tab-' + t);
      const btn = document.getElementById('tab-' + t + '-btn');
      const side = document.getElementById('side-' + t);
      if (el) el.style.display = (t === tab) ? 'block' : 'none';
      if (btn) btn.classList.toggle('active', t === tab);
      if (side) side.classList.toggle('active', t === tab);
    });
    if (tab === 'quiz') { startQuiz(); }
  };

  /* ===== INTERACTIVE LOGIC ===== */
  window.checkFillBlanks = function (actIdx) {
    const inputs = document.querySelectorAll(`[id^="fb-${actIdx}-"]`);
    let correct = 0;
    inputs.forEach(inp => {
      const answer = inp.dataset.answer.toLowerCase().trim();
      const value = inp.value.toLowerCase().trim();
      if (value === answer) { inp.classList.add('correct'); inp.classList.remove('wrong'); correct++; }
      else { inp.classList.add('wrong'); inp.classList.remove('correct'); }
    });
    showResult(actIdx, correct, inputs.length);
  };

  window.matchSelections = {};
  window.selectMatch = function (el, side, actIdx, idx) {
    if (!window.matchSelections[actIdx]) window.matchSelections[actIdx] = {};
    const sel = window.matchSelections[actIdx];
    document.querySelectorAll(`[data-match-${side}^="${actIdx}-"]`).forEach(e => e.classList.remove('selected'));
    el.classList.add('selected');
    sel[side] = idx;
    if (sel.a !== undefined && sel.b !== undefined) {
      if (sel.a === sel.b) {
        document.querySelector(`[data-match-a="${actIdx}-${sel.a}"]`).classList.add('matched');
        document.querySelector(`[data-match-b="${actIdx}-${sel.b}"]`).classList.add('matched');
        document.querySelectorAll(`[data-match-a^="${actIdx}-"], [data-match-b^="${actIdx}-"]`).forEach(e => e.classList.remove('selected'));
      }
      sel.a = undefined; sel.b = undefined;
    }
  };

  window.checkMatching = function (actIdx) {
    const aItems = document.querySelectorAll(`[data-match-a^="${actIdx}-"]`);
    let correct = 0;
    aItems.forEach(el => { if (el.classList.contains('matched')) correct++; });
    showResult(actIdx, correct, aItems.length);
  };

  window.tfSelections = {};
  window.selectTF = function (uid, value) {
    const tBtn = document.getElementById(uid + '-t');
    const fBtn = document.getElementById(uid + '-f');
    tBtn.classList.remove('selected-true', 'selected-false');
    fBtn.classList.remove('selected-true', 'selected-false');
    if (value) tBtn.classList.add('selected-true');
    else fBtn.classList.add('selected-false');
    window.tfSelections[uid] = value;
  };

  window.checkTrueFalse = function (actIdx) {
    const items = document.querySelectorAll(`[id^="tf-${actIdx}-"][id$="-t"]`);
    let correct = 0;
    items.forEach(tBtn => {
      const uid = tBtn.id.replace('-t', '');
      const answer = tBtn.dataset.answer === 'true';
      const selected = window.tfSelections[uid];
      if (selected === answer) correct++;
    });
    showResult(actIdx, correct, items.length);
  };

  window.moveOrder = function (btn, dir) {
    const item = btn.closest('.order-item');
    const list = item.parentElement;
    if (dir === -1 && item.previousElementSibling) {
      list.insertBefore(item, item.previousElementSibling);
    } else if (dir === 1 && item.nextElementSibling) {
      list.insertBefore(item.nextElementSibling, item);
    }
    list.querySelectorAll('.order-item').forEach((el, i) => {
      el.querySelector('.order-num').textContent = i + 1;
    });
  };

  window.checkOrdering = function (actIdx) {
    const items = document.querySelectorAll(`#order-${actIdx} .order-item`);
    let correct = 0;
    items.forEach((el, i) => {
      if (parseInt(el.dataset.correct) === i + 1) {
        el.style.borderColor = '#4CAF50'; correct++;
      } else {
        el.style.borderColor = '#FF6B6B';
      }
    });
    showResult(actIdx, correct, items.length);
  };

  function showResult(actIdx, correct, total) {
    const result = document.getElementById('result-' + actIdx);
    const score = document.getElementById('score-' + actIdx);
    const msg = document.getElementById('score-msg-' + actIdx);
    if (!result) return;
    result.classList.add('show');
    score.textContent = correct + ' / ' + total;
    const pct = (correct / total) * 100;
    if (pct === 100) msg.textContent = '🎉 Perfect! Excellent job!';
    else if (pct >= 70) msg.textContent = '👏 Great work! Keep it up!';
    else if (pct >= 40) msg.textContent = '📖 Good try! Review the content and try again.';
    else msg.textContent = '💪 Keep practicing! You can do it!';
  }

  /* ===== INIT ===== */
  function initContent() {
    const data = getChapterRichData();
    renderVideos(data);
    renderCharts(data);
    renderPDF(data);
    renderInteractive(data);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContent);
  } else {
    initContent();
  }
})();
