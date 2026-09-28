
const $ = id => document.getElementById(id);

const EQUIPMENT_OPTIONS = [
  { key:'combustion', label:'Montacargas combustión' },
  { key:'electrico', label:'Montacargas eléctrico' },
  { key:'ex', label:'Montacargas EX' },
  { key:'orderpicker', label:'Order picker' },
  { key:'apilador', label:'Apilador' },
  { key:'handpallet', label:'Hand pallet eléctrico' }
];

const state = {
  stream: null,
  photo: '',
  theme: '#0a57a7',
  themeDark: '#053a75',
  editingId: null,
  search: ''
};

const isForkliftType = type => type === 'Montacarguista';

function toast(message){
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

function dateToInput(date){
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}

function formatDate(value){
  if(!value) return '--/--/----';
  const [y,m,d] = value.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateShortMonth(value){
  if(!value) return '---';
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const [y,m] = value.split('-');
  return `${months[parseInt(m,10)-1]} ${y}`;
}

function setDefaultDates(){
  const today = new Date();
  const expiry = new Date(today);
  expiry.setFullYear(expiry.getFullYear()+1);
  $('emision').value = dateToInput(today);
  $('vencimiento').value = dateToInput(expiry);
}

function isExpired(value){
  if(!value) return false;
  const today = new Date();
  today.setHours(0,0,0,0);
  const expiry = new Date(`${value}T00:00:00`);
  return expiry < today;
}

function getFullName(){
  return `${$('nombres').value.trim()} ${$('apellidos').value.trim()}`.trim();
}

function selectedEquipment(){
  return [...document.querySelectorAll('.equipo-check:checked')].map(i => i.value);
}

function updateTheme(){
  document.documentElement.style.setProperty('--theme', state.theme);
  document.documentElement.style.setProperty('--theme-dark', state.themeDark);
}

function updatePhoto(data){
  state.photo = data || '';
  ['formPhoto','badgePhoto'].forEach(id => {
    const img = $(id);
    img.src = state.photo;
    img.style.display = state.photo ? 'block' : 'none';
  });
  $('formPhotoPlaceholder').style.display = state.photo ? 'none' : 'inline';
  $('badgePhotoPlaceholder').style.display = state.photo ? 'none' : 'inline';
}

function updateForkliftVisibility(){
  const forklift = isForkliftType($('tipo').value);
  $('montacargasBox').style.display = forklift ? 'block' : 'none';
  $('equipmentGrid').style.display = forklift ? 'grid' : 'none';
  $('generalAuthorization').style.display = forklift ? 'none' : 'flex';
  $('generalBrandImage').style.display = forklift ? 'none' : 'flex';
  $('backSectionTitle').textContent = forklift ? 'TIPO(S) DE EQUIPO AUTORIZADO(S)' : 'AUTORIZACIÓN / ALCANCE';
}

function updateEquipmentPreview(){
  const selected = selectedEquipment();
  document.querySelectorAll('.equipment-card').forEach(card => {
    card.classList.toggle('active', selected.includes(card.dataset.equip));
  });
}

function updatePreview(){
  const fullName = (getFullName() || 'NOMBRE APELLIDO').toUpperCase();
  $('badgeName').textContent = fullName;
  if(fullName.length > 24){ $('badgeName').style.fontSize = '14px'; }
  else if(fullName.length > 18){ $('badgeName').style.fontSize = '15px'; }
  else { $('badgeName').style.fontSize = '16px'; }

  const tipo = $('tipo').value;
  const cargo = $('cargo').value.trim() || tipo;
  const expired = isExpired($('vencimiento').value);
  const statusText = expired ? 'VENCIDO' : 'VIGENTE';

  $('frontMainTitle').textContent = isForkliftType(tipo) ? 'VEHÍCULOS INDUSTRIALES' : 'CARNET AUTORIZADO';
  $('frontTypeStrip').textContent = isForkliftType(tipo) ? 'MOTORIZADOS' : tipo.toUpperCase();
  $('frontMainTitle').style.fontSize = isForkliftType(tipo) ? '16px' : '';
  $('frontTypeStrip').style.fontSize = isForkliftType(tipo) ? '19px' : ((tipo.length > 18) ? '16px' : '21px');

  $('badgeArea').textContent = $('area').value || '---';
  $('badgeBlood').textContent = $('sangre').value || '---';
  $('badgeCodigo').textContent = $('codigo').value.trim() || $('cedula').value.trim() || '---';
  $('codigoLabel').textContent = $('codigo').value.trim() ? 'NO. EMPLEADO:' : 'CÉDULA:';
  $('badgeRange').textContent = `${formatDateShortMonth($('emision').value)} - ${formatDateShortMonth($('vencimiento').value)}`;
  $('badgeStatusText').textContent = statusText;
  $('badgeStatusText').style.background = expired ? '#d92d28' : '#16a34a';
  $('activityText').textContent = cargo;

  $('generalAuthType').textContent = tipo.toUpperCase();
  $('generalAuthText').textContent = `Carnet interno válido para: ${cargo}. Empresa: ${$('empresa').value.trim() || 'N/D'}.`;

  updateForkliftVisibility();
  updateEquipmentPreview();
}

function compressImage(file){
  return new Promise((resolve,reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const ratioTarget = 4/5;
        const ratioSource = img.width / img.height;
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        if(ratioSource > ratioTarget){
          sw = img.height * ratioTarget;
          sx = (img.width - sw) / 2;
        }else{
          sh = img.width / ratioTarget;
          sy = (img.height - sh) / 2;
        }
        const canvas = document.createElement('canvas');
        canvas.width = 360;
        canvas.height = 450;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg',0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

$('photoUpload').addEventListener('change', async event => {
  const file = event.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')) return toast('Selecciona una imagen válida.');
  try {
    const data = await compressImage(file);
    updatePhoto(data);
    toast('Fotografía cargada.');
  } catch(error) {
    toast('No se pudo procesar la imagen.');
  }
});

$('cameraOpen').addEventListener('click', async () => {
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    return toast('La cámara requiere HTTPS y un navegador compatible.');
  }
  try{
    if(state.stream) state.stream.getTracks().forEach(t => t.stop());
    state.stream = await navigator.mediaDevices.getUserMedia({ video:{facingMode:'user', width:{ideal:1280}, height:{ideal:960}}, audio:false });
    $('cameraVideo').srcObject = state.stream;
    $('cameraBox').style.display = 'block';
  }catch(error){
    toast('No se pudo abrir la cámara. Revisa los permisos del navegador.');
  }
});

function closeCamera(){
  if(state.stream){
    state.stream.getTracks().forEach(t => t.stop());
    state.stream = null;
  }
  $('cameraVideo').srcObject = null;
  $('cameraBox').style.display = 'none';
}
$('cameraClose').addEventListener('click', closeCamera);

$('cameraCapture').addEventListener('click', () => {
  const video = $('cameraVideo');
  if(!video.videoWidth) return toast('Espera a que la cámara termine de cargar.');
  const canvas = $('cameraCanvas');
  const ctx = canvas.getContext('2d');
  const ratioTarget = 4/5;
  const ratioSource = video.videoWidth / video.videoHeight;
  let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
  if(ratioSource > ratioTarget){
    sw = video.videoHeight * ratioTarget;
    sx = (video.videoWidth - sw) / 2;
  }else{
    sh = video.videoWidth / ratioTarget;
    sy = (video.videoHeight - sh) / 2;
  }
  canvas.width = 360;
  canvas.height = 450;
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  updatePhoto(canvas.toDataURL('image/jpeg',0.82));
  closeCamera();
  toast('Fotografía capturada.');
});

[...document.querySelectorAll('.color-dot')].forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    state.theme = button.dataset.color;
    state.themeDark = button.dataset.dark;
    updateTheme();
  });
});

['nombres','apellidos','cedula','codigo','empresa','cargo','area','sangre','tipo','emision','vencimiento','emergencyPhone','ehsEmail'].forEach(id => {
  $(id).addEventListener('input', updatePreview);
  $(id).addEventListener('change', updatePreview);
});
document.querySelectorAll('.equipo-check').forEach(chk => {
  chk.addEventListener('change', updatePreview);
});

function getHistory(){
  try{return JSON.parse(localStorage.getItem('ehsCarnets') || '[]');}catch(error){return [];}
}
function saveHistory(history){ localStorage.setItem('ehsCarnets', JSON.stringify(history)); }

function formRecord(){
  return {
    id: state.editingId || Date.now(),
    nombres: $('nombres').value.trim(),
    apellidos: $('apellidos').value.trim(),
    cedula: $('cedula').value.trim(),
    codigo: $('codigo').value.trim(),
    empresa: $('empresa').value.trim(),
    cargo: $('cargo').value.trim(),
    area: $('area').value,
    sangre: $('sangre').value,
    tipo: $('tipo').value,
    emision: $('emision').value,
    vencimiento: $('vencimiento').value,
    emergencyPhone: $('emergencyPhone').value.trim(),
    ehsEmail: $('ehsEmail').value.trim(),
    equipment: selectedEquipment(),
    photo: state.photo,
    theme: state.theme,
    themeDark: state.themeDark,
    savedAt: new Date().toISOString()
  };
}

function validateForm(){
  const required = ['nombres','apellidos','cedula','empresa','cargo','emision','vencimiento'];
  for(const id of required){
    if(!$(id).value.trim()){
      $(id).focus();
      toast('Completa todos los campos obligatorios.');
      return false;
    }
  }
  if(isForkliftType($('tipo').value) && selectedEquipment().length === 0){
    toast('Selecciona al menos un tipo de equipo para el montacarguista.');
    return false;
  }
  return true;
}

$('saveBtn').addEventListener('click', () => {
  if(!validateForm()) return;
  const record = formRecord();
  const history = getHistory();
  const existing = history.findIndex(item => item.id === record.id);
  if(existing >= 0) history[existing] = record; else history.unshift(record);
  saveHistory(history.slice(0,100));
  state.editingId = record.id;
  renderHistory();
  renderReports();
  toast('Carnet guardado en el historial.');
});

function clearEquipment(){
  document.querySelectorAll('.equipo-check').forEach(chk => chk.checked = false);
}

function clearForm(){
  state.editingId = null;
  $('nombres').value = '';
  $('apellidos').value = '';
  $('cedula').value = '';
  $('codigo').value = '';
  $('empresa').value = 'Sherwin-Williams';
  $('cargo').value = '';
  $('area').selectedIndex = 0;
  $('sangre').value = 'O+';
  $('tipo').value = 'Contratista';
  $('emergencyPhone').value = '+593 99 123 4567';
  $('ehsEmail').value = 'ehs@condor.com.ec';
  setDefaultDates();
  clearEquipment();
  updatePhoto('');
  state.theme = '#0a57a7';
  state.themeDark = '#053a75';
  document.querySelectorAll('.color-dot').forEach((button,index) => button.classList.toggle('active', index === 0));
  updateTheme();
  updatePreview();
  toast('Formulario limpio.');
}
$('clearBtn').addEventListener('click', clearForm);

function loadRecord(id){
  const record = getHistory().find(item => item.id === id);
  if(!record) return;
  state.editingId = record.id;
  $('nombres').value = record.nombres || '';
  $('apellidos').value = record.apellidos || '';
  $('cedula').value = record.cedula || '';
  $('codigo').value = record.codigo || '';
  $('empresa').value = record.empresa || '';
  $('cargo').value = record.cargo || '';
  $('area').value = record.area || $('area').options[0].value;
  $('sangre').value = record.sangre || 'O+';
  $('tipo').value = record.tipo || 'Contratista';
  $('emision').value = record.emision || '';
  $('vencimiento').value = record.vencimiento || '';
  $('emergencyPhone').value = record.emergencyPhone || '';
  $('ehsEmail').value = record.ehsEmail || '';
  document.querySelectorAll('.equipo-check').forEach(chk => chk.checked = (record.equipment || []).includes(chk.value));
  state.theme = record.theme || '#0a57a7';
  state.themeDark = record.themeDark || '#053a75';
  updateTheme();
  updatePhoto(record.photo || '');
  document.querySelectorAll('.color-dot').forEach(button => button.classList.toggle('active', button.dataset.color === state.theme));
  updatePreview();
  showPage('generator');
  toast('Carnet cargado.');
}
window.loadRecord = loadRecord;

function deleteRecord(id){
  if(!confirm('¿Deseas eliminar este carnet del historial?')) return;
  const history = getHistory().filter(item => item.id !== id);
  saveHistory(history);
  renderHistory();
  renderReports();
}
window.deleteRecord = deleteRecord;

function escapeHtml(value){
  return String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
}

function equipmentSummary(record){
  return (record.equipment || []).map(key => EQUIPMENT_OPTIONS.find(item => item.key === key)?.label).filter(Boolean).join(', ');
}

function renderHistory(){
  const search = state.search.trim().toLowerCase();
  const history = getHistory().filter(record => {
    const searchable = [record.nombres, record.apellidos, record.cedula, record.codigo, record.empresa, record.cargo, record.area, record.tipo, equipmentSummary(record)].join(' ').toLowerCase();
    return !search || searchable.includes(search);
  });
  if(!history.length){
    $('historyContent').innerHTML = `<div class="empty">${search ? 'No se encontraron carnets con esa búsqueda.' : 'Aún no hay carnets guardados.'}</div>`;
    return;
  }
  $('historyContent').innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>Nombre</th><th>Cédula</th><th>Empresa</th><th>Tipo</th><th>Área</th><th>Vencimiento</th><th>Equipos</th><th>Estado</th><th>Acciones</th></tr></thead>
      <tbody>
      ${history.map(record => {
        const expired = isExpired(record.vencimiento);
        return `<tr>
          <td>${escapeHtml(`${record.nombres} ${record.apellidos}`)}</td>
          <td>${escapeHtml(record.cedula)}</td>
          <td>${escapeHtml(record.empresa)}</td>
          <td>${escapeHtml(record.tipo)}</td>
          <td>${escapeHtml(record.area)}</td>
          <td>${formatDate(record.vencimiento)}</td>
          <td>${escapeHtml(equipmentSummary(record) || '—')}</td>
          <td><span class="status-pill ${expired ? 'expired' : ''}">${expired ? 'Vencido' : 'Vigente'}</span></td>
          <td><div class="row-actions">
            <button class="mini-btn" onclick="loadRecord(${record.id})">Ver / editar</button>
            <button class="mini-btn" onclick="printStored(${record.id})">Imprimir</button>
            <button class="mini-btn" onclick="deleteRecord(${record.id})">Eliminar</button>
          </div></td>
        </tr>`;
      }).join('')}
      </tbody>
    </table></div>`;
}

function showPage(page){
  document.querySelectorAll('.page').forEach(section => section.classList.remove('active'));
  document.querySelectorAll('.menu-btn').forEach(button => button.classList.remove('active'));
  $(`page-${page}`).classList.add('active');
  document.querySelector(`.menu-btn[data-page="${page}"]`).classList.add('active');
  const titles = { generator:'Generador de carnets', history:'Historial de carnets', reports:'Reportes' };
  $('topbarTitle').textContent = titles[page];
  if(page === 'history') renderHistory();
  if(page === 'reports') renderReports();
  window.scrollTo({ top:0, behavior:'smooth' });
}

document.querySelectorAll('.menu-btn').forEach(button => button.addEventListener('click', () => showPage(button.dataset.page)));
$('globalSearch').addEventListener('input', event => {
  state.search = event.target.value;
  if(state.search.trim()) showPage('history'); else renderHistory();
});

function countBy(history,key){
  const result = {};
  history.forEach(record => {
    const value = record[key] || 'Sin dato';
    result[value] = (result[value] || 0) + 1;
  });
  return Object.entries(result).sort((a,b) => b[1] - a[1]);
}

function renderBars(elementId,data){
  const element = $(elementId);
  if(!data.length){ element.innerHTML = '<div class="empty" style="padding:20px">Sin datos.</div>'; return; }
  const max = Math.max(...data.map(item => item[1]),1);
  element.innerHTML = data.map(([label,count]) => `
    <div class="bar"><div class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</div><div class="bar-track"><div class="bar-fill" style="width:${(count/max)*100}%"></div></div><div class="bar-count">${count}</div></div>
  `).join('');
}

function renderReports(){
  const history = getHistory();
  const valid = history.filter(record => !isExpired(record.vencimiento)).length;
  const expired = history.length - valid;
  const companies = [...new Set(history.map(record => record.empresa).filter(Boolean))];
  $('metricTotal').textContent = history.length;
  $('metricValid').textContent = valid;
  $('metricExpired').textContent = expired;
  $('metricCompanies').textContent = companies.length;
  renderBars('companyReport', countBy(history,'empresa'));
  renderBars('areaReport', countBy(history,'area'));
}

$('downloadCsvBtn').addEventListener('click', () => {
  const history = getHistory();
  if(!history.length) return toast('No hay datos para exportar.');
  const rows = [['Nombres','Apellidos','Cedula','Codigo','Empresa','Cargo','Area','Tipo','Emision','Vencimiento','Equipos','Estado']];
  history.forEach(record => rows.push([
    record.nombres, record.apellidos, record.cedula, record.codigo, record.empresa, record.cargo, record.area, record.tipo,
    formatDate(record.emision), formatDate(record.vencimiento), equipmentSummary(record), isExpired(record.vencimiento) ? 'Vencido' : 'Vigente'
  ]));
  const csv = '﻿' + rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g,'""')}"`).join(';')).join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'reporte_carnets.csv';
  link.click();
  URL.revokeObjectURL(link.href);
});


async function embedLocalImages(element){
  const images = [...element.querySelectorAll('img')];
  for(const img of images){
    const src = img.getAttribute('src') || '';
    if(!src || src.startsWith('data:') || src.startsWith('blob:') || /^https?:/i.test(src)) continue;
    if(img.dataset.embedded === '1') continue;
    try{
      const res = await fetch(src);
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve,reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      img.src = dataUrl;
      img.dataset.embedded = '1';
    }catch(error){
      console.warn('No se pudo incrustar imagen', src, error);
    }
  }
  await Promise.all(images.map(img => {
    if(typeof img.decode === 'function'){
      return img.decode().catch(() => {});
    }
    return Promise.resolve();
  }));
}

async function cardImage(element){
  await embedLocalImages(element);
  const canvas = await html2canvas(element,{scale:3, backgroundColor:'#ffffff', useCORS:true, logging:false});
  return canvas.toDataURL('image/png');
}

async function printCurrent(){
  updatePreview();
  try{
    toast('Preparando impresión...');
    const front = await cardImage($('frontBadge'));
    const back = await cardImage($('backBadge'));
    openPrintWindow(front, back);
  }catch(error){
    toast('No se pudo preparar la impresión.');
  }
}
$('printBtn').addEventListener('click', printCurrent);

function printStored(id){
  const record = getHistory().find(item => item.id === id);
  if(!record) return;
  loadRecord(id);
  setTimeout(() => printCurrent(), 300);
}
window.printStored = printStored;

function openPrintWindow(front,back){
  const printWindow = window.open('', '_blank', 'width=1200,height=900');
  if(!printWindow) return toast('El navegador bloqueó la ventana de impresión.');
  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Imprimir carnet</title><style>
    @page{size:A4 landscape;margin:10mm}
    *{box-sizing:border-box} html,body{margin:0;padding:0;background:#fff;font-family:Arial,sans-serif}
    .sheet{width:100%;min-height:100vh;display:flex;align-items:center;justify-content:center}
    .cards{display:flex;gap:8mm;align-items:flex-start;justify-content:center}
    .card-box{display:flex;flex-direction:column;align-items:center}
    .card-label{font-size:11px;font-weight:700;color:#444;margin-bottom:3mm}
    img{display:block;width:56mm;height:89mm;object-fit:contain;border:0.25mm solid #ddd;border-radius:2mm;background:#fff}
    @media screen{body{background:#e9edf2;padding:14px}.sheet{min-height:auto}.cards{background:#fff;padding:12px;box-shadow:0 4px 18px rgba(0,0,0,.22)}}
    @media print{body{padding:0}.sheet{min-height:auto}}
  </style></head><body>
    <div class="sheet">
      <div class="cards">
        <div class="card-box"><div class="card-label">Frente</div><img src="${front}" alt="Frente"></div>
        <div class="card-box"><div class="card-label">Reverso</div><img src="${back}" alt="Reverso"></div>
      </div>
    </div>
    <script>window.onload=()=>setTimeout(()=>window.print(),400);<\/script>
  </body></html>`);
  printWindow.document.close();
}

function init(){
  setDefaultDates();
  updateTheme();
  updatePreview();
  renderHistory();
  renderReports();
}

window.addEventListener('beforeunload', closeCamera);
init();
