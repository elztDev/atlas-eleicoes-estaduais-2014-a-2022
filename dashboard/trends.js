(() => {
  'use strict';

  const YEARS = [2014, 2018, 2022];
  const TRANSITIONS = [[2014, 2018], [2018, 2022]];

  const PARTY_COLORS = {
    PT:'#c93038', PMDB:'#2b8b75', MDB:'#2b8b75', PSDB:'#2778ba', PL:'#2851a3', PSD:'#f39b27', PP:'#166cc1',
    PDT:'#e65a35', PSB:'#df6f2d', DEM:'#2d76b8', UNIAO:'#36a7a0', 'UNIÃO':'#36a7a0', PSL:'#2959a3', PSC:'#2d6f94',
    REP:'#2d70a6', REPUBLICANOS:'#2d70a6', PRB:'#2d70a6', PSOL:'#cf5b30', PODE:'#7057a5', PV:'#54a548', NOVO:'#ef7f24',
    SDD:'#e27838', SOLIDARIEDADE:'#e27838', AVANTE:'#8d4ba7', REDE:'#63a848', PCdoB:'#a8333e', PCDOB:'#a8333e',
    CIDADANIA:'#e05c97', PPS:'#e05c97', PR:'#315d91', PROS:'#ef8c22', PTB:'#31518b', PHS:'#7565a2', PRTB:'#27415f'
  };
  const FALLBACK_COLORS = ['#47798b','#7868a6','#bd6a56','#2f8d78','#8d6b43','#536d9b','#8a5577','#547f4a','#935f42'];

  const BUCKET_ORDER = ['extrema esquerda','esquerda','centro-esquerda','centro','centro-direita','direita','extrema direita','não classificada'];
  const BUCKET_LABELS = {
    'extrema esquerda':'Extrema esquerda', 'esquerda':'Esquerda', 'centro-esquerda':'Centro-esquerda', 'centro':'Centro',
    'centro-direita':'Centro-direita', 'direita':'Direita', 'extrema direita':'Extrema direita', 'não classificada':'Não classificada'
  };

  const byUF = Object.fromEntries(ATLAS_DATA.map(d => [d.uf, d]));

  function accentless(v='') { return String(v).trim().toLocaleUpperCase('pt-BR').normalize('NFD').replace(/[̀-ͯ]/g,''); }

  function canon(value='') {
    const up = accentless(value);
    const aliases = { 'UNIAO':'UNIAO','UNIAO BRASIL':'UNIAO','REPUBLICANOS':'REP','SOLIDARIEDADE':'SDD','PC DO B':'PCDOB','PCDOB':'PCDOB','CIDADANIA':'CDD','PROGRESSISTAS':'PP' };
    return aliases[up] || up;
  }

  const ALIAS_LOOKUP = Object.fromEntries(Object.entries(PARTY_ALIASES).map(([k, v]) => [accentless(k), v]));
  function partyCode(raw) { const key = accentless(raw); return ALIAS_LOOKUP[key] || key; }
  function mergedCode(raw) { const c = canon(raw); return c === 'PMDB' ? 'MDB' : c; }

  function colorFor(label='') {
    const text = String(label);
    const candidates = Object.keys(PARTY_COLORS).filter(k => new RegExp(`(^|[^A-Z])${k}([^A-Z]|$)`).test(canon(text)));
    if (candidates.length) return PARTY_COLORS[candidates[0]];
    let hash = 0; for (const ch of text) hash = ((hash << 5) - hash) + ch.charCodeAt(0);
    return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
  }

  function escapeHtml(v='') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function formatScore(n) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }

  function scoreBucket(score) {
    if (score <= 1.50) return 'extrema esquerda';
    if (score <= 3) return 'esquerda';
    if (score <= 4.49) return 'centro-esquerda';
    if (score <= 5.50) return 'centro';
    if (score <= 7) return 'centro-direita';
    if (score <= 8.50) return 'direita';
    return 'extrema direita';
  }

  function ideologyScore(partido, year) {
    if (year === 2014) return null;
    const code = partyCode(partido);
    return PARTY_IDEOLOGY_SCORES[year]?.[code] ?? null;
  }

  function bucketForYear(partido, year) {
    if (year === 2014) {
      const code = partyCode(partido);
      const entry = Object.entries(PARTY_IDEOLOGY_2014).find(([, list]) => list.includes(code));
      return entry ? entry[0] : 'não classificada';
    }
    const score = ideologyScore(partido, year);
    return score == null ? 'não classificada' : scoreBucket(score);
  }

  function renderKpis() {
    let flips = 0, stable = 0, volatile = 0;
    ATLAS_DATA.forEach(d => {
      const changes = TRANSITIONS.filter(([y1, y2]) => canon(d.governadores[y1].partido) !== canon(d.governadores[y2].partido)).length;
      flips += changes;
      if (changes === 0) stable++;
      if (changes === 2) volatile++;
    });

    const wonByYear = { 2014: new Set(), 2018: new Set(), 2022: new Set() };
    ATLAS_DATA.forEach(d => YEARS.forEach(y => wonByYear[y].add(canon(d.governadores[y].partido))));
    const persistent = [...wonByYear[2014]].filter(p => wonByYear[2018].has(p) && wonByYear[2022].has(p)).length;

    const meanScore = year => {
      const scores = ATLAS_DATA.map(d => ideologyScore(d.governadores[year].partido, year)).filter(s => s != null);
      return scores.reduce((a, b) => a + b, 0) / scores.length;
    };
    const score2018 = meanScore(2018), score2022 = meanScore(2022);
    const delta = score2022 - score2018;
    const direction = delta > 0.05 ? 'para a direita' : delta < -0.05 ? 'para a esquerda' : 'estável';

    document.getElementById('kpiFlips').textContent = flips;
    document.getElementById('kpiStable').textContent = stable;
    document.getElementById('kpiVolatile').textContent = volatile;
    document.getElementById('kpiPersistent').textContent = persistent;
    document.getElementById('kpiIdeology').textContent = formatScore(score2022);
    document.getElementById('kpiIdeologyDelta').textContent = `${delta >= 0 ? '+' : ''}${formatScore(delta)} desde 2018 · deslocamento ${direction}`;
  }

  function renderIdeologyChart() {
    const perYear = YEARS.map(year => {
      const counts = new Map();
      ATLAS_DATA.forEach(d => {
        const bucket = bucketForYear(d.governadores[year].partido, year);
        counts.set(bucket, (counts.get(bucket) || 0) + 1);
      });
      return { year, counts };
    });

    const presentBuckets = BUCKET_ORDER.filter(b => perYear.some(({ counts }) => counts.get(b) > 0));

    document.getElementById('ideologyChart').innerHTML = perYear.map(({ year, counts }) => {
      const total = ATLAS_DATA.length;
      const segments = presentBuckets.filter(b => counts.get(b) > 0).map(bucket => {
        const count = counts.get(bucket);
        const pct = count / total * 100;
        const label = pct >= 12 ? BUCKET_LABELS[bucket] : (pct >= 6 ? count : '');
        return `<span class="diverging-segment" style="width:${pct}%;background:${IDEOLOGY_META.colors[bucket]}" title="${escapeHtml(BUCKET_LABELS[bucket])} · ${count} estado(s) · ${pct.toFixed(1).replace('.', ',')}%">${escapeHtml(String(label))}</span>`;
      }).join('');
      return `<div class="diverging-row"><span class="diverging-year">${year}</span><div class="diverging-track" role="img" aria-label="${year}: ${presentBuckets.filter(b => counts.get(b) > 0).map(b => `${counts.get(b)} ${BUCKET_LABELS[b]}`).join(', ')}">${segments}</div></div>`;
    }).join('');

    document.getElementById('ideologyLegend').innerHTML = presentBuckets.map(bucket =>
      `<span class="legend-item"><i class="legend-swatch" style="background:${IDEOLOGY_META.colors[bucket]}"></i>${escapeHtml(BUCKET_LABELS[bucket])}</span>`
    ).join('');
  }

  function renderTurnover() {
    const cards = TRANSITIONS.map(([y1, y2]) => {
      const changed = ATLAS_DATA.filter(d => canon(d.governadores[y1].partido) !== canon(d.governadores[y2].partido)).length;
      const kept = ATLAS_DATA.length - changed;
      const keptPct = kept / ATLAS_DATA.length * 100;
      return `<div class="transition-card">
        <header><h4>${y1} → ${y2}</h4><span class="transition-count">${changed}</span></header>
        <div class="transition-bar"><span style="width:${keptPct}%;background:var(--teal)" title="Manteve o partido: ${kept} UFs"></span><span style="width:${100 - keptPct}%;background:var(--navy)" title="Trocou de partido: ${changed} UFs"></span></div>
        <p class="transition-note">${kept} UFs mantiveram o partido no governo · ${changed} trocaram</p>
      </div>`;
    }).join('');
    document.getElementById('transitionStats').innerHTML = cards;

    const [, lastTransition] = TRANSITIONS;
    const [y1, y2] = lastTransition;
    const flips = ATLAS_DATA.filter(d => canon(d.governadores[y1].partido) !== canon(d.governadores[y2].partido))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    document.getElementById('flipList').innerHTML = flips.map(d => {
      const before = d.governadores[y1].partido, after = d.governadores[y2].partido;
      return `<div class="flip-item">
        <span class="flip-uf">${d.uf}</span>
        <span class="flip-party"><i class="flip-swatch" style="background:${colorFor(before)}"></i>${escapeHtml(before)}</span>
        <span class="flip-arrow" aria-hidden="true">→</span>
        <span class="flip-party"><i class="flip-swatch" style="background:${colorFor(after)}"></i>${escapeHtml(after)}</span>
      </div>`;
    }).join('') || '<p>Nenhuma troca registrada.</p>';
  }

  function renderTrajectory() {
    const byYear = { 2014: new Map(), 2018: new Map(), 2022: new Map() };
    ATLAS_DATA.forEach(d => YEARS.forEach(y => {
      const code = mergedCode(d.governadores[y].partido);
      byYear[y].set(code, (byYear[y].get(code) || 0) + 1);
    }));

    const totals = new Map();
    YEARS.forEach(y => byYear[y].forEach((v, k) => totals.set(k, (totals.get(k) || 0) + v)));
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 8).map(([code]) => code);
    const values = top.map(code => YEARS.map(y => byYear[y].get(code) || 0));
    const max = Math.max(...values.flat(), 1);

    const points = row => row.map((v, i) => [10 + i * 40, 58 - (v / max) * 52]);

    document.getElementById('partyTrendGrid').innerHTML = top.map((code, idx) => {
      const row = values[idx];
      const pts = points(row);
      const color = colorFor(code);
      const line = pts.map(p => p.join(',')).join(' ');
      const dots = pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${color}" stroke="var(--panel)" stroke-width="2"></circle>`).join('');
      return `<article class="party-trend-card">
        <header><i class="trend-swatch" style="background:${color}"></i><h4>${escapeHtml(code)}</h4></header>
        <svg viewBox="0 0 100 64" role="img" aria-label="${escapeHtml(code)}: ${YEARS.map((y, i) => `${row[i]} em ${y}`).join(', ')}">
          <polyline points="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline>
          ${dots}
        </svg>
        <div class="trend-values">${YEARS.map((y, i) => `<span>${y}: <strong>${row[i]}</strong></span>`).join('')}</div>
      </article>`;
    }).join('');
  }

  function renderStability() {
    const rows = ATLAS_DATA.map(d => {
      const parties = YEARS.map(y => d.governadores[y].partido);
      const changes = TRANSITIONS.filter(([y1, y2]) => canon(d.governadores[y1].partido) !== canon(d.governadores[y2].partido)).length;
      return { d, parties, changes };
    }).sort((a, b) => b.changes - a.changes || a.d.nome.localeCompare(b.d.nome, 'pt-BR'));

    document.querySelector('#stabilityTable tbody').innerHTML = rows.map(({ d, parties, changes }) => `
      <tr>
        <td><strong>${d.uf}</strong></td>
        ${parties.map(p => `<td><span class="flip-party"><i class="flip-swatch" style="background:${colorFor(p)}"></i>${escapeHtml(p)}</span></td>`).join('')}
        <td><span class="change-badge ${changes === 2 ? 'high' : ''}">${changes}</span></td>
      </tr>`).join('');
  }

  function renderAll() {
    renderKpis();
    renderIdeologyChart();
    renderTurnover();
    renderTrajectory();
    renderStability();
    document.getElementById('revisionDate').textContent = ATLAS_META.revisao || '—';
  }

  renderAll();
})(); 