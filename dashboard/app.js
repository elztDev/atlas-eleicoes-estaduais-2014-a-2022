(() => {
  'use strict';

  const YEARS = [2014, 2018, 2022];
  const REGIONS = {
    Norte: ['AC','AP','AM','PA','RO','RR','TO'],
    Nordeste: ['AL','BA','CE','MA','PB','PE','PI','RN','SE'],
    'Centro-Oeste': ['DF','GO','MT','MS'],
    Sudeste: ['ES','MG','RJ','SP'],
    Sul: ['PR','RS','SC']
  };
  const MAP_POS = {
    RR:[1,4], AP:[1,7], AC:[3,1], AM:[3,3], PA:[3,6], RO:[5,2], TO:[5,6],
    MA:[4,8], PI:[5,8], CE:[4,9], RN:[5,9], PB:[6,9], PE:[7,9], AL:[8,9], SE:[9,9], BA:[7,7],
    MT:[6,4], GO:[7,5], DF:[7,6], MS:[8,4], MG:[8,6], ES:[8,8], RJ:[9,7], SP:[9,5],
    PR:[10,5], SC:[11,5], RS:[12,4]
  };
  const PARTY_COLORS = {
    PT:'#c93038', PMDB:'#2b8b75', MDB:'#2b8b75', PSDB:'#2778ba', PL:'#2851a3', PSD:'#f39b27', PP:'#166cc1',
    PDT:'#e65a35', PSB:'#df6f2d', DEM:'#2d76b8', UNIAO:'#36a7a0', 'UNIÃO':'#36a7a0', PSL:'#2959a3', PSC:'#2d6f94',
    REP:'#2d70a6', REPUBLICANOS:'#2d70a6', PRB:'#2d70a6', PSOL:'#cf5b30', PODE:'#7057a5', PV:'#54a548', NOVO:'#ef7f24',
    SDD:'#e27838', SOLIDARIEDADE:'#e27838', AVANTE:'#8d4ba7', REDE:'#63a848', PCdoB:'#a8333e', PCDOB:'#a8333e',
    CIDADANIA:'#e05c97', PPS:'#e05c97', PR:'#315d91', PROS:'#ef8c22', PTB:'#31518b', PHS:'#7565a2', PRTB:'#27415f'
  };
  const FALLBACK_COLORS = ['#47798b','#7868a6','#bd6a56','#2f8d78','#8d6b43','#536d9b','#8a5577','#547f4a','#935f42'];

  const state = { year: 2022, region: 'Brasil', uf: '', detailUF: 'RJ', party: '', mode: 'governor', changesOnly: false, compareA: 'RJ', compareB: 'SP' };
  const byUF = Object.fromEntries(ATLAS_DATA.map(d => [d.uf, d]));

  function canon(value='') {
    const raw = String(value).trim();
    const up = raw.toLocaleUpperCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    const aliases = { 'UNIAO':'UNIAO','UNIAO BRASIL':'UNIAO','REPUBLICANOS':'REP','SOLIDARIEDADE':'SDD','PC DO B':'PCDOB','PCDOB':'PCDOB','PCDOB':'PCDOB','CIDADANIA':'CDD','PROGRESSISTAS':'PP' };
    return aliases[up] || up;
  }

  function colorFor(label='') {
    const text = String(label);
    const candidates = Object.keys(PARTY_COLORS).filter(k => new RegExp(`(^|[^A-Z])${k}([^A-Z]|$)`).test(canon(text)));
    if (candidates.length) return PARTY_COLORS[candidates[0]];
    let hash = 0; for (const ch of text) hash = ((hash << 5) - hash) + ch.charCodeAt(0);
    return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
  }

  function selectedStates() {
    let list = ATLAS_DATA;
    if (state.region !== 'Brasil') list = list.filter(d => REGIONS[state.region].includes(d.uf));
    if (state.uf) list = list.filter(d => d.uf === state.uf);
    return list;
  }

  function modeLabel(item, year=state.year, mode=state.mode) {
    if (mode === 'governor') return item.governadores[year]?.partido || 'Sem dado';
    return item.assembleia[year]?.bancada || 'Sem dado';
  }

  function containsParty(item, party, year=state.year, mode=state.mode) {
    if (!party) return true;
    if (mode === 'governor') return canon(item.governadores[year]?.partido) === canon(party);
    const groups = item.assembleia[year]?.grupos || [];
    return groups.some(g => canon(g.nome) === canon(party) || g.partidos?.some(p => canon(p) === canon(party)));
  }

  function changedUF(item) {
    const a = canon(modeLabel(item, 2014));
    const b = canon(modeLabel(item, 2018));
    const c = canon(modeLabel(item, 2022));
    return a !== b || b !== c;
  }

  function aggregateGovernors(list, year) {
    const map = new Map();
    list.forEach(d => { const p = d.governadores[year]?.partido; if (p) map.set(p, (map.get(p) || 0) + 1); });
    return [...map].map(([label,value]) => ({label,value})).sort((a,b) => b.value-a.value || a.label.localeCompare(b.label));
  }

  function aggregateSeats(list, year) {
    const map = new Map();
    list.forEach(d => (d.assembleia[year]?.grupos || []).forEach(g => map.set(g.nome, (map.get(g.nome) || 0) + g.cadeiras)));
    return [...map].map(([label,value]) => ({label,value})).sort((a,b) => b.value-a.value || a.label.localeCompare(b.label));
  }

  function formatNumber(n) { return new Intl.NumberFormat('pt-BR').format(n || 0); }
  function escapeHtml(v='') { return String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  function populateSelects() {
    const options = ATLAS_DATA.map(d => `<option value="${d.uf}">${d.uf} · ${escapeHtml(d.nome)}</option>`).join('');
    ['stateFilter','detailState','compareA','compareB'].forEach(id => document.getElementById(id).insertAdjacentHTML('beforeend', options));
    document.getElementById('detailState').value = state.detailUF;
    document.getElementById('compareA').value = state.compareA;
    document.getElementById('compareB').value = state.compareB;
  }

  function renderPartyFilter() {
    const select = document.getElementById('partyFilter');
    const current = state.party;
    const labels = state.mode === 'governor'
      ? aggregateGovernors(ATLAS_DATA, state.year).map(d => d.label)
      : aggregateSeats(ATLAS_DATA, state.year).map(d => d.label);
    select.innerHTML = '<option value="">Todos</option>' + labels.map(x => `<option>${escapeHtml(x)}</option>`).join('');
    if (labels.includes(current)) select.value = current; else state.party = '';
  }

  function renderKpis() {
    const list = selectedStates();
    const gov = new Set(list.map(d => d.governadores[state.year]?.partido).filter(Boolean));
    const assemblies = list.map(d => d.assembleia[state.year]).filter(Boolean);
    const seats = assemblies.reduce((sum,a) => sum + (a.total || 0), 0);
    const groups = new Set(assemblies.flatMap(a => (a.grupos || []).map(g => g.nome)));
    const mismatch = list.filter(d => {
      const p = canon(d.governadores[state.year]?.partido);
      const bancada = canon(d.assembleia[state.year]?.bancada);
      return p && bancada && !bancada.split('/').map(x => x.trim()).includes(p);
    }).length;
    document.getElementById('kpiStates').textContent = list.length;
    document.getElementById('kpiGovParties').textContent = gov.size;
    document.getElementById('kpiSeats').textContent = formatNumber(seats);
    document.getElementById('kpiGroups').textContent = groups.size;
    document.getElementById('kpiMismatch').textContent = mismatch;
  }

  function renderMap() {
    const map = document.getElementById('brazilMap');
    const allowed = new Set(selectedStates().map(d => d.uf));
    map.innerHTML = ATLAS_DATA.map(item => {
      const pos = MAP_POS[item.uf];
      const label = modeLabel(item);
      const dim = !allowed.has(item.uf) || !containsParty(item, state.party) || (state.changesOnly && !changedUF(item));
      const cls = ['state-tile', item.uf === state.detailUF ? 'selected' : '', dim ? 'dimmed' : '', state.changesOnly && changedUF(item) ? 'changed' : ''].filter(Boolean).join(' ');
      const style = `grid-row:${pos[0]};grid-column:${pos[1]};background:${colorFor(label)}`;
      return `<button type="button" class="${cls}" style="${style}" data-uf="${item.uf}" aria-label="${escapeHtml(item.nome)}: ${escapeHtml(label)}">${item.uf}</button>`;
    }).join('');
    map.querySelectorAll('.state-tile').forEach(btn => {
      btn.addEventListener('click', () => selectDetail(btn.dataset.uf));
      btn.addEventListener('pointerenter', e => showMapTooltip(e, btn.dataset.uf));
      btn.addEventListener('pointermove', positionTooltip);
      btn.addEventListener('pointerleave', hideMapTooltip);
      btn.addEventListener('focus', e => showMapTooltip(e, btn.dataset.uf, true));
      btn.addEventListener('blur', hideMapTooltip);
    });
    renderSpotlight();
  }

  function showMapTooltip(event, uf, keyboard=false) {
    const item = byUF[uf], gov = item.governadores[state.year], ass = item.assembleia[state.year];
    const tip = document.getElementById('mapTooltip');
    tip.innerHTML = `<strong>${escapeHtml(item.nome)} · ${state.year}</strong>Governador: ${escapeHtml(gov?.candidato || '—')} (${escapeHtml(gov?.partido || '—')})<br>Maior bancada: ${escapeHtml(ass?.bancada || '—')} · ${ass?.cadeiras || '—'}/${ass?.total || '—'} cadeiras`;
    tip.hidden = false;
    if (keyboard) { const r = event.currentTarget.getBoundingClientRect(); tip.style.left = `${r.right + 8}px`; tip.style.top = `${r.top}px`; }
    else positionTooltip(event);
  }
  function positionTooltip(event) {
    const tip = document.getElementById('mapTooltip');
    if (tip.hidden || event.clientX === undefined) return;
    const x = Math.min(event.clientX + 14, window.innerWidth - 235);
    const y = Math.min(event.clientY + 14, window.innerHeight - 130);
    tip.style.left = `${x}px`; tip.style.top = `${y}px`;
  }
  function hideMapTooltip() { document.getElementById('mapTooltip').hidden = true; }

  function renderSpotlight() {
    const item = byUF[state.detailUF]; const gov = item.governadores[state.year]; const ass = item.assembleia[state.year];
    document.getElementById('stateSpotlight').innerHTML = `
      <span class="spot-uf">${item.uf} · ${state.year}</span><h4>${escapeHtml(item.nome)}</h4>
      <div class="spot-row"><span>Governador eleito</span><strong>${escapeHtml(gov?.candidato || '—')}</strong><small><i class="spot-swatch" style="background:${colorFor(gov?.partido)}"></i>${escapeHtml(gov?.partido || '—')}</small></div>
      <div class="spot-row"><span>Maior bancada</span><strong>${escapeHtml(ass?.bancada || '—')}</strong><small>${ass ? `${ass.cadeiras} de ${ass.total} cadeiras · ${Math.round(ass.cadeiras/ass.total*100)}%` : '—'}</small></div>`;
  }

  function renderBarChart(id, data, limit=9) {
    const node = document.getElementById(id); const top = data.slice(0,limit); const max = top[0]?.value || 1;
    node.innerHTML = top.map(d => `<div class="bar-item ${state.party && canon(d.label) === canon(state.party) ? 'highlight' : ''}" title="${escapeHtml(d.label)}: ${formatNumber(d.value)}">
      <span class="bar-label">${escapeHtml(d.label)}</span><span class="bar-track"><span class="bar-fill" style="width:${d.value/max*100}%;background:${colorFor(d.label)}"></span></span><span class="bar-value">${formatNumber(d.value)}</span>
    </div>`).join('') || '<p>Não há dados para a seleção.</p>';
  }

  function renderRankings() {
    const list = selectedStates();
    const main = state.mode === 'governor' ? aggregateGovernors(list,state.year) : list.map(d => ({label:d.assembleia[state.year]?.bancada || 'Sem dado',value:1})).reduce((acc,d) => { const hit=acc.find(x=>x.label===d.label); hit ? hit.value++ : acc.push(d); return acc; },[]).sort((a,b)=>b.value-a.value);
    document.getElementById('rankingTitle').textContent = state.mode === 'governor' ? 'Governadores por partido' : 'Maior bancada por UF';
    document.getElementById('rankingUnit').textContent = state.mode === 'governor' ? 'governos' : 'UFs';
    document.getElementById('mapTitle').textContent = state.mode === 'governor' ? 'Partido do governador eleito' : 'Maior bancada da Assembleia';
    renderBarChart('mainRanking', main, 11);
    renderBarChart('seatRanking', aggregateSeats(list,state.year), 12);
  }

  function renderChanges() {
    const list = selectedStates();
    const timeline = document.getElementById('changeTimeline');
    timeline.innerHTML = YEARS.map((year, idx) => {
      const data = aggregateGovernors(list, year); const total = data.reduce((s,d)=>s+d.value,0) || 1;
      const ribbon = data.map(d => `<span style="width:${d.value/total*100}%;background:${colorFor(d.label)}" title="${escapeHtml(d.label)}: ${d.value}"></span>`).join('');
      let note = idx === 0 ? `${data.length} partidos eleitos` : `${list.filter(d => canon(d.governadores[YEARS[idx-1]]?.partido) !== canon(d.governadores[year]?.partido)).length} UFs mudaram de partido desde ${YEARS[idx-1]}`;
      return `<article class="change-year"><header><strong>${year}</strong><span>${data.length} legendas</span></header><div class="party-ribbon">${ribbon}</div><p class="change-note">${note}</p></article>`;
    }).join('');
  }

  function renderHeatmap() {
    const list = selectedStates(); const groups = aggregateSeats(list,state.year).slice(0,12);
    let html = `<div class="heatmap"><span></span>${list.map(d => `<span class="heatmap-uf">${d.uf}</span>`).join('')}`;
    groups.forEach(group => {
      html += `<span class="heatmap-label" title="${escapeHtml(group.label)}">${escapeHtml(group.label)}</span>`;
      list.forEach(d => {
        const ass = d.assembleia[state.year]; const g = ass?.grupos?.find(x => canon(x.nome) === canon(group.label)); const pct = g && ass ? g.cadeiras/ass.total : 0;
        html += `<button class="heat-cell" style="background:${pct ? colorFor(group.label) : '#edf2f1'};opacity:${pct ? Math.max(.28,Math.min(1,pct*4.4)) : 1}" title="${d.uf} · ${escapeHtml(group.label)}: ${g?.cadeiras || 0} cadeira(s)${ass ? ` · ${(pct*100).toFixed(1).replace('.',',')}%` : ''}" aria-label="${d.uf}, ${escapeHtml(group.label)}, ${g?.cadeiras || 0} cadeiras"></button>`;
      });
    });
    document.getElementById('heatmap').innerHTML = html + '</div>';
  }

  function selectDetail(uf) {
    state.detailUF = uf;
    document.getElementById('detailState').value = uf;
    renderMap(); renderState();
  }

  function renderState() {
    const item = byUF[state.detailUF];
    document.getElementById('stateTitle').textContent = item.nome;
    document.getElementById('stateTimeline').innerHTML = YEARS.map(year => {
      const gov = item.governadores[year], ass = item.assembleia[year];
      return `<article class="year-card"><span class="year">${year}</span><h4>${escapeHtml(gov?.candidato || '—')}</h4><p>Governador eleito</p><span class="party-chip" style="background:${colorFor(gov?.partido)}">${escapeHtml(gov?.partido || '—')}</span>
      <div class="legislature"><p>Maior bancada</p><strong>${escapeHtml(ass?.bancada || '—')}</strong><p>${ass ? `${ass.cadeiras} de ${ass.total} cadeiras · ${Math.round(ass.cadeiras/ass.total*100)}% da Assembleia` : '—'}</p></div></article>`;
    }).join('');
    document.getElementById('assemblyDna').innerHTML = YEARS.map(year => {
      const ass = item.assembleia[year];
      const segments = (ass?.grupos || []).map(g => {
        const pct = g.cadeiras/ass.total*100; const label = pct >= 8 ? g.nome.replace('Federação ','') : (pct >= 4 ? g.cadeiras : '');
        return `<span class="dna-segment" style="width:${pct}%;background:${colorFor(g.nome)}" title="${escapeHtml(g.nome)} · ${g.cadeiras} cadeira(s) · ${pct.toFixed(1).replace('.',',')}%">${escapeHtml(label)}</span>`;
      }).join('');
      return `<div class="dna-row"><span class="dna-year">${year}</span><div class="dna-bar">${segments}</div></div>`;
    }).join('');
  }

  function renderComparison() {
    const a = byUF[state.compareA], b = byUF[state.compareB], year = state.year;
    const ga = a.governadores[year], gb = b.governadores[year], aa = a.assembleia[year], ab = b.assembleia[year];
    const rows = [
      ['Governador', ga?.candidato, gb?.candidato], ['Partido vencedor', ga?.partido, gb?.partido],
      ['Maior bancada', aa?.bancada, ab?.bancada], ['Força da maior bancada', aa ? `${aa.cadeiras}/${aa.total} · ${Math.round(aa.cadeiras/aa.total*100)}%` : '—', ab ? `${ab.cadeiras}/${ab.total} · ${Math.round(ab.cadeiras/ab.total*100)}%` : '—'],
      ['Grupos representados', aa?.grupos?.length, ab?.grupos?.length], ['Maior aliança/lista', aa?.maiorAlianca?.nome, ab?.maiorAlianca?.nome]
    ];
    document.getElementById('comparison').innerHTML = `<table><thead><tr><th>${year}</th><th>${escapeHtml(a.nome)}</th><th>${escapeHtml(b.nome)}</th></tr></thead><tbody>${rows.map(r => `<tr><th>${r[0]}</th><td>${escapeHtml(r[1] ?? '—')}</td><td>${escapeHtml(r[2] ?? '—')}</td></tr>`).join('')}</tbody></table>`;
  }

  function renderAll() {
    document.getElementById('headlineYear').textContent = state.year;
    renderPartyFilter(); renderKpis(); renderMap(); renderRankings(); renderChanges(); renderHeatmap(); renderState(); renderComparison();
    document.getElementById('revisionDate').textContent = ATLAS_META.revisao || '—';
  }

  function bindEvents() {
    document.querySelectorAll('[data-year]').forEach(btn => btn.addEventListener('click', () => {
      state.year = Number(btn.dataset.year); state.party = '';
      document.querySelectorAll('[data-year]').forEach(b => { const active=b===btn; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active)); });
      renderAll();
    }));
    document.querySelectorAll('[data-mode]').forEach(btn => btn.addEventListener('click', () => {
      state.mode = btn.dataset.mode; state.party='';
      document.querySelectorAll('[data-mode]').forEach(b => { const active=b===btn; b.classList.toggle('active',active); b.setAttribute('aria-pressed',String(active)); });
      renderAll();
    }));
    document.getElementById('regionFilter').addEventListener('change', e => { state.region=e.target.value; state.uf=''; document.getElementById('stateFilter').value=''; renderAll(); });
    document.getElementById('stateFilter').addEventListener('change', e => { state.uf=e.target.value; if(state.uf) selectDetail(state.uf); renderAll(); });
    document.getElementById('partyFilter').addEventListener('change', e => { state.party=e.target.value; renderKpis(); renderMap(); renderRankings(); renderHeatmap(); });
    document.getElementById('detailState').addEventListener('change', e => selectDetail(e.target.value));
    document.getElementById('compareA').addEventListener('change', e => { state.compareA=e.target.value; renderComparison(); });
    document.getElementById('compareB').addEventListener('change', e => { state.compareB=e.target.value; renderComparison(); });
    document.getElementById('changesOnly').addEventListener('click', e => { state.changesOnly=!state.changesOnly; e.currentTarget.classList.toggle('active',state.changesOnly); e.currentTarget.setAttribute('aria-pressed',String(state.changesOnly)); renderMap(); });
    document.getElementById('resetFilters').addEventListener('click', () => {
      Object.assign(state,{year:2022,region:'Brasil',uf:'',party:'',mode:'governor',changesOnly:false});
      document.getElementById('regionFilter').value='Brasil'; document.getElementById('stateFilter').value=''; document.getElementById('changesOnly').classList.remove('active');
      document.querySelectorAll('[data-year]').forEach(b => b.classList.toggle('active',b.dataset.year==='2022'));
      document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('active',b.dataset.mode==='governor'));
      renderAll();
    });
  }

  populateSelects(); bindEvents(); renderAll();
})();
