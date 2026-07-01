const KEY='auditVisitsV2',CKEY='auditCompaniesV2',LKEY='auditLocationsV1';
let visits=[],locationNotes=[],companies=[{id:'c1',name:'Empresa 1',color:'#1d557e'},{id:'c2',name:'Empresa 2',color:'#6a45b8'}];
let calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);
const $=id=>document.getElementById(id);

function load(){
  try{
    const v=JSON.parse(localStorage.getItem(KEY)||'[]');
    const c=JSON.parse(localStorage.getItem(CKEY)||'null');
    const l=JSON.parse(localStorage.getItem(LKEY)||'[]');
    visits=Array.isArray(v)?v:[];
    locationNotes=Array.isArray(l)?l:[];
    if(Array.isArray(c)&&c.length===2)companies=c;
  }catch(e){}
}
function save(){
  localStorage.setItem(KEY,JSON.stringify(visits));
  localStorage.setItem(CKEY,JSON.stringify(companies));
  localStorage.setItem(LKEY,JSON.stringify(locationNotes));
}
function ymd(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function dateObj(s,t='00:00'){const [y,m,d]=s.split('-').map(Number),[h,mi]=(t||'00:00').split(':').map(Number);return new Date(y,m-1,d,h||0,mi||0)}
function addDays(date,n){const x=new Date(date);x.setDate(x.getDate()+n);return x}
function diff(s){return Math.round((dateObj(s)-dateObj(ymd()))/86400000)}
function daysSince(s){return Math.floor((dateObj(ymd())-dateObj(s))/86400000)}
function esc(x){return String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;')}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function normalizeName(s){return String(s||'').trim().toLocaleLowerCase('es-MX').replace(/\s+/g,' ')}
function newId(){return globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`}
function company(id){return companies.find(c=>c.id===id)||companies[0]}
function formatDate(s,weekday=true){return cap(dateObj(s).toLocaleDateString('es-MX',weekday?{weekday:'long',day:'numeric',month:'long',year:'numeric'}:{day:'numeric',month:'short',year:'numeric'}))}
function formatTime(t){return t?dateObj('2000-01-01',t).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}):'Sin hora'}
function computedEndDate(v){
  if(v.endDate)return v.endDate;
  if(v.unit==='Días'&&Number(v.duration)>1)return ymd(addDays(dateObj(v.date),Math.ceil(Number(v.duration))-1));
  return v.date;
}
function computedEndTime(v){
  if(v.endTime)return v.endTime;
  if(v.unit==='Horas'&&v.time&&Number(v.duration)){
    const d=dateObj(v.date,v.time);d.setMinutes(d.getMinutes()+Number(v.duration)*60);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  return '';
}
function visitActiveOn(v,dateString){const d=dateObj(dateString),start=dateObj(v.date),end=dateObj(computedEndDate(v));return d>=start&&d<=end}
function alertData(v){
  if(v.status==='Completada')return['Completada','green'];
  if(v.status==='Cancelada')return['Cancelada','gray'];
  const startDiff=diff(v.date),endDiff=diff(computedEndDate(v));
  if(startDiff<0&&endDiff>=0)return['En curso','purple'];
  if(endDiff<0)return[`Vencida hace ${Math.abs(endDiff)} día${Math.abs(endDiff)===1?'':'s'}`,'red'];
  if(startDiff===0)return['Inicia hoy','red'];
  if(startDiff<=2)return[`Faltan ${startDiff} día${startDiff===1?'':'s'}`,'red'];
  if(startDiff<=6)return[`Faltan ${startDiff} días`,'orange'];
  if(startDiff<=14)return[`Faltan ${startDiff} días`,'yellow'];
  return[`Faltan ${startDiff} días`,'green'];
}
function statusClass(s){return {'Pendiente':'blue','En proceso':'purple','Completada':'green','Cancelada':'gray'}[s]||'gray'}
function refreshCompanies(){
  const options=companies.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
  $('company').innerHTML=options;
  $('locationCompany').innerHTML=options;
  $('companyFilter').innerHTML='<option value="">Todas las empresas</option>'+options;
  $('c1name').value=companies[0].name;$('c1color').value=companies[0].color;
  $('c2name').value=companies[1].name;$('c2color').value=companies[1].color;
}
function stats(){
  const active=visits.filter(v=>v.status!=='Cancelada');
  $('total').textContent=visits.length;
  $('soon').textContent=active.filter(v=>diff(v.date)>=0&&diff(v.date)<=14&&v.status!=='Completada').length;
  $('late').textContent=active.filter(v=>diff(computedEndDate(v))<0&&v.status!=='Completada').length;
  $('done').textContent=visits.filter(v=>v.status==='Completada').length;
}
function filtered(){
  const q=$('search').value.trim().toLowerCase(),cf=$('companyFilter').value,sf=$('statusFilter').value,df=$('dateFilter').value;
  return visits.filter(v=>{
    const text=`${v.location} ${v.activity} ${v.responsible||''} ${v.notes||''}`.toLowerCase();
    if(q&&!text.includes(q))return false;
    if(cf&&v.companyId!==cf)return false;
    if(sf&&v.status!==sf)return false;
    const d=diff(v.date);
    if(df==='today'&&!visitActiveOn(v,ymd()))return false;
    if(df==='week'&&!(d>=0&&d<=7))return false;
    if(df==='month'&&!(d>=0&&d<=30))return false;
    if(df==='late'&&!(diff(computedEndDate(v))<0&&v.status!=='Completada'))return false;
    return true;
  }).sort((a,b)=>dateObj(a.date,a.time)-dateObj(b.date,b.time));
}
function card(v){
  const c=company(v.companyId),[txt,cls]=alertData(v),endDate=computedEndDate(v),endTime=computedEndTime(v);
  return `<article id="visit-${v.id}" class="visit ${visitActiveOn(v,ymd())?'today-card':''}" style="border-left-color:${c.color}">
    <div class="visit-top"><div><h3>${esc(v.location)}</h3><div class="company"><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</div></div>
    <div class="badges"><span class="badge ${statusClass(v.status)}">${esc(v.status)}</span><span class="badge ${cls}">${txt}</span></div></div>
    <div class="meta-grid">
      <div class="meta"><small>Inicio</small><b>${formatDate(v.date,false)} · ${formatTime(v.time)}</b></div>
      <div class="meta"><small>Término</small><b>${formatDate(endDate,false)} · ${formatTime(endTime)}</b></div>
      <div class="meta"><small>Duración</small><b>${esc(v.duration)} ${esc(v.unit)}</b></div>
      <div class="meta"><small>Actividad</small><b>${esc(v.activity)}</b></div>
      <div class="meta"><small>Responsable</small><b>${esc(v.responsible||'Sin asignar')}</b></div>
    </div>
    ${v.notes?`<div class="notes">${esc(v.notes)}</div>`:''}
    <div class="actions">${v.status!=='Completada'?`<button class="btn good" data-action="complete" data-id="${v.id}">Marcar completada</button>`:''}<button class="btn soft" data-action="edit" data-id="${v.id}">Editar</button><button class="btn bad" data-action="remove" data-id="${v.id}">Eliminar</button></div>
  </article>`;
}
function renderTimeline(){
  const f=filtered(),box=$('timeline');
  if(!f.length){box.innerHTML='<div class="empty"><b>No hay visitas para mostrar.</b><br>Agrega una visita o cambia los filtros.</div>';return}
  const groups={};f.forEach(v=>(groups[v.date]??=[]).push(v));
  box.innerHTML=Object.entries(groups).map(([d,a])=>`<div class="group"><h3 class="date">${formatDate(d)}${diff(d)===0?' · HOY':''}</h3>${a.map(card).join('')}</div>`).join('');
}
function renderCalendar(){
  const year=calendarCursor.getFullYear(),month=calendarCursor.getMonth();
  $('calendarTitle').textContent=calendarCursor.toLocaleDateString('es-MX',{month:'long',year:'numeric'});
  const first=new Date(year,month,1),mondayOffset=(first.getDay()+6)%7;
  const start=addDays(first,-mondayOffset),visible=filtered();
  let html='';
  for(let i=0;i<42;i++){
    const day=addDays(start,i),dayString=ymd(day),outside=day.getMonth()!==month,todayDay=dayString===ymd();
    const events=visible.filter(v=>visitActiveOn(v,dayString)).sort((a,b)=>String(a.time||'').localeCompare(String(b.time||'')));
    const shown=events.slice(0,3);
    html+=`<div class="calendar-day ${outside?'outside':''} ${todayDay?'today-day':''}">
      <div class="day-number"><span>${day.getDate()}</span>${todayDay?'<span class="today-label">HOY</span>':''}</div>
      ${shown.map(v=>{const c=company(v.companyId),startMark=dayString===v.date?'Inicio':dayString===computedEndDate(v)?'Fin':'En curso';return `<button class="cal-event" style="border-left-color:${c.color};background:${c.color}18" data-action="open" data-id="${v.id}"><b>${esc(v.location)}</b><small>${startMark}${dayString===v.date&&v.time?' · '+formatTime(v.time):''}</small></button>`}).join('')}
      ${events.length>3?`<div class="more-events">+${events.length-3} más</div>`:''}
    </div>`;
  }
  $('calendarGrid').innerHTML=html;
}
function locationAgeInfo(date){
  if(!date)return{label:'Sin auditoría registrada',cls:'age-none'};
  const age=daysSince(date);
  if(age<0)return{label:'Fecha futura',cls:'age-none'};
  if(age===0)return{label:'Hoy',cls:'age-fresh'};
  if(age<=30)return{label:`Hace ${age} día${age===1?'':'s'}`,cls:'age-fresh'};
  if(age<=90)return{label:`Hace ${age} días`,cls:'age-mid'};
  return{label:`Hace ${age} días`,cls:'age-old'};
}
function renderLocations(){
  const q=$('locationSearch').value.trim().toLowerCase();
  const list=locationNotes.filter(l=>`${l.name} ${l.note||''} ${company(l.companyId).name}`.toLowerCase().includes(q)).sort((a,b)=>{
    if(!a.lastAuditDate&&!b.lastAuditDate)return a.name.localeCompare(b.name,'es');
    if(!a.lastAuditDate)return-1;if(!b.lastAuditDate)return 1;
    return dateObj(a.lastAuditDate)-dateObj(b.lastAuditDate);
  });
  $('locationCount').textContent=locationNotes.length;
  if(!list.length){$('locationList').innerHTML='<div class="location-empty">No hay locaciones para mostrar.</div>';return}
  $('locationList').innerHTML=list.map(l=>{
    const c=company(l.companyId),age=locationAgeInfo(l.lastAuditDate);
    return `<article class="location-item" style="border-left-color:${c.color}">
      <div class="location-top"><div><h3 class="location-title">${esc(l.name)}</h3><div class="location-company"><span class="dot" style="background:${c.color}"></span>${esc(c.name)}</div></div><span class="age-chip ${age.cls}">${age.label}</span></div>
      <div class="location-date"><span>Última auditoría</span><b>${l.lastAuditDate?formatDate(l.lastAuditDate,false):'Sin fecha'}</b></div>
      ${l.note?`<div class="location-note">${esc(l.note)}</div>`:''}
      <div class="location-actions"><button class="btn good" data-loc-action="schedule" data-id="${l.id}">Programar</button><button class="btn soft" data-loc-action="edit" data-id="${l.id}">Editar</button><button class="btn bad" data-loc-action="remove" data-id="${l.id}">Eliminar</button></div>
    </article>`;
  }).join('');
}
function syncVisitToLocation(v){
  if(!v.location?.trim())return;
  const key=normalizeName(v.location);
  let record=locationNotes.find(l=>l.companyId===v.companyId&&normalizeName(l.name)===key);
  if(!record){record={id:newId(),companyId:v.companyId,name:v.location.trim(),lastAuditDate:'',note:''};locationNotes.push(record)}
  if(v.status==='Completada'){
    const completedDate=computedEndDate(v);
    if(!record.lastAuditDate||dateObj(completedDate)>dateObj(record.lastAuditDate))record.lastAuditDate=completedDate;
  }
}
function syncVisitsToLocations(){visits.forEach(syncVisitToLocation);save()}
function render(){stats();renderTimeline();renderCalendar();renderLocations()}
function reset(){
  $('form').reset();$('editId').value='';$('formTitle').textContent='Nueva visita';$('saveBtn').textContent='Guardar visita';$('cancelBtn').hidden=true;
  $('duration').value=2;$('date').value=ymd();$('endDate').value=ymd();$('time').value='09:00';$('endTime').value='11:00';$('status').value='Pendiente';$('company').value=companies[0].id;
}
function resetLocationForm(){
  $('locationForm').reset();$('locationEditId').value='';$('saveLocationBtn').textContent='Guardar locación';$('cancelLocationBtn').hidden=true;$('locationCompany').value=companies[0].id;
}
function syncEndFromDuration(){
  const startDate=$('date').value,startTime=$('time').value,duration=Number($('duration').value),unit=$('unit').value;
  if(!startDate||!duration)return;
  if(unit==='Días'){
    $('endDate').value=ymd(addDays(dateObj(startDate),Math.max(0,Math.ceil(duration)-1)));
    if(!$('endTime').value)$('endTime').value=startTime;
  }else{
    const end=dateObj(startDate,startTime||'00:00');end.setMinutes(end.getMinutes()+duration*60);
    $('endDate').value=ymd(end);$('endTime').value=`${String(end.getHours()).padStart(2,'0')}:${String(end.getMinutes()).padStart(2,'0')}`;
  }
}
function editVisit(id){
  const v=visits.find(x=>x.id===id);if(!v)return;
  $('editId').value=v.id;$('company').value=v.companyId;$('location').value=v.location;$('date').value=v.date;$('time').value=v.time;
  $('endDate').value=computedEndDate(v);$('endTime').value=computedEndTime(v);$('duration').value=v.duration;$('unit').value=v.unit;
  $('activity').value=v.activity;$('responsible').value=v.responsible||'';$('status').value=v.status;$('notes').value=v.notes||'';
  $('formTitle').textContent='Editar visita';$('saveBtn').textContent='Guardar cambios';$('cancelBtn').hidden=false;$('visitCard').scrollIntoView({behavior:'smooth',block:'start'});
}
function removeVisit(id){if(confirm('¿Eliminar esta visita?')){visits=visits.filter(v=>v.id!==id);save();render()}}
function completeVisit(id){const v=visits.find(x=>x.id===id);if(v){v.status='Completada';syncVisitToLocation(v);save();render()}}
function openCalendarVisit(id){
  const v=visits.find(x=>x.id===id);if(!v)return;
  const element=$(`visit-${id}`);
  if(element){element.scrollIntoView({behavior:'smooth',block:'center'})}else editVisit(id);
}
function editLocation(id){
  const l=locationNotes.find(x=>x.id===id);if(!l)return;
  $('locationEditId').value=l.id;$('locationCompany').value=l.companyId;$('locationName').value=l.name;$('lastAuditDate').value=l.lastAuditDate||'';$('locationNote').value=l.note||'';
  $('saveLocationBtn').textContent='Guardar cambios';$('cancelLocationBtn').hidden=false;$('locationForm').scrollIntoView({behavior:'smooth',block:'center'});
}
function removeLocation(id){if(confirm('¿Eliminar esta locación del bloc?')){locationNotes=locationNotes.filter(l=>l.id!==id);save();renderLocations()}}
function scheduleLocation(id){
  const l=locationNotes.find(x=>x.id===id);if(!l)return;
  $('company').value=l.companyId;$('location').value=l.name;$('visitCard').scrollIntoView({behavior:'smooth',block:'start'});$('activity').focus();
}
$('form').addEventListener('submit',e=>{
  e.preventDefault();
  const start=dateObj($('date').value,$('time').value),end=dateObj($('endDate').value,$('endTime').value||'23:59');
  if(end<start){alert('La fecha de término no puede ser anterior a la fecha de inicio.');return}
  const v={id:$('editId').value||newId(),companyId:$('company').value,location:$('location').value.trim(),date:$('date').value,time:$('time').value,endDate:$('endDate').value,endTime:$('endTime').value,duration:Number($('duration').value),unit:$('unit').value,activity:$('activity').value.trim(),responsible:$('responsible').value.trim(),status:$('status').value,notes:$('notes').value.trim()};
  const i=visits.findIndex(x=>x.id===v.id);i>=0?visits[i]=v:visits.push(v);syncVisitToLocation(v);save();reset();render();
});
$('locationForm').addEventListener('submit',e=>{
  e.preventDefault();
  const lastDate=$('lastAuditDate').value;
  if(lastDate&&dateObj(lastDate)>dateObj(ymd())){alert('La fecha de última auditoría no puede ser futura.');return}
  const record={id:$('locationEditId').value||newId(),companyId:$('locationCompany').value,name:$('locationName').value.trim(),lastAuditDate:lastDate,note:$('locationNote').value.trim()};
  const duplicate=locationNotes.find(l=>l.id!==record.id&&l.companyId===record.companyId&&normalizeName(l.name)===normalizeName(record.name));
  if(duplicate){alert('Esa locación ya está registrada para la empresa seleccionada.');return}
  const i=locationNotes.findIndex(l=>l.id===record.id);i>=0?locationNotes[i]=record:locationNotes.push(record);save();resetLocationForm();renderLocations();
});
$('timeline').addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(!b)return;const id=b.dataset.id;if(b.dataset.action==='complete')completeVisit(id);if(b.dataset.action==='edit')editVisit(id);if(b.dataset.action==='remove')removeVisit(id)});
$('calendarGrid').addEventListener('click',e=>{const b=e.target.closest('button[data-action="open"]');if(b)openCalendarVisit(b.dataset.id)});
$('locationList').addEventListener('click',e=>{const b=e.target.closest('button[data-loc-action]');if(!b)return;const id=b.dataset.id;if(b.dataset.locAction==='schedule')scheduleLocation(id);if(b.dataset.locAction==='edit')editLocation(id);if(b.dataset.locAction==='remove')removeLocation(id)});
$('cancelBtn').onclick=reset;$('cancelLocationBtn').onclick=resetLocationForm;
$('saveCompanies').onclick=()=>{
  companies=[{id:'c1',name:$('c1name').value.trim()||'Empresa 1',color:$('c1color').value},{id:'c2',name:$('c2name').value.trim()||'Empresa 2',color:$('c2color').value}];
  save();refreshCompanies();render();alert('Empresas actualizadas');
};
['search','companyFilter','statusFilter','dateFilter'].forEach(id=>{$(id).addEventListener('input',render);$(id).addEventListener('change',render)});
$('locationSearch').addEventListener('input',renderLocations);
['date','time','duration','unit'].forEach(id=>{$(id).addEventListener('change',syncEndFromDuration);$(id).addEventListener('input',syncEndFromDuration)});
$('clear').onclick=()=>{$('search').value='';$('companyFilter').value='';$('statusFilter').value='';$('dateFilter').value='';render()};
$('prevMonth').onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendar()};
$('nextMonth').onclick=()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendar()};
$('todayMonth').onclick=()=>{calendarCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);renderCalendar()};
$('exportBtn').onclick=()=>{const data=JSON.stringify({companies,visits,locations:locationNotes},null,2);const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(data);a.download=`respaldo-auditorias-${ymd()}.json`;a.click()};
$('importBtn').onclick=()=>$('file').click();
$('file').onchange=async e=>{
  const f=e.target.files[0];if(!f)return;
  try{
    const x=JSON.parse(await f.text());if(!Array.isArray(x.visits)||!Array.isArray(x.companies))throw 0;
    if(confirm('Esto reemplazará la información actual. ¿Continuar?')){visits=x.visits;companies=x.companies;locationNotes=Array.isArray(x.locations)?x.locations:[];syncVisitsToLocations();refreshCompanies();reset();resetLocationForm();render()}
  }catch{alert('El archivo no es un respaldo válido')}
  e.target.value='';
};
function today(){$('todayText').textContent=new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
load();syncVisitsToLocations();today();refreshCompanies();reset();resetLocationForm();render();
setInterval(()=>{today();stats();renderTimeline();renderCalendar();renderLocations()},60000);