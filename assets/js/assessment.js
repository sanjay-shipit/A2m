/* Adtomate — AI Transformation Assessment engine.
   Scores 6 readiness categories from ~13 questions, derives an opportunity
   read and a lead tier, then hands off to Firestore (best-effort) + WhatsApp. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.getElementById('quiz');
  if (!root) return;

  /* ---------- Question bank ----------
     type: 'single' | 'multi' | 'scale'
     category: which readiness bucket this scores into (or 'context' for none)
     scoreFromIndex(i, len): 0-100 score contribution for a chosen option index */
  var QUESTIONS = [
    {
      id: 'orgSize', type: 'single', category: 'context',
      q: 'What is your organisation size?',
      options: ['1–10', '11–50', '51–200', '201–500', '501–1,000', '1,000+']
    },
    {
      id: 'industry', type: 'single', category: 'context',
      q: 'Which industry are you in?',
      options: ['Technology', 'Manufacturing', 'Healthcare', 'Financial Services', 'Education', 'Retail / E-commerce', 'Professional Services', 'Real Estate', 'Logistics', 'Media / Marketing', 'Hospitality', 'Other']
    },
    {
      id: 'goals', type: 'multi', max: 3, category: 'context',
      q: 'What is your primary goal with AI? (choose up to 3)',
      options: ['Reduce operational costs', 'Increase revenue', 'Improve customer experience', 'Automate repetitive work', 'Improve employee productivity', 'Improve decision-making', 'Build new products', 'Reduce turnaround time', 'Scale operations', 'Gain competitive advantage']
    },
    {
      id: 'adoption', type: 'single', category: 'workflow',
      q: 'How extensively is AI currently used in your organisation?',
      options: ['Not at all', 'A few employees experiment with AI', 'Several teams use AI tools', 'AI is embedded in some workflows', 'AI is integrated across multiple business functions']
    },
    {
      id: 'repetitiveTime', type: 'single', category: 'opportunity',
      q: 'Approximately how much employee time is spent on repetitive administrative work?',
      options: ['Very little', '<10%', '10–25%', '25–50%', '50%+']
    },
    {
      id: 'workAreas', type: 'multi', max: 6, category: 'context',
      q: 'Which activities consume significant manual effort? (select all that apply)',
      options: ['Data entry', 'Email processing', 'Document processing', 'Customer support', 'Lead qualification', 'Research', 'Reporting', 'Scheduling', 'Follow-ups', 'Approvals', 'Recruitment', 'Invoice processing', 'Internal queries']
    },
    {
      id: 'connectivity', type: 'scale', category: 'technology',
      q: 'How connected are your business systems?',
      scaleLabels: ['Mostly disconnected', 'Some integrations', 'Moderately connected', 'Highly integrated', 'Highly integrated & automated']
    },
    {
      id: 'dataConfidence', type: 'scale', category: 'data',
      q: 'How confident are you in the quality and accessibility of your business data?',
      scaleLabels: ['Very low', 'Low', 'Moderate', 'High', 'Very high']
    },
    {
      id: 'strategy', type: 'single', category: 'strategy',
      q: 'Does your organisation have an AI strategy?',
      options: ['No', 'Informal discussions', 'Initial strategy', 'Formal strategy', 'Active AI roadmap']
    },
    {
      id: 'governance', type: 'single', category: 'governance',
      q: 'Does your organisation have AI policies or governance?',
      options: ['No', 'Being developed', 'Basic policy', 'Formal governance framework', 'Mature governance programme']
    },
    {
      id: 'leadership', type: 'scale', category: 'organisational',
      q: 'How comfortable is leadership with AI implementation?',
      scaleLabels: ['Not comfortable', 'Limited understanding', 'Moderately comfortable', 'Strong understanding', 'AI is a strategic priority']
    },
    {
      id: 'willingness', type: 'scale', category: 'organisational',
      q: 'How willing are you to redesign existing workflows around AI?',
      scaleLabels: ['Not currently', 'Slightly', 'Open to it', 'Very open', 'Actively looking to transform workflows']
    },
    {
      id: 'blockers', type: 'multi', max: 3, category: 'context',
      q: "What's currently stopping you from implementing more AI? (choose up to 3)",
      options: ["Don't know where to start", 'Lack of internal expertise', 'Data quality', 'Integration complexity', 'Security / privacy concerns', 'Cost', 'Employee resistance', 'Unclear ROI', 'Lack of leadership alignment', "Haven't identified the right use cases"]
    }
  ];

  var CATEGORY_LABELS = {
    strategy: 'AI Strategy',
    workflow: 'Workflow Automation',
    data: 'Data Readiness',
    technology: 'Technology Readiness',
    organisational: 'Organisational Readiness',
    governance: 'AI Governance'
  };
  var CATEGORY_ORDER = ['strategy', 'workflow', 'data', 'technology', 'organisational', 'governance'];

  var FUNCTION_MAP = {
    'Data entry': 'Operations', 'Email processing': 'Customer Operations', 'Document processing': 'Document & Knowledge Work',
    'Customer support': 'Customer Operations', 'Lead qualification': 'Sales & Lead Management', 'Research': 'Sales & Lead Management',
    'Reporting': 'Operations', 'Scheduling': 'HR & Recruitment', 'Follow-ups': 'Sales & Lead Management', 'Approvals': 'Finance',
    'Recruitment': 'HR & Recruitment', 'Invoice processing': 'Finance', 'Internal queries': 'Document & Knowledge Work'
  };

  var answers = {};
  var idx = 0;

  var elIntro = doc.getElementById('quizIntro');
  var elQuestions = doc.getElementById('quizQuestions');
  var elResults = doc.getElementById('quizResults');
  var elHost = doc.getElementById('quizQuestionHost');
  var elProgress = doc.getElementById('quizProgressBar');
  var elStepLabel = doc.getElementById('quizStepLabel');
  var elBack = doc.getElementById('quizBack');
  var elNext = doc.getElementById('quizNext');

  function renderQuestion() {
    var qq = QUESTIONS[idx];
    elStepLabel.textContent = 'Question ' + (idx + 1) + ' of ' + QUESTIONS.length;
    elProgress.style.width = (((idx) / QUESTIONS.length) * 100) + '%';
    elBack.disabled = idx === 0;
    elNext.textContent = idx === QUESTIONS.length - 1 ? 'See my results' : 'Next';

    var html = '<h3 class="quiz__q">' + qq.q + '</h3><div class="quiz__opts" role="group">';

    if (qq.type === 'scale') {
      html += '<div class="quiz__scale">';
      for (var s = 0; s < qq.scaleLabels.length; s++) {
        var checkedS = answers[qq.id] === s ? ' is-active' : '';
        html += '<button type="button" class="quiz__scale-opt' + checkedS + '" data-val="' + s + '">' +
          '<span class="quiz__scale-num">' + (s + 1) + '</span><span>' + qq.scaleLabels[s] + '</span></button>';
      }
      html += '</div>';
    } else {
      var chosen = answers[qq.id] || (qq.type === 'multi' ? [] : null);
      for (var i = 0; i < qq.options.length; i++) {
        var isActive = qq.type === 'multi' ? chosen.indexOf(i) !== -1 : chosen === i;
        html += '<button type="button" class="quiz__opt' + (isActive ? ' is-active' : '') + '" data-val="' + i + '">' +
          '<span class="quiz__opt-check" aria-hidden="true"></span>' + qq.options[i] + '</button>';
      }
    }
    html += '</div>';
    elHost.innerHTML = html;

    var buttons = elHost.querySelectorAll('[data-val]');
    for (var b = 0; b < buttons.length; b++) {
      buttons[b].addEventListener('click', function () {
        var val = parseInt(this.getAttribute('data-val'), 10);
        if (qq.type === 'multi') {
          var arr = answers[qq.id] || [];
          var pos = arr.indexOf(val);
          if (pos === -1) {
            if (arr.length >= (qq.max || 99)) return;
            arr.push(val);
          } else {
            arr.splice(pos, 1);
          }
          answers[qq.id] = arr;
        } else {
          answers[qq.id] = val;
        }
        renderQuestion();
      });
    }
  }

  function canAdvance() {
    var qq = QUESTIONS[idx];
    var v = answers[qq.id];
    if (qq.type === 'multi') return v && v.length > 0;
    return v !== undefined && v !== null;
  }

  doc.getElementById('quizStart').addEventListener('click', function () {
    elIntro.hidden = true;
    elQuestions.hidden = false;
    idx = 0;
    renderQuestion();
  });

  elBack.addEventListener('click', function () {
    if (idx === 0) return;
    idx--;
    renderQuestion();
  });

  elNext.addEventListener('click', function () {
    if (!canAdvance()) {
      elHost.classList.add('quiz__host--shake');
      setTimeout(function () { elHost.classList.remove('quiz__host--shake'); }, 400);
      return;
    }
    if (idx === QUESTIONS.length - 1) {
      showResults();
      return;
    }
    idx++;
    renderQuestion();
  });

  function pct(index, len) { return Math.round((index / (len - 1)) * 100); }

  function computeScores() {
    var sums = {}, counts = {};
    CATEGORY_ORDER.forEach(function (c) { sums[c] = 0; counts[c] = 0; });

    QUESTIONS.forEach(function (qq) {
      if (qq.category === 'context' || qq.category === 'opportunity') return;
      var v = answers[qq.id];
      if (v === undefined || v === null) return;
      var len = qq.type === 'scale' ? qq.scaleLabels.length : qq.options.length;
      sums[qq.category] += pct(v, len);
      counts[qq.category]++;
    });

    var scores = {};
    CATEGORY_ORDER.forEach(function (c) {
      scores[c] = counts[c] ? Math.round(sums[c] / counts[c]) : 50;
    });

    var overall = Math.round(CATEGORY_ORDER.reduce(function (a, c) { return a + scores[c]; }, 0) / CATEGORY_ORDER.length);

    // Opportunity: high repetitive time + low connectivity + low adoption = high headroom.
    var repLen = QUESTIONS.filter(function (q) { return q.id === 'repetitiveTime'; })[0].options.length;
    var repScore = answers.repetitiveTime !== undefined ? pct(answers.repetitiveTime, repLen) : 50;
    var oppScore = Math.round((repScore + (100 - scores.technology) + (100 - scores.workflow)) / 3);

    return { scores: scores, overall: overall, oppScore: oppScore };
  }

  function opportunityAreas() {
    var counts = {};
    (answers.workAreas || []).forEach(function (i) {
      var label = QUESTIONS.filter(function (q) { return q.id === 'workAreas'; })[0].options[i];
      var fn = FUNCTION_MAP[label] || 'Operations';
      counts[fn] = (counts[fn] || 0) + 1;
    });
    var ranked = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
    if (!ranked.length) ranked = ['Customer Operations', 'Sales & Lead Management', 'Document & Knowledge Work'];
    return ranked.slice(0, 3);
  }

  function leadTier(overall) {
    var orgIdx = answers.orgSize || 0;
    var willing = answers.willingness !== undefined ? answers.willingness : 2;
    var strat = answers.strategy !== undefined ? answers.strategy : 1;
    if (orgIdx >= 3 && willing >= 3 && strat >= 1) {
      return { tier: 'high', cta: 'Talk to an AI Transformation Specialist' };
    }
    if (orgIdx >= 1 || overall >= 40) {
      return { tier: 'mid', cta: 'Get Your AI Opportunity Roadmap' };
    }
    return { tier: 'early', cta: 'Start With an AI Readiness Workshop' };
  }

  var lastResult = null;

  function showResults() {
    elQuestions.hidden = true;
    elResults.hidden = false;

    var r = computeScores();
    var profile, desc;
    if (r.overall >= 71) { profile = 'AI-Advanced — Ready to Scale'; desc = 'You have real AI adoption and organisational alignment. The opportunity now is expanding what already works into more of the business, with governance to match.'; }
    else if (r.overall >= 41) { profile = 'AI-Ready, But Under-Implemented'; desc = 'You have the technology foundation and organisational willingness to adopt AI, but significant value is still trapped in manual workflows.'; }
    else { profile = 'Early Stage — Ready to Start'; desc = 'AI adoption is early. That means the biggest, easiest wins are still in front of you — the right first use case matters more than doing everything at once.'; }

    doc.getElementById('resultOverall').textContent = r.overall;
    doc.getElementById('resultLabel').textContent = profile;
    doc.getElementById('resultDesc').textContent = desc;

    var scHtml = '';
    CATEGORY_ORDER.forEach(function (c) {
      scHtml += '<div class="scorecard__row"><div class="scorecard__top"><span>' + CATEGORY_LABELS[c] + '</span><b>' + r.scores[c] + '%</b></div>' +
        '<div class="scorecard__track"><span class="scorecard__fill" style="--w:' + r.scores[c] + '%"></span></div></div>';
    });
    doc.getElementById('resultScorecard').innerHTML = scHtml;
    requestAnimationFrame(function () { doc.getElementById('resultScorecard').classList.add('in'); });

    var oppLabel = r.oppScore >= 66 ? 'High' : (r.oppScore >= 33 ? 'Medium' : 'Emerging');
    doc.getElementById('resultOppLevel').textContent = oppLabel;
    doc.getElementById('resultOppText').textContent = 'Your organisation appears to have ' + (r.oppScore >= 50 ? 'significant' : 'some') + ' repetitive work, room to connect systems, and workflows involving manual handoffs — strong candidates for AI-assisted automation.';
    var areas = opportunityAreas();
    doc.getElementById('resultOppList').innerHTML = areas.map(function (a) { return '<li>' + a + '</li>'; }).join('');

    var lt = leadTier(r.overall);
    doc.getElementById('quizShowLeadForm').textContent = lt.cta;

    lastResult = { r: r, profile: profile, areas: areas, tier: lt.tier };
  }

  doc.getElementById('quizShowLeadForm').addEventListener('click', function () {
    this.parentElement.hidden = true;
    doc.getElementById('quizLeadForm').hidden = false;
  });

  var leadForm = doc.getElementById('quizLeadForm');
  leadForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!leadForm.checkValidity()) { leadForm.reportValidity(); return; }

    var val = function (id) { var el = doc.getElementById(id); return el ? el.value.trim() : ''; };
    var lead = {
      name: val('qf-name'), email: val('qf-email'), company: val('qf-company'),
      role: val('qf-role'), phone: val('qf-phone'), website: val('qf-website'),
      overallScore: lastResult ? lastResult.r.overall : null,
      profile: lastResult ? lastResult.profile : null,
      opportunityAreas: lastResult ? lastResult.areas : null,
      leadTier: lastResult ? lastResult.tier : null,
      scorecard: lastResult ? lastResult.r.scores : null,
      answers: answers
    };

    try { if (window.AdtomateSaveAssessment) { window.AdtomateSaveAssessment(lead).catch(function () {}); } } catch (err) {}

    var lines = [
      'Hi Adtomate, I just completed the AI Transformation Assessment.', '',
      'Name: ' + lead.name, 'Company: ' + lead.company, 'Role: ' + (lead.role || '—'),
      'Email: ' + lead.email, 'Phone: ' + (lead.phone || '—'),
      'Overall readiness: ' + lead.overallScore + '/100 (' + lead.profile + ')',
      'Top opportunity areas: ' + (lead.opportunityAreas || []).join(', ')
    ];
    var wa = 'https://wa.me/919667796730?text=' + encodeURIComponent(lines.join('\n'));

    doc.getElementById('quizSuccessWa').setAttribute('href', wa);
    doc.getElementById('quizSuccessTitle').textContent = 'Thanks, ' + (lead.name.split(' ')[0] || '') + ' — you\'re in.';
    leadForm.hidden = true;
    doc.getElementById('quizSuccess').hidden = false;
  });
})();
