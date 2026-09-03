const farms = {
  cachoeira: {
    name: 'Fazenda Cachoeira',
    plots: [
      ['AR-01',55.85,'2014','Catuaí Amarelo',0,'café'],
      ['AR-04',19.51,'2012','IBC-12',0,'café'],
      ['CA-01',78.22,'2014','Catuaí Vermelho',0,'café'],
      ['CA-02',32.22,'2014','Catuaí Amarelo',0,'café'],
      ['CA-03',40,'','',0,'cereais'],
      ['PA-01',53.97,'2020','IPR-100',0,'café'],
      ['PA-02',22.67,'2022','IPR-100',0,'café'],
      ['PA-03',18.11,'2013','Catuaí Vermelho+',0,'café'],
      ['PA-04',22.55,'2013','Catuaí Vermelho',0,'café'],
      ['SL-01',12.63,'2015','Catuaí Vermelho+',0,'café'],
      ['SL-03',41.91,'2006','Catuaí Amarelo',0,'café'],
      ['TI-01',49.44,'2017','Catuaí Vermelho',0,'café'],
      ['TI-02',13.96,'2019','Catuaí Vermelho',0,'café'],
      ['TI-03',28,'','',0,'citrus'],
      ['TI-04',48.27,'2023','Catuaí Vermelho',0,'café']
    ].map(p=>({code:p[0],area:p[1],year:p[2],variety:p[3],plants:p[4],crop:p[5]||'café'}))
  },
  berrador: {
    name: 'Fazenda Berrador',
    plots: [
      ['BE-01',28,'','',0,'café'],
      ['BE-03A',30,'','',0,'café'],
      ['BE-04',58,'','',0,'café'],
      ['BE-05',28,'','',0,'café'],
      ['BE-06',29,'','',0,'café'],
      ['BE-07',42,'','',0,'café'],
      ['BE-08',44,'','',0,'café'],
      ['BE-11',27,'','',0,'café'],
      ['BE-09',12.7,'','',0,'café']
    ].map(p=>({code:p[0],area:p[1],year:p[2],variety:p[3],plants:p[4],crop:p[5]||'café'}))
  }
};
const $ = id => document.getElementById(id);
const urlParams = new URLSearchParams(window.location.search);
const defaultFarmId = urlParams.get('fazenda') || localStorage.getItem('fazenda-selecionada') || 'cachoeira';
let currentFarm = farms[defaultFarmId] ? defaultFarmId : 'cachoeira';
let plots = farms[currentFarm].plots;
let farmApplications = [];
let syncTimer;
const farmCatalogKey = farmId => `fazenda-${farmId}-product-catalog`;
const getCatalogKey = () => farmCatalogKey(currentFarm);
const publicView = urlParams.get('view') === '1' || urlParams.get('mode') === 'read' || window.location.pathname.includes('visualizacao');

async function loadApplicationsForCurrentFarm(){
  try {
    const response = await fetch(`/api/applications?farm=${encodeURIComponent(currentFarm)}`);
    if (!response.ok) {
      farmApplications = [];
      return;
    }
    const data = await response.json();
    farmApplications = Array.isArray(data) ? data : [];
  } catch (error) {
    farmApplications = [];
  }
}

function currentApplications(){
  return Array.isArray(farmApplications) ? farmApplications : [];
}

const applications = currentApplications;

function getCurrentFarmPlots(){
  return farms[currentFarm].plots;
}

function setCurrentFarm(farmId){
  if (!farms[farmId]) return;
  currentFarm = farmId;
  plots = getCurrentFarmPlots();
  productCatalog = JSON.parse(localStorage.getItem(getCatalogKey()) || 'null') || starterCatalog;
  localStorage.setItem('fazenda-selecionada', farmId);
  const farmSelect = $('farm-select');
  if (farmSelect) farmSelect.value = farmId;
  const farmTitle = $('farm-title');
  if (farmTitle) farmTitle.textContent = farms[farmId].name;
}

async function refreshFarmData(){
  await loadApplicationsForCurrentFarm();
}

function startBackgroundSync(){
  window.clearInterval(syncTimer);
  syncTimer = window.setInterval(async () => {
    await refreshFarmData();
    const selectedPlot = document.querySelector('.history-plot.selected')?.dataset.code || '';
    renderHistory(selectedPlot);
    renderApplicationStatus();
    renderMap();
  }, 20000);
}
function applyPublicReadOnlyLayout(){
  if (!publicView) return;
  const contentGrid = document.querySelector('.content-grid');
  const formPanel = document.querySelector('.form-panel');
  const historyPanel = document.querySelector('.history-panel');
  document.body.classList.add('public-readonly');
  if (formPanel) formPanel.style.display = 'none';
  if (contentGrid && historyPanel && !contentGrid.dataset.publicViewAdjusted) {
    contentGrid.classList.add('single-column');
    contentGrid.dataset.publicViewAdjusted = 'true';
  }
  const historyActions = document.querySelector('.history-actions');
  if (historyActions) historyActions.style.display = 'none';
  const exportButton = document.getElementById('export-history');
  const clearButton = document.getElementById('clear-history');
  if (exportButton) exportButton.style.display = 'none';
  if (clearButton) clearButton.style.display = 'none';
  const form = document.getElementById('application-form');
  if (form) form.remove();
  if (historyPanel && historyPanel.dataset.moved) {
    historyPanel.dataset.moved = 'false';
  }
  let styleTag = document.getElementById('public-readonly-styles');
  if (styleTag) styleTag.remove();
}
const starterCatalog=[
  {commercial:'Aureo',active:'Éster metílico de soja',manufacturer:'Bayer'},
  {commercial:'Heat',active:'Saflufenacil',manufacturer:'BASF'},
  {commercial:'Joint Oil',active:'Óleo vegetal',manufacturer:'AllierBrasil'},
  {commercial:'Roundup Original DI',active:'Glifosato',manufacturer:'Bayer'},
  {commercial:'Nativo',active:'Trifloxistrobina + Tebuconazol',manufacturer:'Bayer'},
  {commercial:'Opera',active:'Piraclostrobina + Epoxiconazol',manufacturer:'BASF'},
  {commercial:'Abamex',active:'Abamectina',manufacturer:'Nortox'},
  {commercial:'Vertimec',active:'Abamectina',manufacturer:'Syngenta'},
  {commercial:'Amistar Top',active:'Azoxistrobina + Difenoconazol',manufacturer:'Syngenta'},
  {commercial:'Sulfato de Zinco',active:'Zinco',manufacturer:'Diversos'},
  {commercial:'Cloreto de Potássio',active:'Potássio',manufacturer:'Diversos'},
  {commercial:'Calcinit',active:'Nitrato de cálcio',manufacturer:'Yara'}
];
let productCatalog=JSON.parse(localStorage.getItem(getCatalogKey())||'null')||starterCatalog;
const formatNumber = (n, digits=2) => Number(n).toLocaleString('pt-BR',{minimumFractionDigits:digits,maximumFractionDigits:digits});
const normalizeText = (value='') => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const formatCropLabel = crop => {
  const value = normalizeText(crop || '').replace(/\s+/g, '');
  if (value === 'cereais' || value === 'cereal') return 'Cereais';
  if (value === 'citrus') return 'Citrus';
  return 'Café';
};
const findCatalogMatch = query => {
  const key = normalizeText(query);
  if (!key) return null;
  return productCatalog.find(item => {
    const haystack = [item.commercial, item.active, item.manufacturer].join(' ');
    return normalizeText(haystack).includes(key);
  }) || null;
};
function renderMap(){const applied=new Set(currentApplications().map(item=>item.plot));$('plot-map').innerHTML=plots.map(p=>`<button type="button" class="map-plot ${p.crop==='citrus'?'citrus ':''}${applied.has(p.code)?'applied':''}" data-code="${p.code}"><strong>${p.code}</strong><span class="map-area">${p.area?formatNumber(p.area)+' ha':'Área não informada'}</span><small>${p.crop==='citrus'?'Citrus':p.variety||'Variedade não informada'}</small><small>${applied.has(p.code)?'Aplicado':'Sem aplicação'}</small></button>`).join('');$('plot-map').querySelectorAll('.map-plot').forEach(tile=>tile.onclick=()=>{$('plot').value=tile.dataset.code;updateTotal();$('plot').scrollIntoView({behavior:'smooth',block:'center'});});$('map-help').innerHTML=applied.size?`<strong>${applied.size} talhão(ões) marcado(s)</strong> com aplicação registrada. Clique em uma área para lançar outra.`:'Registre uma aplicação para marcar o talhão neste mapa.';}
async function setup(){
  plots = getCurrentFarmPlots();
  await refreshFarmData();
  const headerDate = $('header-date');
  if (headerDate) headerDate.textContent = new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'});

  const farmTitle = $('farm-title');
  if (farmTitle) farmTitle.textContent = farms[currentFarm].name;

  const farmSelect = $('farm-select');
  if (farmSelect) {
    farmSelect.value = currentFarm;
    farmSelect.onchange = (event) => {
      setCurrentFarm(event.target.value);
      setup();
    };
  }

  const plotSelect = $('plot');
  const applicationForm = $('application-form');
  const addProductBtn = $('add-product');
  const exportHistoryBtn = $('export-history');
  const clearHistoryBtn = $('clear-history');
  const showCheckBtn = $('show-check');
  const dateField = $('date');

  if (dateField) dateField.value = new Date().toISOString().slice(0,10);

  const totalArea = plots.reduce((sum, p) => sum + Number(p.area || 0), 0);
  if (plotSelect) {
    plotSelect.innerHTML = plots.map(p => `<option value="${p.code}">${p.code} · ${formatCropLabel(p.crop)} · ${p.area ? formatNumber(p.area) + ' ha' : ''}</option>`).join('');
    plotSelect.onchange = updateTotal;
  }

  const plotList = $('plot-list');
  if (plotList) {
    plotList.innerHTML = plots.map(p => `<article class="plot-card" data-code="${p.code}"><div class="plot-card-head"><strong>${p.code}</strong><span class="crop-tag ${p.crop === 'citrus' ? 'citrus' : ''}">${formatCropLabel(p.crop)}</span></div><small>${p.area ? formatNumber(p.area) + ' ha' : 'Área não informada'}</small></article>`).join('');
    plotList.querySelectorAll('.plot-card').forEach(card => {
      card.onclick = () => {
        if (plotSelect) plotSelect.value = card.dataset.code;
        updateTotal();
        plotList.querySelectorAll('.plot-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      };
    });
  }

  const plotCount = $('plot-count');
  if (plotCount) plotCount.textContent = `${plots.length} áreas`;

  const totalAreaEl = document.getElementById('total-area');
  if (totalAreaEl) totalAreaEl.textContent = `${formatNumber(totalArea)} ha`;

  const totalAreaNote = document.querySelector('.metric:nth-child(1) .metric-note');
  if (totalAreaNote) totalAreaNote.textContent = `${plots.length} talhões cadastrados`;

  if (applicationForm) applicationForm.onsubmit = saveApplication;
  if (clearHistoryBtn) clearHistoryBtn.onclick = clearHistory;
  if (addProductBtn) addProductBtn.onclick = addProductLine;
  if (exportHistoryBtn) exportHistoryBtn.onclick = exportHistory;
  if (showCheckBtn) showCheckBtn.onclick = toggleApplicationCheck;

  const productLines = document.querySelectorAll('.product-line');
  productLines.forEach(bindProductLine);

  if (publicView) {
    applyPublicReadOnlyLayout();
    const defaultPlot = currentApplications().find(item => item.plot)?.plot || plots[0].code;
    renderHistory(defaultPlot);
    renderApplicationStatus();
    updateTotal();
    startBackgroundSync();
    return;
  }

  renderHistory();
  renderApplicationStatus();
  updateTotal();
  startBackgroundSync();
}
function bindProductLine(line){const product=line.querySelector('.product');product.oninput=updateTotal;line.querySelector('.total-used').oninput=updateTotal;line.querySelector('.dose').oninput=updateTotal;}
function addProductLine(){const line=document.querySelector('.product-line').cloneNode(true);line.querySelectorAll('input').forEach(input=>input.value='');line.querySelector('.line-total').textContent='0,00';line.querySelector('.remove-product').hidden=false;line.querySelector('.remove-product').onclick=()=>{line.remove();updateTotal()};bindProductLine(line);line.querySelector('.product').focus();$('product-lines').appendChild(line);}
function renderApplicationStatus(){const all=currentApplications();const today=new Date();const cards=plots.map(plot=>{const latest=all.filter(item=>item.plot===plot.code).sort((a,b)=>b.date.localeCompare(a.date))[0];if(!latest)return `<div class="status-card pending"><strong>${plot.code}</strong><small>Sem aplicação registrada</small></div>`;const appliedDate=new Date(`${latest.date}T12:00:00`);const days=Math.max(0,Math.floor((today-appliedDate)/86400000));const status=days>15?'overdue':'recent';return `<div class="status-card ${status}"><strong>${plot.code}</strong><small>${days===0?'Aplicado hoje':`Aplicado há ${days} dia(s)`}</small><span>${status==='overdue'?'Mais de 20 dias':'Dentro de 15 dias'}</span></div>`;}).join('');$('application-status').innerHTML='<div class="status-heading"><span>Status das aplicações</span></div><div class="status-grid">'+cards+'</div><div class="status-legend"><small><i class="status-dot recent"></i>Até 15 dias <i class="status-dot overdue"></i>Mais de 20 dias</small></div>';}
function renderCatalogOptions(){const options=[...new Map(productCatalog.map(item=>[item.commercial,item])).values()];document.querySelectorAll('#product-options').forEach(list=>list.innerHTML=options.map(item=>`<option value="${item.commercial}">${item.active} · ${item.manufacturer}</option>`).join(''));document.querySelectorAll('.catalog-status').forEach(status=>status.textContent=productCatalog.length?`${options.length} produtos disponíveis para pesquisa.`:'Carregue a lista de produtos para pesquisar.');}
function parseCatalog(text){return text.split(/\r?\n/).slice(1).map(line=>line.split(';')).filter(parts=>parts.length>=3&&parts[0].trim()).map(parts=>({commercial:parts[0].trim(),active:parts[1].trim().replace(/�/g,'í'),manufacturer:parts[2].trim()}));}
function loadCatalog(event){const file=event.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const text=new TextDecoder('windows-1252').decode(reader.result);productCatalog=parseCatalog(text);localStorage.setItem(catalogKey,JSON.stringify(productCatalog));renderCatalogOptions();};reader.onerror=()=>document.querySelectorAll('.catalog-status').forEach(status=>status.textContent='Não foi possível ler o arquivo CSV.');reader.readAsArrayBuffer(file);}
function loadDefaultCatalog(){if(productCatalog.length)return;fetch('lista-produtos.csv').then(response=>response.ok?response.arrayBuffer():Promise.reject()).then(buffer=>{const text=new TextDecoder('windows-1252').decode(buffer);productCatalog=parseCatalog(text);if(!productCatalog.length)throw new Error('Catálogo vazio');localStorage.setItem(catalogKey,JSON.stringify(productCatalog));renderCatalogOptions();}).catch(()=>{productCatalog=starterCatalog;renderCatalogOptions();});}
function renderApplicationCheck(){const p=plots.find(x=>x.code===$('plot').value);const rows=[...document.querySelectorAll('.product-line')].map(line=>{const name=line.querySelector('.product').value.trim()||'Produto não informado';const unit=line.querySelector('.unit').value;const total=Number(line.querySelector('.total-used').value)||0;const dose=Number(line.querySelector('.dose').value)||0;return `<div class="check-row"><strong>${name}</strong><span>Total usado: ${formatNumber(total)} ${unit}</span><span>Dose por hectare: <b>${formatNumber(dose)} ${unit}/ha</b></span></div>`;}).join('');$('application-check').innerHTML=`<div class="check-heading"><strong>Conferência</strong><small>${p?`${p.code} · ${formatNumber(p.area)} ha`:'Selecione um talhão'}</small></div>${rows||'<small>Adicione um produto para conferir as quantidades.</small>'}`;}
function toggleApplicationCheck(){const panel=$('application-check');panel.hidden=!panel.hidden;if(!panel.hidden)renderApplicationCheck();}
function updateTotal(){
  const plotSelect = $('plot');
  if (!plotSelect) return;
  const p = plots.find(x => x.code === plotSelect.value);
  const productLines = document.querySelectorAll('.product-line');
  productLines.forEach(line => {
    const totalElement = line.querySelector('.line-total');
    if (totalElement) totalElement.textContent = formatNumber(Number(line.querySelector('.dose').value) || 0);
  });
  const applicationCheck = $('application-check');
  if (applicationCheck && !applicationCheck.hidden) renderApplicationCheck();
}
async function saveApplication(event){
  event.preventDefault();
  const p=plots.find(x=>x.code===$('plot').value);
  const products=[...document.querySelectorAll('.product-line')].map(line=>({product:line.querySelector('.product').value,unit:line.querySelector('.unit').value,dose:Number(line.querySelector('.dose').value)||0,totalUsed:Number(line.querySelector('.total-used').value)||0})).filter(item=>item.product);
  const item={date:$('date').value,plot:p.code,crop:p.crop,type:$('type').value,products,responsible:$('responsible').value,notes:$('notes').value,farm:currentFarm};
  try {
    const response = await fetch('/api/applications', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Falha ao salvar');
    await refreshFarmData();
  } catch (error) {
    alert('Não foi possível sincronizar o lançamento. Verifique sua conexão e tente novamente.');
    return;
  }
  event.target.reset();
  $('product-lines').innerHTML=document.querySelector('.product-line').outerHTML;
  document.querySelector('.remove-product').hidden=true;
  bindProductLine(document.querySelector('.product-line'));
  $('date').value=new Date().toISOString().slice(0,10);
  renderHistory();
  renderApplicationStatus();
  updateTotal();
}
function renderHistory(selectedPlot=''){const all=applications();$('application-count').textContent=all.length;const plotsWithRecords=new Set(all.map(item=>item.plot));$('history-plots').innerHTML=plots.map(p=>`<button type="button" class="history-plot ${selectedPlot===p.code?'selected ':''}${plotsWithRecords.has(p.code)?'has-records':''}" data-code="${p.code}"><strong>${p.code}</strong><small>${p.area?formatNumber(p.area)+' ha':'28,00 ha'} · ${p.crop}</small><span>${all.filter(item=>item.plot===p.code).length} registro(s)</span></button>`).join('');$('history-plots').querySelectorAll('.history-plot').forEach(button=>button.onclick=()=>renderHistory(button.dataset.code));if(!selectedPlot){$('history').className='history-empty';$('history').innerHTML='Clique em um talhão para ver as aplicações detalhadas.<br><span>Cada lote tem seu próprio histórico.</span>';return}const plot=plots.find(item=>item.code===selectedPlot);const list=all.filter(item=>item.plot===selectedPlot);if(!list.length){$('history').className='history-empty';$('history').innerHTML=`Nenhuma aplicação registrada no ${selectedPlot}.<br><span>${plot?.crop||''} · ${plot?.area?formatNumber(plot.area)+' ha':'área do mapa'}</span>`;return}$('history').className='history-list';$('history').innerHTML=`<div class="history-detail-heading"><div><span class="eyebrow">TALHÃO SELECIONADO</span><h3>${selectedPlot}</h3></div><strong>${plot?.area?formatNumber(plot.area):'28,00'} ha · ${plot?.crop}</strong></div>`+list.map(item=>{const products=item.products||[{product:item.product,unit:item.unit,dose:item.dose,total:item.total}];const names=products.map(product=>product.product).join(', ');const doses=products.map(product=>`${formatNumber(product.dose)} ${product.unit}`).join(' · ');const total=products.reduce((sum,product)=>sum+(plot?.area?product.dose*plot.area:0),0);return `<div class="history-row"><small>${new Date(item.date+'T12:00:00').toLocaleDateString('pt-BR')}</small><div><strong>${names}</strong><small>${item.type} · ${item.responsible||'Sem responsável'}</small></div><div><small>Doses</small><br><strong>${doses}</strong></div><div class="history-dose">${formatNumber(total)} total</div><small>${item.notes||'Sem observações'}</small></div>`}).join('');}
async function clearHistory(){
  if(confirm('Apagar todo o histórico desta fazenda?')){
    const response = await fetch(`/api/applications?farm=${encodeURIComponent(currentFarm)}`, {method:'DELETE'});
    if (!response.ok) {
      alert('Não foi possível limpar o histórico.');
      return;
    }
    await refreshFarmData();
    renderHistory();
    renderApplicationStatus();
  }
}
function renderHistory(selectedPlot='') {
  const all = currentApplications();
  $('application-count').textContent = all.length;
  const plotsWithRecords = new Set(all.map(item => item.plot));
  $('history-plots').innerHTML = plots.map(plot => `<button type="button" class="history-plot ${selectedPlot === plot.code ? 'selected ' : ''}${plotsWithRecords.has(plot.code) ? 'has-records' : ''}" data-code="${plot.code}"><strong>${plot.code}</strong><small>${formatNumber(plot.area)} ha · ${plot.crop}</small><span>${all.filter(item => item.plot === plot.code).length} registro(s)</span></button>`).join('');
  $('history-plots').querySelectorAll('.history-plot').forEach(button => button.onclick = () => renderHistory(button.dataset.code));
  if (!selectedPlot) {
    $('history').className = 'history-empty';
    $('history').innerHTML = 'Clique em um talhão para ver as aplicações detalhadas.<br><span>Cada lote tem seu próprio histórico.</span>';
    return;
  }
  const plot = plots.find(item => item.code === selectedPlot);
  const records = all.filter(item => item.plot === selectedPlot);
  if (!records.length) {
    $('history').className = 'history-empty';
    $('history').innerHTML = `Nenhuma aplicação registrada no ${selectedPlot}.`;
    return;
  }
  $('history').className = 'history-list';
  $('history').innerHTML = `<div class="history-detail-heading"><div><span class="eyebrow">TALHÃO SELECIONADO</span><h3>${selectedPlot}</h3></div><strong>${formatNumber(plot.area)} ha · ${plot.crop}</strong></div>` + records.map(item => {
    const products = item.products || [];
    return `<article class="history-row"><small>${new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR')}</small><div><strong>${item.type || 'Aplicação'}</strong><small>${item.responsible || 'Sem responsável'}</small></div><div class="history-products"><table class="history-products-table"><thead><tr><th>Produto</th><th>Quantidade hectare</th><th>Total</th></tr></thead><tbody>${products.map(product => { const dose = Number(product.dose) || 0; const total = product.totalUsed ?? dose * Number(plot.area || 0); const unit = product.unit || 'kg'; return `<tr><td>${product.product || 'Produto não informado'}</td><td>${formatNumber(dose)} ${unit}/ha</td><td>${formatNumber(total)} ${unit}</td></tr>`; }).join('')}</tbody></table></div></article>`;
  }).join('');
}

function excelCell(value){return `<Cell><Data ss:Type="String">${String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</Data></Cell>`;}
function excelSheet(name,headers,rows){return `<Worksheet ss:Name="${name.substring(0,31)}"><Table><Row>${headers.map(excelCell).join('')}</Row>${rows.map(row=>`<Row>${row.map(excelCell).join('')}</Row>`).join('')}</Table></Worksheet>`;}
function exportSelectedPlotHistory(plotCode){const plot=plots.find(item=>item.code===plotCode);if(!plot)return;const all=applications().filter(item=>item.plot===plotCode);const rows=[];const products = all.flatMap(item => (item.products||[{product:item.product,unit:item.unit,dose:item.dose}]).map(product => ({product:product.product || 'Produto não informado', dose:Number(product.dose)||0, total: plot.area ? (Number(product.dose)||0) * plot.area : 0, unit: product.unit || 'kg/ha'})));if(!products.length){rows.push(['Sem registro',0,0]);}else{products.forEach(product=>rows.push([product.product,product.dose,product.total]));}const xml=`<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Default"><Font ss:FontName="Arial"/></Style></Styles>${excelSheet(plotCode,['Produto','Quantidade por bomba','Total usado'],rows)}</Workbook>`;const blob=new Blob([xml],{type:'application/vnd.ms-excel'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`${plotCode}-historico.xls`;link.click();URL.revokeObjectURL(link.href);} 
function exportHistory(){const selected=$('history-plots')?.querySelector('.history-plot.selected')?.dataset.code || $('plot')?.value; if(selected){ exportSelectedPlotHistory(selected); return; } const all=applications();const sheets=[];sheets.push(excelSheet('Resumo',['Talhão','Área (ha)','Cultura','Variedade','Registros'],plots.map(p=>[p.code,p.area||28,p.crop,p.variety||'',all.filter(item=>item.plot===p.code).length])));const rows=[];all.forEach(item=>(item.products||[{product:item.product,unit:item.unit,dose:item.dose}]).forEach(product=>rows.push([item.date,item.plot,item.crop,item.type,product.product,product.dose,product.unit,item.responsible||'',item.notes||''])));sheets.push(excelSheet('Historico geral',['Data','Talhão','Cultura','Tipo','Nome comercial','Dose/ha','Unidade','Responsável','Observações'],rows));plots.forEach(p=>{const plotRows=[];all.filter(item=>item.plot===p.code).forEach(item=>(item.products||[{product:item.product,unit:item.unit,dose:item.dose}]).forEach(product=>{const dose=Number(product.dose)||0;const total=p.area?dose*p.area:0;plotRows.push([product.product||'Produto não informado',dose,total]);}));if(!plotRows.length){plotRows.push(['Sem registro',0,0]);}sheets.push(excelSheet(p.code,['Produto','Quantidade por bomba','Total usado'],plotRows));});const xml=`<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Default"><Font ss:FontName="Arial"/></Style></Styles>${sheets.join('')}</Workbook>`;const blob=new Blob([xml],{type:'application/vnd.ms-excel'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='Fazenda-Cachoeira-Historico.xls';link.click();URL.revokeObjectURL(link.href);}
setup();
