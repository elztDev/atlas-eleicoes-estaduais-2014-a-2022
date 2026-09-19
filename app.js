(() => {
  const years = [2014,2018,2022];
  let currentView = 'governadores';
  let returnView = 'governadores';
  let mapYear = 2022;
  let mapMode = 'govPartido';
  let mapTopology = null;
  let selectedMapUf = null;
  let currentDetailUf = null;
  let compareEnabled = false;
  let compareYear = 2018;

  const MAP_TOPOLOGY_URL = 'https://gist.githubusercontent.com/ppKrauss/0c33364240e841fa23e78b21005f792c/raw/153641252fe5e6499f12373b0789565e822e5ef2/br-states.json';

  const $ = sel => document.querySelector(sel);
  const tabs = [...document.querySelectorAll('.tab')];
  const tbody = $('#data-body');
  const title = $('#table-title');
  const help = $('#table-help');
  const note = $('#table-note');
  const search = $('#state-search');
  const listView = $('#list-view');
  const mapView = $('#map-view');
  const detailView = $('#detail-view');
  const svgNS = 'http://www.w3.org/2000/svg';

  const esc = value => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  const DATA_STATUS = {
    'em-validacao': {label:'Em validação', className:'pending'},
    'nao-localizado': {label:'Não localizado', className:'not-found'},
    'nao-aplica': {label:'—', className:'not-applicable'}
  };

  function dataStatus(value){
    if (value === null || value === undefined) return 'em-validacao';
    if (typeof value === 'object' && value.status && DATA_STATUS[value.status]) return value.status;
    return null;
  }

  function statusMarkup(value, inline=false){
    const key = dataStatus(value);
    if (!key) return '';
    const meta = DATA_STATUS[key];
    const tag = inline ? 'span' : 'span';
    const title = key === 'em-validacao' ? 'Dado ainda está sendo conferido.' : key === 'nao-localizado' ? 'A fonte consultada não forneceu este dado.' : 'Não se aplica ou não existia nesta eleição.';
    return `<${tag} class="${meta.className}" title="${esc(title)}">${esc(meta.label)}</${tag}>`;
  }


  function renderCell(item,year){
    if (dataStatus(item)) return statusMarkup(item);
    if (currentView === 'governadores') {
      return `<div class="cell-main">${esc(item.partido)}</div><div class="cell-sub">${esc(item.coligacao || '—')}</div>`;
    }
    const extra = item.nota ? `<div class="cell-sub">${esc(item.nota)}</div>` : '';
    const alliance = !dataStatus(item.maiorAlianca)
      ? `<div class="cell-sub"><b>${esc(item.maiorAlianca.tipo || 'Aliança')}:</b> ${esc(item.maiorAlianca.nome)} · ${esc(item.maiorAlianca.cadeiras)}/${esc(item.total)}</div>`
      : `<div class="cell-sub"><b>Coligação/federação com mais cadeiras:</b> ${statusMarkup(item.maiorAlianca,true)}</div>`;
    return `<div class="cell-main">${esc(item.bancada)} · ${esc(item.cadeiras)}/${esc(item.total)}</div>${alliance}${extra}`;
  }

  function syncUrl(){
    const params = new URLSearchParams();
    const activeView = currentDetailUf ? returnView : currentView;
    params.set('view', activeView);
    if (activeView === 'mapas') {
      params.set('year', String(mapYear));
      params.set('mode', mapMode);
      if (compareEnabled) {
        params.set('compare', String(compareYear));
      }
    }
    if (currentDetailUf) params.set('uf', currentDetailUf);
    else if (activeView === 'mapas' && selectedMapUf) params.set('uf', selectedMapUf);
    const query = params.toString();
    history.replaceState(null,'',`${location.pathname}${query ? `?${query}` : ''}`);
  }

  function renderTable(){
    const term = search.value.trim().toLocaleLowerCase('pt-BR');
    const filtered = ATLAS_DATA.filter(s => !term || s.uf.toLowerCase().includes(term) || s.nome.toLocaleLowerCase('pt-BR').includes(term));
    tbody.innerHTML = filtered.map(state => {
      const source = currentView === 'governadores' ? state.governadores : state.assembleia;
      return `<tr>
        <td class="uf-col"><button class="uf-link" type="button" data-uf="${esc(state.uf)}" title="Abrir ${esc(state.nome)}">${esc(state.uf)}</button></td>
        ${years.map(y => `<td>${renderCell(source[y],y)}</td>`).join('')}
      </tr>`;
    }).join('');

    [...document.querySelectorAll('.uf-link')].forEach(btn => btn.addEventListener('click', () => openDetail(btn.dataset.uf)));
  }

  function setView(view){
    currentDetailUf = null;
    currentView = view;
    returnView = view;
    tabs.forEach(t => t.classList.toggle('is-active', t.dataset.view === view));
    detailView.hidden = true;

    if (view === 'mapas') {
      listView.hidden = true;
      mapView.hidden = false;
      syncUrl();
      renderMap();
      return;
    }

    mapView.hidden = true;
    listView.hidden = false;
    if (view === 'governadores') {
      title.textContent = 'Governadores';
      help.textContent = 'Partido do governador eleito e coligação estadual. No detalhe, veja os partidos aliados e o apoio validado no 2º turno presidencial.';
      note.textContent = 'Clique na sigla de um Estado para abrir a página detalhada.';
    } else {
      title.textContent = 'Assembleias Legislativas';
      help.textContent = 'Maior bancada, total da Casa e coligação/federação que reuniu o maior número de cadeiras na eleição.';
      note.textContent = '“Mais cadeiras” não significa maioria absoluta. Em 2022 não havia coligações proporcionais; a comparação é feita por partido ou federação.';
    }
    renderTable();
    syncUrl();
  }

  function detailGovernorRow(year, item){
    if (dataStatus(item)) return `<div class="year-row"><div class="year">${year}</div><div class="year-content">${statusMarkup(item)}</div></div>`;
    const parties = item.partidos?.length
      ? `<div class="detail-block"><b>Partidos da coligação</b><div class="party-chips">${item.partidos.map(p => `<span>${esc(p)}</span>`).join('')}</div></div>`
      : '';
    const presidential = item.apoioSegundoTurno
      ? `<div class="detail-block"><b>Apoio no 2º turno presidencial</b><div class="president-line"><strong>${esc(item.apoioSegundoTurno.candidato)}</strong><span>${esc(item.apoioSegundoTurno.observacao || '')}</span></div></div>`
      : `<div class="detail-block"><b>Apoio no 2º turno presidencial</b><div class="validation-line">${statusMarkup(item.apoioSegundoTurno,true)}</div></div>`;
    return `<div class="year-row"><div class="year">${year}</div><div class="year-content"><strong>${esc(item.candidato || '—')} · ${esc(item.partido)}</strong><span>Coligação estadual: ${esc(item.coligacao || '—')}</span>${parties}${presidential}</div></div>`;
  }

  function detailAssemblyRow(year, item){
    if (dataStatus(item)) return `<div class="year-row"><div class="year">${year}</div><div class="year-content">${statusMarkup(item)}</div></div>`;
    const majority = Math.floor(item.total/2)+1;
    const alliance = !dataStatus(item.maiorAlianca)
      ? `<span>${esc(item.maiorAlianca.tipo || 'Aliança')} com mais cadeiras: ${esc(item.maiorAlianca.nome)} · ${esc(item.maiorAlianca.cadeiras)}/${esc(item.total)}</span>`
      : `<span>Coligação/federação com mais cadeiras: ${statusMarkup(item.maiorAlianca,true)}</span>`;
    return `<div class="year-row"><div class="year">${year}</div><div class="year-content"><strong>Maior bancada: ${esc(item.bancada)} · ${esc(item.cadeiras)}/${esc(item.total)} cadeiras</strong>${alliance}<span>Maioria absoluta: ${majority}${item.nota ? ' · '+esc(item.nota) : ''}</span></div></div>`;
  }

  function openDetail(uf){
    const state = ATLAS_DATA.find(s => s.uf === uf);
    if (!state) return;
    $('#detail-title').textContent = `${state.nome} (${state.uf})`;
    $('#detail-governadores').innerHTML = years.map(y => detailGovernorRow(y,state.governadores[y])).join('');
    $('#detail-assembleia').innerHTML = years.map(y => detailAssemblyRow(y,state.assembleia[y])).join('');
    const notes = state.notes.length ? state.notes : ['Informações complementares serão adicionadas durante a validação da base.'];
    $('#detail-notes').innerHTML = notes.map(n => `<p>${esc(n)}</p>`).join('');
    listView.hidden = true;
    mapView.hidden = true;
    detailView.hidden = false;
    currentDetailUf = uf;
    syncUrl();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function closeDetail(){
    detailView.hidden = true;
    currentDetailUf = null;
    setView(returnView || 'governadores');
  }

  function mapCategory(state,year=mapYear,mode=mapMode){
    const gov = state.governadores[year];
    const ass = state.assembleia[year];
    if (mode === 'govPartido') return dataStatus(gov) ? null : (gov.partido || null);
    if (mode === 'govColigacao') return dataStatus(gov) ? null : (gov.coligacao || null);
    if (mode === 'assembleia') return dataStatus(ass) ? null : (ass.bancada || null);
    if (mode === 'assembleiaComposicao') return dataStatus(ass) ? null : (ass.bancada || null);
    return null;
  }

  function mapModeLabel(){
    if (mapMode === 'govPartido') return 'Partido do governador eleito';
    if (mapMode === 'govColigacao') return 'Coligação vencedora para governador';
    if (mapMode === 'assembleia') return 'Maior bancada da Assembleia Legislativa';
    return 'Composição da Assembleia por partido/federação';
  }

  function normalizePartyName(name){
    const raw = String(name || '').trim();
    if (!raw) return null;
    const upper = raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    return PARTY_ALIASES[raw] || PARTY_ALIASES[upper] || upper;
  }

  function ideologyFromScore(score){
    if (!Number.isFinite(score)) return null;
    if (score <= 1.50) return 'extrema esquerda';
    if (score <= 3.00) return 'esquerda';
    if (score <= 4.49) return 'centro-esquerda';
    if (score <= 5.50) return 'centro';
    if (score <= 7.00) return 'centro-direita';
    if (score <= 8.50) return 'direita';
    return 'extrema direita';
  }

  function partyIdeology(party,year=mapYear){
    const key = normalizePartyName(party);
    if (!key) return null;
    if (year === 2014) {
      if (PARTY_IDEOLOGY_2014.esquerda.includes(key)) return 'esquerda';
      if (PARTY_IDEOLOGY_2014.centro.includes(key)) return 'centro';
      if (PARTY_IDEOLOGY_2014.direita.includes(key)) return 'direita';
      return null;
    }
    const score = PARTY_IDEOLOGY_SCORES[year]?.[key];
    return ideologyFromScore(score);
  }

  function ideologySide(ideology){
    if (!ideology) return null;
    if (ideology.includes('esquerda')) return 'left';
    if (ideology.includes('direita')) return 'right';
    if (ideology === 'centro') return 'center';
    return null;
  }

  function partiesFromText(text){
    const source = String(text || '');
    const candidates = Object.keys(PARTY_ALIASES)
      .filter(k => k.length >= 2)
      .sort((a,b) => b.length-a.length);
    const found = [];
    const normalizedSource = source.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    candidates.forEach(alias => {
      const a = alias.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
      const re = new RegExp(`(^|[^A-Z0-9])${a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}([^A-Z0-9]|$)`);
      if (re.test(normalizedSource)) {
        const canonical = normalizePartyName(alias);
        if (canonical && !found.includes(canonical)) found.push(canonical);
      }
    });
    return found;
  }

  function ideologyForParties(parties,year=mapYear){
    const list = (parties || []).map(normalizePartyName).filter(Boolean);
    const ideologies = list.map(p => partyIdeology(p,year)).filter(Boolean);
    if (!ideologies.length) return null;
    const sides = new Set(ideologies.map(ideologySide).filter(Boolean));
    if (sides.has('left') && sides.has('right')) return 'mista';
    if (sides.size === 1 && sides.has('center')) return 'centro';

    const order = ['extrema esquerda','esquerda','centro-esquerda','centro','centro-direita','direita','extrema direita'];
    const known = ideologies.filter(i => order.includes(i));
    if (!known.length) return null;
    const avg = known.reduce((sum,i) => sum + order.indexOf(i),0) / known.length;
    return order[Math.round(avg)];
  }

  function colorForIdeology(ideology){
    return IDEOLOGY_META.colors[ideology] || IDEOLOGY_META.colors['não classificada'];
  }

  function colorForCategory(label,parties=null,year=mapYear){
    if (!label && !(parties && parties.length)) return IDEOLOGY_META.colors['não classificada'];
    const inferredParties = parties?.length ? parties : partiesFromText(label);
    let ideology = inferredParties.length ? ideologyForParties(inferredParties,year) : partyIdeology(label,year);
    if (!ideology) ideology = partyIdeology(label,year);
    return colorForIdeology(ideology);
  }

  function colorForState(state,year=mapYear,mode=mapMode){
    if (!state) return IDEOLOGY_META.colors['não classificada'];
    if (mode === 'govPartido') {
      const item = state.governadores[year];
      return !dataStatus(item) ? colorForCategory(item.partido,[item.partido],year) : IDEOLOGY_META.colors['não classificada'];
    }
    if (mode === 'govColigacao') {
      const item = state.governadores[year];
      return !dataStatus(item) ? colorForCategory(item.partido,[item.partido],year) : IDEOLOGY_META.colors['não classificada'];
    }
    if (mode === 'assembleia') {
      const item = state.assembleia[year];
      if (dataStatus(item)) return IDEOLOGY_META.colors['não classificada'];
      return colorForCategory(item.bancada,partiesFromText(item.bancada),year);
    }
    if (mode === 'assembleiaComposicao') {
      const item = state.assembleia[year];
      if (dataStatus(item)) return IDEOLOGY_META.colors['não classificada'];
      return colorForCategory(item.bancada,partiesFromText(item.bancada),year);
    }
    return IDEOLOGY_META.colors['não classificada'];
  }

  function decodeArc(topo, arcRef){
    const idx = arcRef < 0 ? ~arcRef : arcRef;
    const arc = topo.arcs[idx];
    const scale = topo.transform?.scale || [1,1];
    const translate = topo.transform?.translate || [0,0];
    let x = 0, y = 0;
    let points = arc.map(([dx,dy]) => {
      x += dx; y += dy;
      return [x * scale[0] + translate[0], y * scale[1] + translate[1]];
    });
    if (arcRef < 0) points = points.reverse();
    return points;
  }

  function ringPoints(topo, refs){
    const points = [];
    refs.forEach((ref,index) => {
      let arc = decodeArc(topo,ref);
      if (index && arc.length) arc = arc.slice(1);
      points.push(...arc);
    });
    return points;
  }

  function geometryRings(topo, geometry){
    if (geometry.type === 'Polygon') return geometry.arcs.map(r => ringPoints(topo,r));
    if (geometry.type === 'MultiPolygon') return geometry.arcs.flatMap(poly => poly.map(r => ringPoints(topo,r)));
    return [];
  }

  function projectPoint(lon,lat,bbox,width,height,padding){
    const [minLon,minLat,maxLon,maxLat] = bbox;
    const sx = (width - padding*2) / (maxLon - minLon);
    const sy = (height - padding*2) / (maxLat - minLat);
    const s = Math.min(sx,sy);
    const usedW = (maxLon-minLon)*s;
    const usedH = (maxLat-minLat)*s;
    const ox = (width-usedW)/2;
    const oy = (height-usedH)/2;
    return [ox+(lon-minLon)*s, oy+(maxLat-lat)*s];
  }

  function geometryPath(topo,geometry){
    const bbox = topo.objects.estados.bbox || [-74,-34,-34,6];
    return geometryRings(topo,geometry).map(ring => {
      if (!ring.length) return '';
      return ring.map(([lon,lat],i) => {
        const [x,y] = projectPoint(lon,lat,bbox,620,620,26);
        return `${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`;
      }).join('')+'Z';
    }).join('');
  }

  async function ensureMapTopology(){
    if (mapTopology) return mapTopology;
    const status = $('#map-status');
    status.hidden = false;
    status.textContent = 'Carregando a malha dos Estados…';
    const response = await fetch(MAP_TOPOLOGY_URL,{mode:'cors'});
    if (!response.ok) throw new Error('Falha ao carregar a malha do mapa.');
    mapTopology = await response.json();
    return mapTopology;
  }

  function mapDetailHtml(state,year){
    const isAssemblyMode = mapMode === 'assembleia' || mapMode === 'assembleiaComposicao';
    const item = isAssemblyMode ? state.assembleia[year] : state.governadores[year];
    if (dataStatus(item)) return `<div class="compare-detail-block"><p class="map-year-label">Eleição ${year}</p>${statusMarkup(item)}</div>`;
    let html = '';
    if (mapMode === 'govPartido') {
      html = `<p class="map-big-value">${esc(item.partido)}</p><p>${esc(item.candidato || 'Governador eleito')}</p><p class="muted">Coligação: ${esc(item.coligacao || '—')}</p>`;
    } else if (mapMode === 'govColigacao') {
      html = `<p class="map-big-value map-long-value">${esc(item.coligacao || '—')}</p><p>${esc(item.candidato || 'Governador eleito')} · ${esc(item.partido)}</p>${item.partidos?.length ? `<p class="muted">${esc(item.partidos.join(' · '))}</p>` : ''}`;
    } else if (mapMode === 'assembleia') {
      const majority = Math.floor(item.total/2)+1;
      const alliance = !dataStatus(item.maiorAlianca) ? `${esc(item.maiorAlianca.nome)} · ${esc(item.maiorAlianca.cadeiras)}/${esc(item.total)}` : statusMarkup(item.maiorAlianca,true);
      html = `<p class="map-big-value map-long-value">${esc(item.bancada)}</p><p>Maior bancada: ${esc(item.cadeiras)}/${esc(item.total)} cadeiras</p><p class="muted">Coligação/federação com mais cadeiras: ${alliance}</p><p class="muted">Maioria absoluta: ${majority}</p>`;
    } else {
      const majority = Math.floor(item.total/2)+1;
      const alliance = !dataStatus(item.maiorAlianca) ? `${esc(item.maiorAlianca.nome)} · ${esc(item.maiorAlianca.cadeiras)}/${esc(item.total)}` : statusMarkup(item.maiorAlianca,true);
      html = `<p class="map-big-value map-long-value">${esc(item.total)} cadeiras</p><p>Composição eleitoral da Assembleia</p><p class="muted">Grupo com mais cadeiras: ${alliance}</p><p class="muted">Maioria absoluta: ${majority}</p>`;
    }
    return `<div class="compare-detail-block"><p class="map-year-label">Eleição ${year}</p>${html}</div>`;
  }

  function updateMapSelected(uf){
    selectedMapUf = uf;
    const state = ATLAS_DATA.find(s => s.uf === uf);
    if (!state) return;
    $('#map-state-title').textContent = `${state.nome} (${state.uf})`;
    $('#map-state-content').innerHTML = compareEnabled
      ? `<div class="compare-detail-grid">${mapDetailHtml(state,compareYear)}${mapDetailHtml(state,mapYear)}</div>`
      : mapDetailHtml(state,mapYear);
    const openBtn = $('#map-open-detail');
    openBtn.hidden = false;
    openBtn.dataset.uf = uf;

    document.querySelectorAll('#brazil-map .state-shape, #brazil-map-compare .state-shape').forEach(path => {
      path.classList.toggle('is-selected',path.dataset.uf === uf);
    });
    renderSeatDiagram(state);
    syncUrl();
  }

  function seatGroupsFor(item){
    if (!item || !item.total) return [];
    if (Array.isArray(item.grupos) && item.grupos.length) return item.grupos;
    return [{nome:'Em validação',cadeiras:item.total,pendente:true,partidos:[]}];
  }

  function allocateRingCounts(total, rings){
    const radii = Array.from({length:rings},(_,i) => 82 + i * (138 / Math.max(1,rings-1)));
    const sum = radii.reduce((a,b)=>a+b,0);
    const raw = radii.map(r => total*r/sum);
    const counts = raw.map(v => Math.floor(v));
    let remainder = total - counts.reduce((a,b)=>a+b,0);
    const order = raw.map((v,i)=>({i,f:v-Math.floor(v)})).sort((a,b)=>b.f-a.f);
    for (let k=0;k<remainder;k++) counts[order[k%order.length].i]++;
    return {radii,counts};
  }

  function seatGroupColor(group,year=mapYear){
    if (!group || group.pendente) return IDEOLOGY_META.colors['não classificada'];
    const reference = group.partidoReferencia || group.partido || group.federacao || null;
    if (reference) return colorForCategory(reference,[reference],year);
    const parties = Array.isArray(group.partidos) ? group.partidos : partiesFromText(group.nome);
    return colorForCategory(group.nome,parties,year);
  }

  function renderSeatDiagram(state){
    const panel = $('#seat-diagram-panel');
    const svg = $('#seat-diagram');
    const legend = $('#seat-legend');
    const info = $('#seat-info');
    if (!panel || !svg || !legend || !info) return;

    if (mapMode !== 'assembleiaComposicao' || !state) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    const item = state.assembleia[mapYear];
    $('#seat-diagram-title').textContent = `${state.nome} (${state.uf}) · ${mapYear}`;
    svg.innerHTML = '';
    legend.innerHTML = '';

    const totalBig = $('#seat-total-big');
    if (dataStatus(item) || !item.total) {
      if (totalBig) totalBig.textContent = dataStatus(item) === 'nao-localizado' ? 'Não localizado' : dataStatus(item) === 'nao-aplica' ? '—' : 'Em validação';
      info.innerHTML = statusMarkup(item || null,true);
      return;
    }
    if (totalBig) totalBig.textContent = String(item.total);

    const groups = seatGroupsFor(item);
    const expanded = [];
    groups.forEach(group => {
      for (let i=0;i<group.cadeiras;i++) expanded.push(group);
    });
    while (expanded.length < item.total) expanded.push({nome:'Em validação',cadeiras:item.total-expanded.length,pendente:true,partidos:[]});
    if (expanded.length > item.total) expanded.length = item.total;

    const rings = item.total >= 80 ? 5 : item.total >= 55 ? 4 : 3;
    const {radii,counts} = allocateRingCounts(item.total,rings);
    let seatIndex = 0;
    const cx = 260, cy = 252;

    counts.forEach((count,ringIndex) => {
      const r = radii[ringIndex];
      for (let j=0;j<count;j++) {
        const t = count === 1 ? .5 : j/(count-1);
        const angle = Math.PI + t*Math.PI;
        const x = cx + r*Math.cos(angle);
        const y = cy + r*Math.sin(angle);
        const group = expanded[seatIndex++];
        const circle = document.createElementNS(svgNS,'circle');
        circle.setAttribute('cx',x.toFixed(2));
        circle.setAttribute('cy',y.toFixed(2));
        circle.setAttribute('r',item.total >= 85 ? '5.3' : '6.2');
        circle.setAttribute('fill',seatGroupColor(group,mapYear));
        circle.setAttribute('class','seat-dot');
        circle.setAttribute('tabindex','0');
        circle.setAttribute('role','button');
        circle.setAttribute('aria-label',`Cadeira: ${group.nome}`);
        const show = () => {
          const parties = group.partidos?.length ? ` · ${group.partidos.join(', ')}` : '';
          info.textContent = `${group.nome}: ${group.cadeiras} cadeira${group.cadeiras===1?'':'s'}${parties}`;
          svg.querySelectorAll('.seat-dot').forEach(n => n.classList.remove('is-selected'));
          circle.classList.add('is-selected');
        };
        circle.addEventListener('click',show);
        circle.addEventListener('keydown',event => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); show(); }
        });
        svg.appendChild(circle);
      }
    });

    const unique = [];
    groups.forEach(g => { if (!unique.some(x => x.nome === g.nome)) unique.push(g); });
    legend.innerHTML = unique.map(g => `<div class="seat-legend-item"><span class="legend-swatch" style="background:${seatGroupColor(g,mapYear)}"></span><span>${esc(g.nome)}</span><strong>${esc(g.cadeiras)}</strong></div>`).join('');
    info.textContent = `${item.total} cadeiras · clique em uma cadeira para identificar o grupo.`;
  }

  function renderLegend(){
    const categories = new Map();
    ATLAS_DATA.forEach(state => {
      const label = mapCategory(state);
      if (!label) return;
      const key = `${label}|||${colorForState(state)}`;
      const current = categories.get(key) || {label,color:colorForState(state),count:0};
      current.count++;
      categories.set(key,current);
    });
    const items = [...categories.values()].sort((a,b) => a.label.localeCompare(b.label,'pt-BR'));
    $('#map-legend-context').textContent = `${mapYear} · ${mapModeLabel()}`;
    $('#map-legend').innerHTML = `${items.map(item => `<div class="legend-item"><span class="legend-swatch" style="background:${item.color}"></span><span>${esc(item.label)}</span><small>${item.count} ${item.count===1?'UF':'UFs'}</small></div>`).join('')}<div class="legend-item"><span class="legend-swatch pending-swatch"></span><span>Em validação</span></div>`;
  }

  function renderMapSvg(svg,topo,year){
    svg.innerHTML = '';
    const geometries = topo.objects.estados.geometries || [];
    geometries.forEach(geometry => {
      const uf = geometry.id;
      const state = ATLAS_DATA.find(s => s.uf === uf);
      if (!state) return;
      const category = mapCategory(state,year,mapMode);
      const path = document.createElementNS(svgNS,'path');
      path.setAttribute('d',geometryPath(topo,geometry));
      path.setAttribute('fill',colorForState(state,year,mapMode));
      path.setAttribute('class','state-shape');
      path.setAttribute('data-uf',uf);
      path.setAttribute('tabindex','0');
      path.setAttribute('role','button');
      path.setAttribute('aria-label',`${state.nome}: ${category || 'em validação'}`);
      const titleNode = document.createElementNS(svgNS,'title');
      titleNode.textContent = `${state.nome} (${uf}) — ${category || 'Em validação'}`;
      path.appendChild(titleNode);
      path.addEventListener('click',() => updateMapSelected(uf));
      path.addEventListener('keydown',event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          updateMapSelected(uf);
        }
      });
      svg.appendChild(path);
    });
  }

  function updateCompareSummary(){
    const el = $('#compare-summary');
    if (!compareEnabled) { el.hidden = true; return; }
    let comparable = 0, changed = 0;
    ATLAS_DATA.forEach(state => {
      const a = mapCategory(state,compareYear,mapMode);
      const b = mapCategory(state,mapYear,mapMode);
      if (a && b) { comparable++; if (a !== b) changed++; }
    });
    el.hidden = false;
    el.textContent = comparable
      ? `${changed} de ${comparable} UFs com dados nos dois anos apresentam mudança no agrupamento exibido (${compareYear} → ${mapYear}).`
      : `Ainda não há UFs suficientes validadas nos dois anos para resumir ${compareYear} → ${mapYear}.`;
  }

  function updateColorKey(){
    const key = $('#ideology-key');
    const caption = $('#map-caption');
    key.hidden = false;
    caption.textContent = 'Clique ou toque em um Estado para ver o dado correspondente. Na visualização de Governadores, a cor segue a ideologia do partido do candidato eleito; no plenário, a ideologia do partido/federação representado. A microlegenda cromática permanece abaixo do mapa.';
  }

  async function renderMap(){
    renderLegend();
    updateColorKey();
    updateCompareSummary();
    $('#map-primary-year').textContent = String(mapYear);
    $('#map-compare-year-label').textContent = String(compareYear);
    $('#map-compare-grid').classList.toggle('is-comparing',compareEnabled);
    $('#map-compare-frame').hidden = !compareEnabled;
    if (mapMode !== 'assembleiaComposicao') renderSeatDiagram(null);
    const status = $('#map-status');
    try {
      const topo = await ensureMapTopology();
      renderMapSvg($('#brazil-map'),topo,mapYear);
      if (compareEnabled) renderMapSvg($('#brazil-map-compare'),topo,compareYear);
      else $('#brazil-map-compare').innerHTML = '';
      status.hidden = true;
      if (selectedMapUf && ATLAS_DATA.some(s => s.uf === selectedMapUf)) updateMapSelected(selectedMapUf);
      syncUrl();
    } catch (error) {
      $('#brazil-map').innerHTML = '';
      $('#brazil-map-compare').innerHTML = '';
      status.hidden = false;
      status.innerHTML = 'Não foi possível carregar a geometria do mapa. As tabelas continuam funcionando normalmente. <button id="retry-map" type="button">Tentar novamente</button>';
      $('#retry-map')?.addEventListener('click',() => { mapTopology = null; renderMap(); });
    }
  }

  function buildSourceRegistry(){
    const host = $('#methodology-source-list');
    if (!host) return;
    const entries = [];
    const add = (label,url,kind='Fonte oficial') => {
      if (!url) return;
      const key = String(url);
      if (entries.some(e => e.key === key)) return;
      entries.push({key,label,url,kind});
    };

    add('Resultados eleitorais de 2014 — conjunto de dados', SOURCES.tse2014, 'TSE');
    add('Coligações registradas em 2014 — arquivo oficial', SOURCES.colig2014, 'TSE');
    add('Resultados eleitorais de 2018 — conjunto de dados', SOURCES.tse2018, 'TSE');
    add('Coligações registradas em 2018 — arquivo oficial', SOURCES.colig2018, 'TSE');
    add('Resultados eleitorais de 2022 — conjunto de dados', SOURCES.tse2022, 'TSE');
    add('Coligações registradas em 2022 — arquivo oficial', SOURCES.colig2022, 'TSE');
    add('Fim das coligações proporcionais a partir das eleições de 2020', 'https://www.tse.jus.br/comunicacao/noticias/2020/Agosto/fim-das-coligacoes-para-eleicoes-proporcionais-aumenta-as-chances-de-mais-mulheres-na-politica', 'TSE');
    add('Classificação ideológica — referência histórica para 2014', IDEOLOGY_META.source2014, 'Referência acadêmica');
    add('Classificação ideológica — expert survey de 2018', IDEOLOGY_META.source2018, 'Referência acadêmica');
    add('Classificação ideológica — atualização de expert survey para 2022', IDEOLOGY_META.source2022, 'Referência acadêmica');
    add('Deputados estaduais eleitos em 2022 — conferência nacional', SOURCES.aux2022Nacional, 'Fonte complementar');
    add('DF · deputados distritais eleitos em 2022 — conferência nominal', SOURCES.aux2022DF, 'Fonte complementar');
    add('MS · diplomação dos 24 deputados estaduais eleitos em 2022', SOURCES.aux2022MS, 'TRE-MS');
    add('SE · diplomação dos 24 deputados estaduais eleitos em 2022', SOURCES.aux2022SE, 'TRE-SE');
    add('MA · diplomação dos 42 deputados estaduais eleitos em 2022', SOURCES.aux2022MA, 'Assembleia Legislativa do Maranhão');
    add('PA · composição eleita da Assembleia em 2022 — conferência', SOURCES.aux2022PA, 'Fonte complementar');
    add('PB · lista nominal dos 36 deputados estaduais eleitos em 2022 — conferência', SOURCES.aux2022PB, 'Fonte complementar');

    ATLAS_DATA.forEach(state => {
      years.forEach(year => {
        const gov = state.governadores[year];
        const ass = state.assembleia[year];
        if (gov?.source) add(`${state.uf} · Governador · ${year}`, gov.source, 'Fonte específica');
        if (ass?.source) add(`${state.uf} · Assembleia Legislativa · ${year}`, ass.source, 'Fonte específica');
        (gov?.sources || []).forEach((src,i) => add(`${state.uf} · Governador · ${year} · fonte ${i+1}`, src.url || src, src.label || 'Fonte complementar'));
        (ass?.sources || []).forEach((src,i) => add(`${state.uf} · Assembleia Legislativa · ${year} · fonte ${i+1}`, src.url || src, src.label || 'Fonte complementar'));
      });
    });

    host.innerHTML = entries.map(e => `<div class="source-row"><span><b>${esc(e.kind)}</b> · ${esc(e.label)}</span><a href="${esc(e.url)}" target="_blank" rel="noreferrer">Abrir fonte ↗</a></div>`).join('');
  }

  function csvEscape(value){
    const text = String(value ?? '');
    return /[;"\n]/.test(text) ? `"${text.replace(/"/g,'""')}"` : text;
  }

  function downloadCsv(){
    const rows = [];
    if (currentView === 'governadores') {
      rows.push(['UF','Estado',...years.flatMap(y => [`${y} Partido`,`${y} Candidato`,`${y} Coligação`])]);
      ATLAS_DATA.forEach(s => rows.push([s.uf,s.nome,...years.flatMap(y => {
        const i=s.governadores[y]; return i ? [i.partido,i.candidato || '',i.coligacao || ''] : ['','',''];
      })]));
    } else {
      rows.push(['UF','Estado',...years.flatMap(y => [`${y} Maior bancada`,`${y} Cadeiras`,`${y} Total`,`${y} Aliança com mais cadeiras`])]);
      ATLAS_DATA.forEach(s => rows.push([s.uf,s.nome,...years.flatMap(y => {
        const i=s.assembleia[y]; return i ? [i.bancada,i.cadeiras,i.total,i.maiorAlianca?.nome || ''] : ['','','',''];
      })]));
    }
    const csv='\uFEFF'+rows.map(r=>r.map(csvEscape).join(';')).join('\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=`atlas-politico-${currentView}.csv`; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  tabs.forEach(tab => tab.addEventListener('click', () => setView(tab.dataset.view)));
  search.addEventListener('input', renderTable);
  $('#download-csv').addEventListener('click', downloadCsv);
  $('#back-button').addEventListener('click', closeDetail);
  $('#map-mode').addEventListener('change', event => {
    mapMode = event.target.value;
    renderMap();
    if (selectedMapUf) updateMapSelected(selectedMapUf);
  });
  [...document.querySelectorAll('[data-map-year]')].forEach(btn => btn.addEventListener('click', () => {
    mapYear = Number(btn.dataset.mapYear);
    document.querySelectorAll('[data-map-year]').forEach(b => b.classList.toggle('is-active',Number(b.dataset.mapYear)===mapYear));
    renderMap();
    if (selectedMapUf) updateMapSelected(selectedMapUf);
  }));
  $('#compare-toggle').addEventListener('change', event => {
    compareEnabled = event.target.checked;
    $('#compare-year-wrap').hidden = !compareEnabled;
    renderMap();
    if (selectedMapUf) updateMapSelected(selectedMapUf);
  });
  $('#compare-year').addEventListener('change', event => {
    compareYear = Number(event.target.value);
    renderMap();
    if (selectedMapUf) updateMapSelected(selectedMapUf);
  });
  $('#map-open-detail').addEventListener('click',event => {
    const uf = event.currentTarget.dataset.uf;
    if (uf) {
      returnView = 'mapas';
      openDetail(uf);
    }
  });

  const initial = new URLSearchParams(location.search);
  const initialView = ['governadores','assembleias','mapas'].includes(initial.get('view')) ? initial.get('view') : 'governadores';
  const initialYear = Number(initial.get('year'));
  if (years.includes(initialYear)) mapYear = initialYear;
  if (['govPartido','govColigacao','assembleia','assembleiaComposicao'].includes(initial.get('mode'))) mapMode = initial.get('mode');
  const parsedCompare = Number(initial.get('compare'));
  if (years.includes(parsedCompare)) { compareEnabled = true; compareYear = parsedCompare; }
  const initialUf = String(initial.get('uf') || '').toUpperCase();

  $('#map-mode').value = mapMode;
  $('#compare-toggle').checked = compareEnabled;
  $('#compare-year-wrap').hidden = !compareEnabled;
  $('#compare-year').value = String(compareYear);
  document.querySelectorAll('[data-map-year]').forEach(b => b.classList.toggle('is-active',Number(b.dataset.mapYear)===mapYear));

  buildSourceRegistry();

  const hasInitialUf = ATLAS_DATA.some(s => s.uf === initialUf);
  if (initialView === 'mapas' && hasInitialUf) selectedMapUf = initialUf;
  setView(initialView);
  if (hasInitialUf && initialView !== 'mapas') openDetail(initialUf);
})();
