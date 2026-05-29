const SUPABASE_URL = 'https://xwqwjilsaopmfrhnmjai.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_CnnNRwyEkOvE321po-hzDQ_gJjIZu3O';

const hasSupabase = SUPABASE_URL.indexOf('http') === 0 && SUPABASE_ANON_KEY.length > 30;
const sb = hasSupabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const state = { side: 'b', answers: {}, lang: 'en', userLang: 'en' };
const STEPS = { b: 7, v: 6 };
const FINAL_FORM = { b: 6, v: 5 };
const SUCCESS = { b: 7, v: 6 };

const URL_PARAMS = (() => {
  const p = new URLSearchParams(location.search), o = {};
  for (const [k, v] of p) o[k] = v;
  return o;
})();

const ENTRY = document.body.dataset.entry || ''; // 'brand-kr' | 'venue-en' | ''
const IS_ENTRY_PAGE = ENTRY !== '';

const $ = id => document.getElementById(id);

// ---------- i18n ----------
const i18n = {
  en: {
    saving: 'Saving…',
    linkCopied: 'Link copied ✓',
    err_brand: 'Please enter your brand name.',
    err_venue: 'Please enter your stage name.',
    err_name: 'Please enter your name and role.',
    err_email: 'Please enter a valid work email.'
  },
  kr: {
    saving: '저장 중…',
    linkCopied: '링크 복사됨 ✓',
    err_brand: '브랜드명을 입력해주세요.',
    err_venue: '스테이지명을 입력해주세요.',
    err_name: '이름과 직책을 입력해주세요.',
    err_email: '유효한 업무 이메일을 입력해주세요.'
  }
};

function t(key) { return (i18n[state.lang] || i18n.en)[key]; }

function setLang(lang, persist) {
  if (persist === undefined) persist = true;
  if (lang !== 'en' && lang !== 'kr') lang = 'en';
  if (persist) state.userLang = lang;
  state.lang = lang;
  document.documentElement.lang = lang === 'kr' ? 'ko' : 'en';
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
  document.querySelectorAll('[data-kr]').forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.innerHTML;
    el.innerHTML = lang === 'kr' ? el.dataset.kr : el.dataset.en;
  });
  document.querySelectorAll('[data-kr-placeholder]').forEach(el => {
    if (!el.dataset.enPlaceholder) el.dataset.enPlaceholder = el.placeholder || '';
    el.placeholder = lang === 'kr' ? el.dataset.krPlaceholder : el.dataset.enPlaceholder;
  });
  if (persist) { try { localStorage.setItem('altr_lang', lang); } catch (e) {} }
  if (typeof renderGoldenMatches === 'function' && $('b5') && $('b5').classList.contains('on')) renderGoldenMatches();
  else if (typeof updateGoldenButton === 'function') updateGoldenButton();
}

function applyLangForSide() {
  // Lang toggle hidden on entry pages (one-side, one-lang) and on venue root
  const toggle = document.querySelector('.lang-toggle');
  if (IS_ENTRY_PAGE) {
    if (toggle) toggle.style.display = 'none';
    return;
  }
  if (state.side === 'v') {
    if (toggle) toggle.style.display = 'none';
    if (state.lang !== 'en') setLang('en', false);
  } else {
    if (toggle) toggle.style.display = '';
    if (state.lang !== state.userLang) setLang(state.userLang, false);
  }
}

function goHome() {
  if (IS_ENTRY_PAGE) {
    // Logo on entry pages → root chooser
    location.href = '/';
    return;
  }
  state.side = 'b';
  state.answers = {};
  document.body.classList.add('is-hook');
  document.querySelectorAll('.side-btn').forEach(b => b.classList.toggle('on', b.dataset.side === 'b'));
  document.querySelectorAll('.screen').forEach(sc => sc.classList.remove('on'));
  $('intro').classList.add('on');
  document.querySelectorAll('.opt-btn.sel').forEach(b => b.classList.remove('sel'));
  document.querySelectorAll('[id$="-next"]').forEach(b => {
    if (b.id !== 'b-submit' && b.id !== 'v-submit' && b.id !== 'b5-next') b.setAttribute('disabled', '');
  });
  document.querySelectorAll('.inp').forEach(i => i.value = '');
  const b5c = $('b5-curated'); if (b5c) b5c.innerHTML = '';
  const b5r = $('b5-recap'); if (b5r) b5r.innerHTML = '';
  resetB1Subs();
  applyLangForSide();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function startSide(s, pushHist, startStep) {
  document.body.classList.remove('is-hook');
  state.side = s;
  state.answers = {};
  document.querySelectorAll('.side-btn').forEach(b => b.classList.toggle('on', b.dataset.side === s));
  document.querySelectorAll('.screen').forEach(sc => sc.classList.remove('on'));
  const initial = startStep || 0;
  const target = $(s + initial);
  if (target) target.classList.add('on');
  else $(s + '0').classList.add('on');
  document.querySelectorAll('.opt-btn.sel').forEach(b => b.classList.remove('sel'));
  resetB1Subs();
  renderProgress(s, initial);
  applyLangForSide();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (pushHist !== false && !IS_ENTRY_PAGE) {
    try { history.pushState({inFlow: true, side: s}, '', '?side=' + (s === 'b' ? 'brand' : 'venue')); } catch (e) {}
  }
}

window.addEventListener('popstate', function() {
  if (IS_ENTRY_PAGE) {
    // Entry pages: let browser-back behave normally (go to whatever they came from)
    return;
  }
  if (!document.body.classList.contains('is-hook')) {
    state.side = 'b';
    state.answers = {};
    document.body.classList.add('is-hook');
    document.querySelectorAll('.screen').forEach(sc => sc.classList.remove('on'));
    $('intro').classList.add('on');
    document.querySelectorAll('.opt-btn.sel').forEach(b => b.classList.remove('sel'));
    document.querySelectorAll('.inp').forEach(i => i.value = '');
    const b5c = $('b5-curated'); if (b5c) b5c.innerHTML = '';
    const b5r = $('b5-recap'); if (b5r) b5r.innerHTML = '';
    resetB1Subs();
    applyLangForSide();
    window.scrollTo({ top: 0 });
    try { history.pushState({hookAnchor: true}, '', location.pathname + location.search); } catch (e) {}
  } else {
    try { history.pushState({hookAnchor: true}, '', location.pathname + location.search); } catch (e) {}
  }
});

function setSide(s) {
  if (state.side === s) return;
  state.side = s;
  state.answers = {};
  document.querySelectorAll('.side-btn').forEach(b => b.classList.toggle('on', b.dataset.side === s));
  document.querySelectorAll('.screen').forEach(sc => sc.classList.remove('on'));
  $(s + '0').classList.add('on');
  document.querySelectorAll('.opt-btn.sel').forEach(b => b.classList.remove('sel'));
  document.querySelectorAll('[id$="-next"]').forEach(b => {
    if (b.id !== s + '0-next' && b.id !== s + '-submit') b.setAttribute('disabled', '');
  });
  const firstNext = $(s + '0-next');
  if (firstNext) firstNext.setAttribute('disabled', '');
  resetB1Subs();
  renderProgress(s, 0);
  applyLangForSide();
}

function renderProgress(s, step) {
  const total = STEPS[s], bar = $('progress');
  if (!bar) return;
  bar.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const d = document.createElement('div');
    d.className = 'pip' + (i <= step ? ' done' : '');
    bar.appendChild(d);
  }
}

function pick(el, sid) {
  el.closest('.opts').querySelectorAll('.opt-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  const title = el.querySelector('.opt-title');
  const val = (title ? title.textContent : el.textContent).trim();
  state.answers[sid] = val;

  if (sid === 'b1') {
    const sub = $('b1-sub'), sub2 = $('b1-sub2');
    const isFB = val.startsWith('F&B');
    if (sub) {
      if (isFB) {
        sub.hidden = false;
      } else {
        sub.hidden = true;
        delete state.answers.b1_sub;
        delete state.answers.b1_sub2;
        sub.querySelectorAll('.opt-btn.sel').forEach(b => b.classList.remove('sel'));
        if (sub2) sub2.hidden = true;
      }
    }
    updateB1Next();
    return;
  }

  const nb = $(sid + '-next');
  if (nb) nb.removeAttribute('disabled');
}

function pickSub(el, key) {
  const wrap = el.closest('.sub-opts');
  wrap.querySelectorAll(':scope > .opt-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  const title = el.querySelector('.opt-title');
  state.answers[key] = (title ? title.textContent : el.textContent).trim();

  if (key === 'b1_sub') {
    const sub2 = $('b1-sub2');
    const subVal = state.answers.b1_sub || '';
    const isRestaurant = subVal.startsWith('Restaurant') || subVal.startsWith('레스토랑');
    if (sub2) {
      if (isRestaurant) {
        sub2.hidden = false;
      } else {
        sub2.hidden = true;
        delete state.answers.b1_sub2;
        sub2.querySelectorAll('.opt-btn.sel').forEach(b => b.classList.remove('sel'));
      }
    }
  }
  updateB1Next();
}

function updateB1Next() {
  const nb = $('b1-next');
  if (!nb) return;
  const b1 = state.answers.b1 || '';
  if (!b1) { nb.setAttribute('disabled', ''); return; }
  if (!b1.startsWith('F&B')) { nb.removeAttribute('disabled'); return; }
  const sub = state.answers.b1_sub || '';
  if (!sub) { nb.setAttribute('disabled', ''); return; }
  const isRestaurant = sub.startsWith('Restaurant') || sub.startsWith('레스토랑');
  if (!isRestaurant) { nb.removeAttribute('disabled'); return; }
  if (!state.answers.b1_sub2) { nb.setAttribute('disabled', ''); return; }
  nb.removeAttribute('disabled');
}

function resetB1Subs() {
  const sub = $('b1-sub'), sub2 = $('b1-sub2');
  if (sub) { sub.hidden = true; sub.querySelectorAll('.opt-btn.sel').forEach(b => b.classList.remove('sel')); }
  if (sub2) { sub2.hidden = true; sub2.querySelectorAll('.opt-btn.sel').forEach(b => b.classList.remove('sel')); }
}

function next(s, step) {
  $(s + (step - 1)).classList.remove('on');
  $(s + step).classList.add('on');
  if (step < SUCCESS[s]) renderProgress(s, step);
  else renderProgress(s, STEPS[s] - 1);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (s === 'b' && step === 5) renderGoldenMatches();
}

function back(s, step) {
  $(s + (step + 1)).classList.remove('on');
  $(s + step).classList.add('on');
  renderProgress(s, step);
  if (s === 'b' && step === 5) renderGoldenMatches();
}

// ---------- Golden Match curation (b5) ----------
const GOLDEN_MATCHES = {
  'UAE / Saudi Arabia / GCC': {
    'F&B — restaurant, food product, beverage': [
      { en: "Gulfood (Dubai) — world's largest food expo", kr: "걸푸드 (두바이) — 세계 최대 식품 박람회" },
      { en: "Saudi Food Show (Riyadh) — fast-growing F&B market", kr: "사우디 푸드쇼 (리야드) — 빠르게 성장하는 F&B 시장" },
      { en: "SIAL Middle East (Abu Dhabi)", kr: "SIAL 미들이스트 (아부다비)" }
    ],
    'Beauty / skincare': [
      { en: "Beautyworld Middle East (Dubai) — 70K audience, beauty/wellness", kr: "뷰티월드 미들이스트 (두바이) — 7만 오디언스" },
      { en: "Professional Beauty GCC (Dubai) — expanding 2× in 2026", kr: "프로페셔널 뷰티 GCC (두바이) — 2026년 2배 확장" },
      { en: "Sephora flagship activations (Dubai/Riyadh)", kr: "세포라 플래그십 액티베이션 (두바이/리야드)" }
    ],
    'Health & wellness': [
      { en: "Arab Health (Dubai) — largest healthcare event", kr: "아랍 헬스 (두바이) — 최대 헬스케어 이벤트" },
      { en: "Dubai Active Sports & Fitness Expo", kr: "두바이 액티브 스포츠 & 피트니스 엑스포" },
      { en: "Aesthetic & Anti-Aging Middle East", kr: "에스테틱 & 안티에이징 미들이스트" }
    ],
    'Fashion / streetwear / lifestyle': [
      { en: "Arab Fashion Week (Dubai)", kr: "아랍 패션위크 (두바이)" },
      { en: "Dubai Design Week", kr: "두바이 디자인위크" },
      { en: "Riyadh Fashion Week", kr: "리야드 패션위크" }
    ],
    'Entertainment / media / gaming IP': [
      { en: "GITEX (Dubai) — 5K+ exhibitors", kr: "GITEX (두바이) — 5천+ 출품사" },
      { en: "Saudi Esports & Gaming (Riyadh)", kr: "사우디 e스포츠 & 게이밍 (리야드)" },
      { en: "MENA Comic Con (Dubai)", kr: "MENA 코믹콘 (두바이)" }
    ]
  },
  'Japan': {
    'F&B — restaurant, food product, beverage': [
      { en: "FOODEX Japan (Chiba) — Asia's largest food expo", kr: "FOODEX 재팬 (치바) — 아시아 최대 식품 박람회" },
      { en: "Wine & Gourmet Japan (Tokyo)", kr: "와인 & 고메 재팬 (도쿄)" },
      { en: "Cafe Show Japan (Tokyo)", kr: "카페쇼 재팬 (도쿄)" }
    ],
    'Beauty / skincare': [
      { en: "COSME Tokyo — Japan's largest beauty expo", kr: "코스메 도쿄 — 일본 최대 뷰티 박람회" },
      { en: "Beautyworld Japan (Tokyo)", kr: "뷰티월드 재팬 (도쿄)" },
      { en: "Isetan Shinjuku — flagship beauty floor activations", kr: "이세탄 신주쿠 — 플래그십 뷰티 액티베이션" }
    ],
    'Health & wellness': [
      { en: "Diet & Beauty Fair (Tokyo)", kr: "다이어트 & 뷰티 페어 (도쿄)" },
      { en: "Wellness Tokyo", kr: "웰니스 도쿄" }
    ],
    'Fashion / streetwear / lifestyle': [
      { en: "Rakuten Fashion Week Tokyo", kr: "라쿠텐 패션위크 도쿄" },
      { en: "Isetan Shinjuku — flagship retail moments", kr: "이세탄 신주쿠 — 플래그십 리테일 모먼트" },
      { en: "Roppongi Hills seasonal activations", kr: "롯폰기 힐스 시즌 액티베이션" }
    ],
    'Entertainment / media / gaming IP': [
      { en: "Tokyo Game Show (Makuhari)", kr: "도쿄 게임쇼 (마쿠하리)" },
      { en: "Comiket (Tokyo)", kr: "코미케 (도쿄)" },
      { en: "Anime Japan (Tokyo)", kr: "애니메 재팬 (도쿄)" }
    ]
  },
  'Southeast Asia (SG, TH, MY, ID)': {
    'F&B — restaurant, food product, beverage': [
      { en: "FHA-Food & Beverage (Singapore)", kr: "FHA-식음료 (싱가포르)" },
      { en: "THAIFEX-Anuga Asia (Bangkok)", kr: "THAIFEX-아누가 아시아 (방콕)" },
      { en: "Salon du Chocolat (Singapore)", kr: "살롱 뒤 쇼콜라 (싱가포르)" }
    ],
    'Beauty / skincare': [
      { en: "Beauty World KL (Kuala Lumpur)", kr: "뷰티월드 KL (쿠알라룸푸르)" },
      { en: "Cosmobeauté Indonesia (Jakarta)", kr: "코스모뷰티 인도네시아 (자카르타)" },
      { en: "In-Cosmetics Asia (Bangkok)", kr: "인코스메틱스 아시아 (방콕)" }
    ],
    'Health & wellness': [
      { en: "Asia Health (Singapore)", kr: "아시아 헬스 (싱가포르)" },
      { en: "Vitafoods Asia (Bangkok)", kr: "비타푸드 아시아 (방콕)" }
    ],
    'Fashion / streetwear / lifestyle': [
      { en: "Singapore Fashion Week", kr: "싱가포르 패션위크" },
      { en: "Kuala Lumpur Fashion Week (KLFW)", kr: "쿠알라룸푸르 패션위크 (KLFW)" },
      { en: "Bangkok International Fashion Week", kr: "방콕 인터내셔널 패션위크" }
    ],
    'Entertainment / media / gaming IP': [
      { en: "ComicCon Asia (Singapore)", kr: "코믹콘 아시아 (싱가포르)" },
      { en: "GameStart Asia (Singapore)", kr: "게임스타트 아시아 (싱가포르)" }
    ]
  },
  'Europe': {
    'F&B — restaurant, food product, beverage': [
      { en: "SIAL Paris — Europe's largest F&B trade show", kr: "SIAL 파리 — 유럽 최대 F&B 트레이드쇼" },
      { en: "Anuga (Cologne)", kr: "아누가 (쾰른)" },
      { en: "London Coffee Festival", kr: "런던 커피 페스티벌" }
    ],
    'Beauty / skincare': [
      { en: "Cosmoprof Bologna — global beauty marketplace", kr: "코스모프로프 볼로냐 — 글로벌 뷰티 마켓플레이스" },
      { en: "Beauty Düsseldorf", kr: "뷰티 뒤셀도르프" },
      { en: "In-Cosmetics Global", kr: "인코스메틱스 글로벌" }
    ],
    'Health & wellness': [
      { en: "Vitafoods Europe (Geneva)", kr: "비타푸드 유럽 (제네바)" },
      { en: "Olympia Beauty (London)", kr: "올림피아 뷰티 (런던)" }
    ],
    'Fashion / streetwear / lifestyle': [
      { en: "Paris Fashion Week", kr: "파리 패션위크" },
      { en: "London Fashion Week", kr: "런던 패션위크" },
      { en: "Milan Fashion Week", kr: "밀라노 패션위크" }
    ],
    'Entertainment / media / gaming IP': [
      { en: "Gamescom (Cologne) — world's largest games event", kr: "게임스컴 (쾰른) — 세계 최대 게임 이벤트" },
      { en: "EGX (London)", kr: "EGX (런던)" },
      { en: "Reeperbahn Festival (Hamburg)", kr: "리퍼반 페스티벌 (함부르크)" }
    ]
  },
  'US': {
    'F&B — restaurant, food product, beverage': [
      { en: "Summer Fancy Food Show (NYC)", kr: "서머 팬시 푸드쇼 (NYC)" },
      { en: "Natural Products Expo West (Anaheim)", kr: "내추럴 프로덕츠 엑스포 웨스트 (애너하임)" },
      { en: "Specialty Coffee Expo", kr: "스페셜티 커피 엑스포" }
    ],
    'Beauty / skincare': [
      { en: "Cosmoprof North America (Las Vegas)", kr: "코스모프로프 노스아메리카 (라스베가스)" },
      { en: "Sephoria — Sephora's beauty experience", kr: "세포리아 — 세포라의 뷰티 경험" },
      { en: "Beautycon (LA)", kr: "뷰티콘 (LA)" }
    ],
    'Health & wellness': [
      { en: "Natural Products Expo West (Anaheim)", kr: "내추럴 프로덕츠 엑스포 웨스트 (애너하임)" },
      { en: "Wellness World Expo (NYC)", kr: "웰니스 월드 엑스포 (NYC)" }
    ],
    'Fashion / streetwear / lifestyle': [
      { en: "New York Fashion Week (NYFW)", kr: "뉴욕 패션위크 (NYFW)" },
      { en: "ComplexCon (LA)", kr: "컴플렉스콘 (LA)" },
      { en: "Coachella-adjacent activations (LA)", kr: "코첼라 인접 액티베이션 (LA)" }
    ],
    'Entertainment / media / gaming IP': [
      { en: "SXSW (Austin)", kr: "SXSW (오스틴)" },
      { en: "San Diego Comic-Con", kr: "샌디에이고 코믹콘" },
      { en: "Summer Game Fest (LA)", kr: "서머 게임 페스트 (LA)" }
    ]
  },
  'Open to recommendations': {
    'F&B — restaurant, food product, beverage': [
      { en: "Gulfood (Dubai)", kr: "걸푸드 (두바이)" },
      { en: "FOODEX Japan", kr: "FOODEX 재팬" },
      { en: "SIAL Paris", kr: "SIAL 파리" }
    ],
    'Beauty / skincare': [
      { en: "Cosmoprof Bologna", kr: "코스모프로프 볼로냐" },
      { en: "Beautyworld Middle East (Dubai)", kr: "뷰티월드 미들이스트 (두바이)" },
      { en: "COSME Tokyo", kr: "코스메 도쿄" }
    ],
    'Health & wellness': [
      { en: "Vitafoods Europe", kr: "비타푸드 유럽" },
      { en: "Natural Products Expo West (US)", kr: "내추럴 프로덕츠 엑스포 웨스트 (미국)" }
    ],
    'Fashion / streetwear / lifestyle': [
      { en: "Paris Fashion Week", kr: "파리 패션위크" },
      { en: "Rakuten Fashion Week Tokyo", kr: "라쿠텐 패션위크 도쿄" }
    ],
    'Entertainment / media / gaming IP': [
      { en: "Gamescom (Cologne)", kr: "게임스컴 (쾰른)" },
      { en: "Tokyo Game Show", kr: "도쿄 게임쇼" },
      { en: "SXSW (Austin)", kr: "SXSW (오스틴)" }
    ]
  }
};

const MARKET_SHORT = {
  'UAE / Saudi Arabia / GCC': 'GCC',
  'Japan': 'Japan',
  'Southeast Asia (SG, TH, MY, ID)': 'SEA',
  'Europe': 'Europe',
  'US': 'US',
  'Open to recommendations': 'open'
};

const VERTICAL_SHORT = {
  'F&B — restaurant, food product, beverage': 'F&B',
  'Beauty / skincare': 'Beauty',
  'Health & wellness': 'Health & wellness',
  'Fashion / streetwear / lifestyle': 'Fashion',
  'Entertainment / media / gaming IP': 'Entertainment'
};

const MATCH_HINTS = ['Top pick', 'Best fit', 'Strong match'];
const MATCH_HINTS_KR = ['1순위', '베스트 핏', '강력 추천'];

function renderGoldenMatches() {
  const market = state.answers.b2 || '';
  const vertical = state.answers.b1 || '';
  const recap = $('b5-recap');
  const container = $('b5-curated');
  const input = $('b-golden');
  if (!container || !recap) return;

  if (market && vertical) {
    const m = MARKET_SHORT[market] || market;
    const v = VERTICAL_SHORT[vertical] || vertical;
    recap.innerHTML = state.lang === 'kr'
      ? `<b>${m}</b> × <b>${v}</b> 기준으로 추측했어요. 맞으면 탭, 아니면 아래에 직접 입력.`
      : `Inferred from <b>${m}</b> × <b>${v}</b>. Tap to confirm, or type something else below.`;
  } else {
    recap.innerHTML = '';
  }

  container.innerHTML = '';
  const matches = (GOLDEN_MATCHES[market] || {})[vertical] || [];
  matches.forEach((m, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'opt-btn';
    btn.dataset.value = m.en;
    btn.dataset.kr = m.kr;
    const hintEn = MATCH_HINTS[i] || 'Match';
    const hintKr = MATCH_HINTS_KR[i] || '매치';
    btn.dataset.hintEn = hintEn;
    btn.dataset.hintKr = hintKr;
    const title = state.lang === 'kr' ? m.kr : m.en;
    const hint = state.lang === 'kr' ? hintKr : hintEn;
    btn.innerHTML = `<div class="opt-title">${title}</div><span class="match-hint">${hint}</span>`;
    btn.onclick = () => pickGolden(btn);
    container.appendChild(btn);
  });

  const prev = state.answers.b5 || '';
  if (prev && prev !== '_SKIP_') {
    let matched = false;
    container.querySelectorAll('.opt-btn').forEach(b => {
      if (b.dataset.value === prev) { b.classList.add('sel'); matched = true; }
    });
    if (!matched && input) input.value = prev;
  } else if (input) {
    input.value = '';
  }

  updateGoldenButton();
}

function pickGolden(el) {
  document.querySelectorAll('#b5-curated .opt-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  state.answers.b5 = el.dataset.value;
  const input = $('b-golden');
  if (input) input.value = '';
  updateGoldenButton();
}

function onGoldenInput() {
  const v = $('b-golden').value.trim();
  document.querySelectorAll('#b5-curated .opt-btn.sel').forEach(b => b.classList.remove('sel'));
  state.answers.b5 = v;
  updateGoldenButton();
}

function updateGoldenButton() {
  const btn = $('b5-next');
  if (!btn) return;
  const v = (state.answers.b5 || '').trim();
  const hasValue = v && v !== '_SKIP_';
  if (hasValue) {
    btn.textContent = state.lang === 'kr' ? '맞아요 →' : 'Yes, this →';
  } else {
    btn.textContent = state.lang === 'kr' ? '아무거나 베스트 핏으로 매칭 →' : 'Surprise me — best fit →';
  }
}

function advanceGolden() {
  const input = $('b-golden');
  const v = input ? input.value.trim() : '';
  if (v) state.answers.b5 = v;
  if (!state.answers.b5) state.answers.b5 = '_SKIP_';
  next('b', 6);
}

async function submit(s) {
  const screen = $(s + FINAL_FORM[s]);
  const orgEl = screen.querySelector('input[name="org"]');
  const nameEl = screen.querySelector('input[name="name"]');
  const emailEl = screen.querySelector('input[name="email"]');
  const errEl = $(s + '-err');
  const btn = $(s + '-submit');

  [orgEl, nameEl, emailEl].forEach(el => el.classList.remove('err'));
  errEl.hidden = true;

  const org = orgEl.value.trim();
  const name = nameEl.value.trim();
  const email = emailEl.value.trim();

  const showErr = (msg, el) => {
    errEl.textContent = msg;
    errEl.hidden = false;
    if (el) { el.classList.add('err'); el.focus(); }
  };

  if (s === 'v' && !state.answers.v_slots) {
    return showErr('Please pick how many activation slots you have.', null);
  }
  if (!org) return showErr(s === 'b' ? t('err_brand') : t('err_venue'), orgEl);
  if (!name) return showErr(t('err_name'), nameEl);
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return showErr(t('err_email'), emailEl);

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = t('saving');

  const payload = {
    mode: s === 'b' ? 'brand' : 'venue',
    org_name: org,
    contact_name: name,
    email,
    answers: { ...state.answers },
    utm: { ...URL_PARAMS, entry: ENTRY || null, path: location.pathname },
    user_agent: navigator.userAgent.slice(0, 240),
    referrer: document.referrer || null,
    submitted_at: new Date().toISOString()
  };

  let saved = false;
  if (sb) {
    try {
      const { error } = await sb.from('gtm_waitlist').insert(payload);
      if (!error) saved = true;
      else console.warn('supabase insert error', error);
    } catch (e) {
      console.warn('supabase exception', e);
    }
  }

  if (!saved) {
    const subj = `altr waitlist — ${payload.mode} — ${org}`;
    const body = `New ${payload.mode} signup\n\n` +
      `Org: ${org}\nContact: ${name}\nEmail: ${email}\n\n` +
      `Answers:\n${Object.entries(state.answers).map(([k, v]) => `  ${k}: ${v}`).join('\n')}\n\n` +
      `UTM: ${JSON.stringify(payload.utm)}\n` +
      `Referrer: ${payload.referrer || '(none)'}\n` +
      `Submitted: ${payload.submitted_at}`;
    const mailto = `mailto:hello@altr.haus?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
    const w = window.open(mailto, '_blank');
    if (!w) location.href = mailto;
  }

  btn.disabled = false;
  btn.textContent = originalText;
  next(s, SUCCESS[s]);
}

function copyShare(btn) {
  const url = location.origin + location.pathname;
  const done = () => {
    btn.classList.add('copied');
    const original = btn.textContent;
    btn.textContent = t('linkCopied');
    setTimeout(() => { btn.classList.remove('copied'); btn.textContent = original; }, 2400);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(done).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    });
  }
}

// ---------- Init ----------
(function init() {
  // Entry pages force lang + side from body data-entry, skip hook
  if (IS_ENTRY_PAGE) {
    const [sideName, langName] = ENTRY.split('-');
    const side = sideName === 'brand' ? 'b' : 'v';
    setLang(langName === 'kr' ? 'kr' : 'en', false);
    document.body.classList.remove('is-hook');
    document.body.classList.add('is-entry');

    // Ad source segmentation — annotates body + decides starting step
    const src = (URL_PARAMS.src || '').toLowerCase();
    if (src) document.body.classList.add('is-src-' + src);

    // LinkedIn venue traffic already knows they're a venue → skip Property type
    const startStep = (side === 'v' && src === 'linkedin') ? 1 : 0;
    startSide(side, false, startStep);
    return;
  }

  // Root: language preference resolution
  let lang = (URL_PARAMS.lang || '').toLowerCase();
  if (lang !== 'en' && lang !== 'kr' && lang !== 'ko') {
    try { lang = localStorage.getItem('altr_lang') || ''; } catch (e) {}
  }
  if (lang !== 'en' && lang !== 'kr' && lang !== 'ko') {
    const nav = (navigator.language || 'en').toLowerCase();
    lang = nav.startsWith('ko') ? 'kr' : 'en';
  }
  if (lang === 'ko') lang = 'kr';
  setLang(lang);

  const wantSide = URL_PARAMS.side;
  if (wantSide === 'venue' || wantSide === 'v') {
    document.body.classList.remove('is-hook');
    startSide('v', false);
  } else if (wantSide === 'brand' || wantSide === 'b') {
    document.body.classList.remove('is-hook');
    startSide('b', false);
  } else {
    document.body.classList.add('is-hook');
    applyLangForSide();
  }
  try { history.pushState({hookAnchor: true}, '', location.pathname + location.search); } catch (e) {}
})();
