const EVENT_KEY='auditCalendarEventsV1';
let calendarEvents=[];

function loadCalendarEvents(){
  try{
    const saved=JSON.parse(localStorage.getItem(EVENT_KEY)||'[]');
    calendarEvents=Array.isArray(saved)?saved:[];
  }catch(e){calendarEvents=[]}
}
function saveCalendarEvents(){localStorage.setItem(EVENT_KEY,JSON.stringify(calendarEvents))}
function eventTypeData(type){
  return {
    training:{label:'Capacitación',color:'#6a45b8',icon:'🎓'},
    upload:{label:'Carga de archivos',color:'#d96d0d',icon:'↑'},
    meeting:{label:'Reunión',color:'#1d557e',icon:'●'},
    reminder:{label:'Recordatorio',color:'#8a6a00',icon:'!'},
    other:{label:'Otro',color:'#59636d',icon:'•'}
  }[type]||{label:'Evento',color:'#59636d',icon:'•'};
}
function eventEndDate(event){return event.endDate||event.date}
function calendarEventActiveOn(event,dateString){
  const day=dateObj(dateString),start=dateObj(event.date),end=dateObj(eventEndDate(event));
  return day>=start&&day<=end;
}
function eventScope(event){
  if(!event.companyId)return{name:'General',marker:'',color:'#59636d'};
  const c=company(event.companyId);
  return{name:c.name,marker:companyMarker(c),color:c.color,shared:c.shared,colors:c.colors};
}
function filteredCalendarEvents(){
  const q=$('search').value.trim().toLowerCase(),cf=$('companyFilter').value,sf=$('statusFilter').value,df=$('dateFilter').value;
  if(sf)return[];
  return calendarEvents.filter(event=>{
    const text=`${event.title} ${event.type} ${event.responsible||''} ${event.notes||''}`.toLowerCase();
    if(q&&!text.includes(q))return false;
    if(cf&&event.companyId!==cf)return false;
    const d=diff(event.date);
    if(df==='today'&&!calendarEventActiveOn(event,ymd()))return false;
    if(df==='week'&&!(d>=0&&d<=7))return false;
    if(df==='month'&&!(d>=0&&d<=30))return false;
    if(df==='late')return false;
    return true;
  }).sort((a,b)=>dateObj(a.date,a.time||'00:00')-dateObj(b.date,b.time||'00:00'));
}
function eventDateLabel(event){
  const start=formatDate(event.date,false),end=formatDate(eventEndDate(event),false);
  const time=event.time?` · ${formatTime(event.time)}`:'';
  return event.date===eventEndDate(event)?`${start}${time}`:`${start} – ${end}${time}`;
}
function renderEventList(){
  const box=$('eventList');
  if(!box)return;
  const list=[...calendarEvents].sort((a,b)=>dateObj(a.date,a.time||'00:00')-dateObj(b.date,b.time||'00:00'));
  if(!list.length){box.innerHTML='<div class="event-empty">No hay eventos registrados.</div>';return}
  box.innerHTML=list.map(event=>{
    const type=eventTypeData(event.type),scope=eventScope(event);
    return `<article class="event-card" style="border-left-color:${type.color}">
      <div class="event-card-top"><div><strong>${esc(event.title)}</strong><div class="event-card-type" style="color:${type.color}">${type.icon} ${type.label}</div></div><span>${eventDateLabel(event)}</span></div>
      <div class="event-card-meta">${scope.marker}${esc(scope.name)}${event.responsible?` · ${esc(event.responsible)}`:''}</div>
      ${event.notes?`<div class="event-card-notes">${esc(event.notes)}</div>`:''}
      <div class="event-card-actions"><button class="btn soft" type="button" data-event-action="edit" data-id="${event.id}">Editar</button><button class="btn bad" type="button" data-event-action="remove" data-id="${event.id}">Eliminar</button></div>
    </article>`;
  }).join('');
}
function resetEventForm(){
  const form=$('eventForm');if(!form)return;
  form.reset();$('eventEditId').value='';$('eventFormTitle').textContent='Nuevo evento';$('saveEventBtn').textContent='Guardar evento';$('cancelEventBtn').hidden=true;
  $('eventDate').value=ymd();$('eventEndDate').value=ymd();$('eventType').value='training';$('eventCompany').value='';
}
function editCalendarEvent(id){
  const event=calendarEvents.find(x=>x.id===id);if(!event)return;
  const details=$('calendarEventPanel');if(details)details.open=true;
  $('eventEditId').value=event.id;$('eventTitle').value=event.title;$('eventType').value=event.type;$('eventCompany').value=event.companyId||'';
  $('eventDate').value=event.date;$('eventTime').value=event.time||'';$('eventEndDate').value=eventEndDate(event);$('eventEndTime').value=event.endTime||'';
  $('eventResponsible').value=event.responsible||'';$('eventNotes').value=event.notes||'';
  $('eventFormTitle').textContent='Editar evento';$('saveEventBtn').textContent='Guardar cambios';$('cancelEventBtn').hidden=false;
  details?.scrollIntoView({behavior:'smooth',block:'start'});
}
function removeCalendarEvent(id){
  if(confirm('¿Eliminar este evento del calendario?')){calendarEvents=calendarEvents.filter(event=>event.id!==id);saveCalendarEvents();renderCalendar();renderEventList()}
}
function openCalendarEvent(id){editCalendarEvent(id)}
function refreshEventCompanyOptions(){
  const select=$('eventCompany');if(!select)return;
  const selected=select.value;
  select.innerHTML='<option value="">General / sin empresa</option>'+companyOptions();
  const valid=['',...companies.map(c=>c.id),BOTH_ID];select.value=valid.includes(selected)?selected:'';
}

const baseSave=save;
save=function(){baseSave();saveCalendarEvents()};
const baseRefreshCompanies=refreshCompanies;
refreshCompanies=function(){baseRefreshCompanies();refreshEventCompanyOptions()};
const baseRender=render;
render=function(){baseRender();renderEventList()};

renderCalendar=function(){
  const year=calendarCursor.getFullYear(),month=calendarCursor.getMonth();
  $('calendarTitle').textContent=calendarCursor.toLocaleDateString('es-MX',{month:'long',year:'numeric'});
  const first=new Date(year,month,1),mondayOffset=(first.getDay()+6)%7;
  const start=addDays(first,-mondayOffset),visibleVisits=filtered(),visibleEvents=filteredCalendarEvents();
  let html='';
  for(let i=0;i<42;i++){
    const day=addDays(start,i),dayString=ymd(day),outside=day.getMonth()!==month,todayDay=dayString===ymd();
    const visitItems=visibleVisits.filter(v=>visitActiveOn(v,dayString)).map(v=>({kind:'visit',time:v.time||'',item:v}));
    const eventItems=visibleEvents.filter(e=>calendarEventActiveOn(e,dayString)).map(e=>({kind:'event',time:e.time||'',item:e}));
    const items=[...visitItems,...eventItems].sort((a,b)=>String(a.time).localeCompare(String(b.time)));
    const shown=items.slice(0,4);
    html+=`<div class="calendar-day ${outside?'outside':''} ${todayDay?'today-day':''}">
      <div class="day-number"><span>${day.getDate()}</span>${todayDay?'<span class="today-label">HOY</span>':''}</div>
      ${shown.map(entry=>{
        if(entry.kind==='visit'){
          const v=entry.item,c=company(v.companyId),startMark=dayString===v.date?'Inicio':dayString===computedEndDate(v)?'Fin':'En curso';
          return `<button class="cal-event ${c.shared?'shared-event':''}" style="border-left-color:${c.color};background:${eventBackground(c)}" data-action="open" data-id="${v.id}"><b>${esc(v.location)}</b><small>${startMark}${dayString===v.date&&v.time?' · '+formatTime(v.time):''}</small></button>`;
        }
        const event=entry.item,type=eventTypeData(event.type),startMark=dayString===event.date?'Evento':dayString===eventEndDate(event)?'Fin':'En curso';
        return `<button class="cal-event calendar-note" style="border-left-color:${type.color};background:${type.color}18" data-event-action="open" data-id="${event.id}"><b>${type.icon} ${esc(event.title)}</b><small>${type.label} · ${startMark}${dayString===event.date&&event.time?' · '+formatTime(event.time):''}</small></button>`;
      }).join('')}
      ${items.length>4?`<div class="more-events">+${items.length-4} más</div>`:''}
    </div>`;
  }
  $('calendarGrid').innerHTML=html;
};

loadCalendarEvents();
refreshEventCompanyOptions();
resetEventForm();
renderCalendar();
renderEventList();

$('eventForm').addEventListener('submit',event=>{
  event.preventDefault();
  const startDate=$('eventDate').value,endDate=$('eventEndDate').value||startDate,startTime=$('eventTime').value,endTime=$('eventEndTime').value;
  if(dateObj(endDate,endTime||'23:59')<dateObj(startDate,startTime||'00:00')){alert('La fecha de término no puede ser anterior a la fecha de inicio.');return}
  const record={id:$('eventEditId').value||newId(),title:$('eventTitle').value.trim(),type:$('eventType').value,companyId:$('eventCompany').value,date:startDate,time:startTime,endDate,endTime,responsible:$('eventResponsible').value.trim(),notes:$('eventNotes').value.trim()};
  const index=calendarEvents.findIndex(x=>x.id===record.id);index>=0?calendarEvents[index]=record:calendarEvents.push(record);
  saveCalendarEvents();resetEventForm();renderCalendar();renderEventList();
});
$('cancelEventBtn').onclick=resetEventForm;
$('eventDate').addEventListener('change',()=>{if(!$('eventEndDate').value||dateObj($('eventEndDate').value)<dateObj($('eventDate').value))$('eventEndDate').value=$('eventDate').value});
$('eventList').addEventListener('click',event=>{
  const button=event.target.closest('button[data-event-action]');if(!button)return;
  if(button.dataset.eventAction==='edit')editCalendarEvent(button.dataset.id);
  if(button.dataset.eventAction==='remove')removeCalendarEvent(button.dataset.id);
});
$('calendarGrid').addEventListener('click',event=>{
  const button=event.target.closest('button[data-event-action="open"]');if(button)openCalendarEvent(button.dataset.id);
});

$('exportBtn').onclick=()=>{
  const data=JSON.stringify({companies,visits,locations:locationNotes,events:calendarEvents},null,2);
  const a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(data);a.download=`respaldo-auditorias-${ymd()}.json`;a.click();
};
$('file').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  try{
    const data=JSON.parse(await file.text());if(!Array.isArray(data.visits)||!Array.isArray(data.companies))throw 0;
    if(confirm('Esto reemplazará la información actual. ¿Continuar?')){
      visits=data.visits;companies=data.companies;locationNotes=Array.isArray(data.locations)?data.locations:[];calendarEvents=Array.isArray(data.events)?data.events:[];
      syncVisitsToLocations();saveCalendarEvents();refreshCompanies();reset();resetLocationForm();resetEventForm();render();
    }
  }catch{alert('El archivo no es un respaldo válido')}
  event.target.value='';
};