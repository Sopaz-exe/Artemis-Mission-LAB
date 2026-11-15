// ARTEMIS MISSION LAB v3.0 · Native ES modules, no runtime libraries.
import { ACTIVITY_CONFIG } from './activities.js';
import { EVENTS, LEARNING_TASKS, MODULES, freezeCatalog } from './data.js';
import { game, has } from './main.js';
import { clamp } from './render.js';

export const LABELS={money:'Créditos',energy:'Energía',life:'Soporte vital',comm:'Comunicaciones',hull:'Integridad',fuel:'Propelente',science:'Ciencia'};

export const PHASES=['Salida de la Tierra','Travesía cislunar','Exploración lunar','Operación de la base'];

export function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

export function calcLoad(){const calculated=loadResources(game.state.load);game.state.r=calculated.r;game.state.mass=calculated.mass}

export function requirements(){return[{ok:has('capsule'),text:'Cápsula y propulsión instaladas'},{ok:game.state.r.energy>=45,text:'Energía de salida ≥45'},{ok:game.state.r.life>=55,text:'Soporte vital ≥55'},{ok:game.state.r.comm>=40,text:'Enlace de salida ≥40'},{ok:game.state.r.money>=18,text:'Reserva operativa ≥18 M'},{ok:game.state.mass<=launcherProfile().maxMass,text:`Masa ${game.state.mass} / ${launcherProfile().maxMass} kg`},{ok:extraCount()<=EXTRA_SLOTS,text:`Extras ${extraCount()} / ${EXTRA_SLOTS} espacios`} ]}

export function apply(d){const actual={};for(const[k,v]of Object.entries(d)){const old=game.state.r[k];game.state.r[k]=clamp(old+v,0,k==='science'?999:k==='money'?FLIGHT_BUDGET:100);actual[k]=game.state.r[k]-old}return actual}

export function critical(){return game.state.r.life<=0?'Se agotó el soporte vital. La tripulación no sobrevivió.':game.state.r.energy<=0?'La energía se agotó y el soporte vital quedó sin alimentación. Se perdió la tripulación.':game.state.r.hull<=0?'La nave perdió su integridad estructural. Se perdió la tripulación.':null}

export const CORE_MODULES=['capsule','battery','oxygen','antenna'];

export const EXTRA_SLOTS=3;

export function extraCount(){return game.state.load.filter(id=>!CORE_MODULES.includes(id)).length}

export function drawOffer(){const groups=[['solar','supercap'],['recycler','reserveair','thermal'],['tools','repairfoam','shield'],['camera','drill','samplebox']];const chosen=groups.map(g=>g[Math.floor(Math.random()*g.length)]);const rest=shuffle(MODULES.filter(m=>!CORE_MODULES.includes(m.id)&&!chosen.includes(m.id)).map(m=>m.id)).slice(0,2);return[...CORE_MODULES,...shuffle([...chosen,...rest])]}

export function ensureOffer(){if(!Array.isArray(game.state.offer))game.state.offer=[...new Set([...drawOffer(),...game.state.load])];if(!game.state.hangarCode)game.state.hangarCode='EX-'+Math.floor(1000+Math.random()*9000)}

export function problemCatalog(){return EVENTS}

export function caseKey(e){return e.family?e.family+':'+e.variant:e.title}

export function enrichEvent(raw){const e=JSON.parse(JSON.stringify(raw));e.choicePool=e.options;e.ruleVersion=28;return e}

export function makeAnswerSlots(){let slots;do{slots=shuffle([0,0,0,0,1,1,1,1,2,2,2,2])}while(slots.some((n,i)=>i>1&&n===slots[i-1]&&n===slots[i-2]));return slots}

export function buildPools(){return PHASES.map((_,p)=>{const selected=[],families=new Set();for(const raw of shuffle(problemCatalog().filter(e=>e.phase===p))){const family=raw.family||raw.title;if(families.has(family))continue;families.add(family);selected.push(enrichEvent(raw));if(selected.length===3)break}return selected})}

export function prepareEvent(e){if(e.ruleVersion!==28){const original=problemCatalog().find(v=>caseKey(v)===caseKey(e));Object.assign(e,enrichEvent(original||e));e.optionsPrepared=false}if(e.optionsPrepared)return e;const pool=e.choicePool,available=pool.filter(o=>!o.needs||has(o.needs)),best=shuffle(available.filter(o=>o.quality===2))[0]||shuffle(available.filter(o=>o.quality>0))[0],middle=shuffle(available.filter(o=>o!==best&&o.quality>=0&&o.quality<2))[0],risk=shuffle(available.filter(o=>o.quality<0))[0];const fallback=shuffle(available.filter(o=>o!==best&&o!==middle&&o!==risk));const others=shuffle([middle||fallback.shift(),risk||fallback.shift()]);game.state.answerSlots ||= makeAnswerSlots();const slot=game.state.answerSlots[game.state.turn]??Math.floor(Math.random()*3);e.options=[...others];e.options.splice(slot,0,best);e.optionsPrepared=true;return e}

export const MISSION_RULES={evidence:8,science:65,comm:20,fuel:8,operating:{energy:-2,life:-4,comm:-1,money:-1,hull:-2}};

export function evidenceCount(){const titles=new Set(problemCatalog().map(e=>e.title));return game.state.history.filter(h=>h.quality>=1&&(h.kind==='decision'||titles.has(h.title))).length}

export function missionCriteria(){return[
 ['Viaje completo',game.state.turn>=12,`${Math.min(12,game.state.turn)} / 12 decisiones`],
 ['Decisiones con evidencia',evidenceCount()>=MISSION_RULES.evidence,`${evidenceCount()} / ${MISSION_RULES.evidence} casos`],
 ['Ciencia documentada',game.state.r.science>=MISSION_RULES.science,`${game.state.r.science} / ${MISSION_RULES.science}`],
 ['Enlace para compartir',game.state.r.comm>=MISSION_RULES.comm,`${game.state.r.comm} / ${MISSION_RULES.comm}`],
 ['Reserva de regreso',game.state.r.fuel>=MISSION_RULES.fuel,`${game.state.r.fuel} / ${MISSION_RULES.fuel}`],
 ['Tripulación y nave operativas',game.state.r.energy>0&&game.state.r.life>0&&game.state.r.hull>0,'Energía, soporte e integridad por encima de cero']
 ]}

export function equipmentEffects(d,context={}){d={...d};const notes=[],key=context.source,tag=context.tag||'',thermal=key==='thermal'||/TÉRMIC|TEMPERATURA|SOMBRA/.test(tag),mechanical=['engineering','dust','conops'].includes(key);
 const reduce=(k,factor,label)=>{if(d[k]<0){const old=d[k];d[k]=Math.ceil(d[k]*factor);if(d[k]!==old)notes.push(label)}};
 if(has('thermal')&&thermal){reduce('life',.55,'El equipo térmico redujo el desgaste de soporte.');if(d.energy<0)d.energy=Math.min(0,d.energy+2)}
 if(has('shield')&&key==='radiation')reduce('life',.55,'El refugio redujo la exposición de la tripulación.');
 if(game.state.shield&&d.life<0){reduce('life',.5,'La protección preparada redujo el desgaste vital.');game.state.shield=false}
 if(has('tools')&&mechanical){reduce('hull',.7,'Las herramientas ayudaron a limitar el desgaste mecánico.');if(d.energy<0)d.energy=Math.min(0,d.energy+1)}
 if(has('relay')&&['terrain','comm'].includes(key)){reduce('comm',.5,'El enlace de respaldo conservó parte de la comunicación.');if(d.energy<0)d.energy=Math.min(0,d.energy+1)}
 if(has('navigator')&&['gravity','comm','engineering'].includes(key)){reduce('fuel',.75,'El navegador redujo el consumo de la corrección.');if(d.energy<0)d.energy=Math.min(0,d.energy+1)}
 if(d.science>0&&has('camera')&&['camera','scan','moon','sun'].includes(context.icon)){d.science+=2;notes.push('La cámara aportó documentación complementaria.')}
 if(d.science>0&&has('samplebox')&&['ice','drill','engineering'].includes(key)){d.science+=1;notes.push('El laboratorio mejoró el registro de evidencias.')}
 return specialtyEffects(d,context,notes)}

export function resolveDelta(d,context={}){const notes=[];d={...d};if(game.state.balanceVersion>=29)for(const [key,max]of Object.entries(DAMAGE_CAPS)){if(d[key]<-max){d[key]=-max;notes.push(`El aislamiento de emergencia limitó el daño inmediato de ${LABELS[key].toLowerCase()}. Regla del simulador.`)}}for(const [key,candidates]of [['energy',['battery','supercap']],['life',['oxygen','reserveair']]]){if(game.state.r[key]+(d[key]||0)>0)continue;if(key==='life'&&context.quality<1&&['life','radiation','dust','thermal','south','gravity'].includes(context.source))continue;const module=MODULES.find(m=>candidates.includes(m.id)&&has(m.id)&&game.state.uses[m.id]>0);if(module){game.state.uses[module.id]--;d[key]=(d[key]||0)+module.action[key];notes.push(`Reserva automática: ${module.name}. Se consumió una carga para sostener ${LABELS[key].toLowerCase()}.`)}}return{actual:apply(d),notes}}

export const SPECIALTIES={
 none:{name:'Sin especialidad',description:'Juega con el equipo básico, sin bonificación.'},
 commander:{name:'Comandante',description:'Ahorra 1 unidad de propelente en cada maniobra que lo consume.'},
 eclss:{name:'Ingeniería ECLSS',description:'Reduce en 1 el desgaste de soporte en casos de aire y agua.'},
 science:{name:'Ciencia Lunar',description:'Añade 1 punto de ciencia al documentar resultados lunares.'}
};

export function specialtyEffects(d,context={},notes=[]){const role=game.state.specialty||'none';if(role==='commander'&&d.fuel<0){d.fuel=Math.min(0,d.fuel+1);notes.push('Comandante: una unidad de propelente conservada.')}if(role==='eclss'&&['life','water'].includes(context.source)&&d.life<0){d.life=Math.min(0,d.life+1);notes.push('ECLSS: una unidad de desgaste vital evitada.')}if(role==='science'&&['ice','drill','dust','gravity','thermal','south','spectra','shackleton'].includes(context.source)&&d.science>0){d.science++;notes.push('Ciencia Lunar: un punto de documentación adicional.')}return{delta:d,notes}}

export function crewName(){return SPECIALTIES[game.state?.specialty]?.name==='Sin especialidad'?'Piloto de misión':SPECIALTIES[game.state?.specialty]?.name||'Piloto de misión'}

export const LANDING={gravity:1.62,verticalAccel:4.7,lateralAccel:1.8,pixelsPerMeter:2,touchdownY:265,padX:450,padHalfWidth:85,safeHalfWidth:50,maxV:12,maxVX:3};

export function activeAdvantages(e){const benefits=[],options=e.options||e.choicePool||[],negative=key=>options.some(o=>(operatingCost()[key]||0)+(o.delta[key]||0)<0),positiveScience=options.some(o=>o.delta.science>0),source=e.source,thermal=source==='thermal'||/TÉRMIC|TEMPERATURA|SOMBRA/.test(e.tag||'');if(game.state.specialty==='commander'&&negative('fuel'))benefits.push('Comandante');if(game.state.specialty==='eclss'&&['life','water'].includes(source)&&negative('life'))benefits.push('Ingeniería ECLSS');if(game.state.specialty==='science'&&['ice','drill','dust','gravity','thermal','south','spectra','shackleton'].includes(source)&&positiveScience)benefits.push('Ciencia Lunar');if(has('thermal')&&thermal&&(negative('life')||negative('energy')))benefits.push('Protección térmica');if(has('shield')&&source==='radiation'&&negative('life'))benefits.push('Refugio de radiación');if(game.state.shield&&negative('life'))benefits.push('Protección preparada');if(has('tools')&&['engineering','dust','conops'].includes(source)&&(negative('hull')||negative('energy')))benefits.push('Kit de reparación');if(has('relay')&&['terrain','comm'].includes(source)&&(negative('comm')||negative('energy')))benefits.push('Repetidor');if(has('navigator')&&['gravity','comm','engineering'].includes(source)&&(negative('fuel')||negative('energy')))benefits.push('Navegador de respaldo');return benefits}

export const FLIGHT_BUDGET=120;

export const LAUNCHERS=freezeCatalog({
 light:{id:'light',name:'Lanzador Ligero',cost:4,maxMass:750,color:'#7ce8c5',description:'Más créditos para el viaje. El espacio de carga exige equipo compacto y reservas bien elegidas.'},
 medium:{id:'medium',name:'Lanzador Medio',cost:16,maxMass:850,color:'#91dbff',description:'El equilibrio habitual: capacidad para combinar instrumentos, reservas y protección.'},
 heavy:{id:'heavy',name:'Lanzador Pesado',cost:26,maxMass:1050,color:'#ffd17b',description:'Admite las cargas más pesadas. Pagar el lanzamiento deja menos créditos para operar.'}
});

export const PHASE_WEAR=freezeCatalog([
 {energy:-2,life:-3,comm:-1,money:-1,hull:-1},
 {energy:-2,life:-4,comm:-1,money:-1,hull:-2},
 {energy:-3,life:-5,comm:-1,money:-1,hull:-2},
 {energy:-4,life:-5,comm:-1,money:-2,hull:-3}
]);

export const DAMAGE_CAPS=freezeCatalog({energy:30,life:30,hull:35});

export function launcherProfile(id=game.state?.launcher){return LAUNCHERS[id]||LAUNCHERS.medium}

export function operatingCost(turn=game.state.turn){return {...(game.state.balanceVersion>=29?PHASE_WEAR[Math.min(3,Math.floor(turn/3))]:MISSION_RULES.operating)}}

export function decisionDelta(e,o){const d=operatingCost();for(const[k,v]of Object.entries(o.delta))d[k]=(d[k]||0)+v;if(game.state.balanceVersion>=29&&o.quality<0){for(const[k,v]of Object.entries({energy:-3,life:-2,hull:-3,money:-1}))d[k]=(d[k]||0)+v}return d}

export function activityDelta(d,quality){return game.state.balanceVersion>=29&&quality>=1?{...d,money:(d.money||0)+2}:{...d}}

export function loadResources(load,id=game.state.launcher){const p=launcherProfile(id),r={money:FLIGHT_BUDGET-p.cost,energy:0,life:0,comm:0,hull:0,fuel:0,science:0};let mass=0;for(const m of MODULES.filter(m=>load.includes(m.id))){r.money-=m.cost;mass+=m.mass;for(const[k,v]of Object.entries(m.gain))r[k]+=v}for(const key of ['energy','life','comm','hull','fuel'])r[key]=clamp(r[key]);return{r,mass}}

export function plannedActivity(type){const table={repair:{hull:12,science:9,energy:-2},camera:{science:21,energy:-4},signal:{comm:18,science:12,energy:-5},solar:{energy:has('solar')?16:0,science:12},landing:{fuel:-24,science:15,hull:-2,life:-1},survey:{science:30,energy:-3},meteor:{science:12,energy:-1},rover:{science:14,energy:-2},spectra:{science:15,energy:-3},transit:{science:15,energy:-2},powergrid:{science:12,energy:3}};return activityDelta(table[type]||{},2)}

export function legalLoad(load,id){const {r,mass}=loadResources(load,id);return CORE_MODULES.every(key=>load.includes(key))&&load.length<=CORE_MODULES.length+EXTRA_SLOTS&&mass<=launcherProfile(id).maxMass&&r.money>=18&&r.energy>=45&&r.life>=55&&r.comm>=40}

export function conservativeCase(e){const good=e.choicePool.filter(o=>o.quality===2&&(!o.needs||has(o.needs)));if(!good.length)return null;const deltas=good.map(o=>equipmentEffects(decisionDelta(e,o),{...e,icon:o.icon}).delta),keys=new Set(deltas.flatMap(d=>Object.keys(d)));return Object.fromEntries([...keys].map(key=>[key,Math.min(...deltas.map(d=>d[key]||0))]))}

export function simulateFlightPlan(load,id){
 if(!legalLoad(load,id))return null;const live=game.state;let result=null;
 try{
  const initial=loadResources(load,id);game.state={...live,launcher:id,specialty:'none',balanceVersion:29,load:[...load],r:{...initial.r},mass:initial.mass,turn:0,shield:false,uses:Object.fromEntries(MODULES.filter(m=>load.includes(m.id)&&m.uses).map(m=>[m.id,m.uses]))};
  const charges=[],floor={energy:100,life:100,hull:100},record=()=>{for(const k of Object.keys(floor))floor[k]=Math.min(floor[k],game.state.r[k]);return !critical()&&game.state.r.money>0};
  const activate=(id,turn,e)=>{const m=MODULES.find(m=>m.id===id);if(!m||!has(id)||!game.state.uses[id]||id==='shield'||id==='solar'&&e.shadow)return false;if(Object.entries(m.action).some(([k,v])=>v<0&&game.state.r[k]+v<=0))return false;game.state.uses[id]--;apply(m.action);charges.push({turn,id});return true};
  for(let turn=0;turn<12;turn++){
   game.state.turn=turn;const e=game.state.pools[Math.floor(turn/3)][turn%3],delta=conservativeCase(e);if(!delta)return null;
   const task=game.state.taskSchedule[turn+1],mini=task?plannedActivity(task):{},forecast=Object.fromEntries(Object.keys(LABELS).map(k=>[k,Math.min(0,delta[k]||0)+Math.min(0,mini[k]||0)]));
   // All charges are taken before the case: this is a playable sequence, never an action inside a minigame.
   for(let pass=0;pass<18;pass++){
    let changed=false;
    for(const[k,target]of [['energy',12],['life',12],['hull',25],['comm',MISSION_RULES.comm+3],['fuel',MISSION_RULES.fuel+2]]){
     if(game.state.r[k]+forecast[k]>=target)continue;
     const candidates=MODULES.filter(m=>has(m.id)&&game.state.uses[m.id]>0&&(m.action?.[k]||0)>0&&m.id!=='shield'&&!(m.id==='solar'&&e.shadow));
     candidates.sort((a,b)=>((b.action[k]||0)+Object.values(b.action).filter(v=>v<0).reduce((s,v)=>s+v,0))-((a.action[k]||0)+Object.values(a.action).filter(v=>v<0).reduce((s,v)=>s+v,0)));
     if(candidates.some(m=>activate(m.id,turn,e)))changed=true;
    }
    if(!changed)break;
   }
   resolveDelta(delta,{...e,quality:2});if(!record())return null;
   if(task){game.state.turn=turn+1;resolveDelta(mini,{source:ACTIVITY_CONFIG[task].source,quality:2});if(!record())return null}
  }
  if(game.state.r.science>=MISSION_RULES.science&&game.state.r.comm>=MISSION_RULES.comm&&game.state.r.fuel>=MISSION_RULES.fuel){const margin=Math.min(game.state.r.energy,game.state.r.life,game.state.r.hull,game.state.r.money,game.state.r.comm-MISSION_RULES.comm+8,game.state.r.fuel-MISSION_RULES.fuel+8);result={load:[...load],charges,final:{...game.state.r},floor,margin,mass:game.state.mass,version:29}}
 }finally{game.state=live}
 return result;
}

export function findFlightPlan(id){const extras=game.state.offer.filter(key=>!CORE_MODULES.includes(key)),candidates=[];function visit(chosen,offset){const load=[...CORE_MODULES,...chosen];if(legalLoad(load,id))candidates.push(load);if(chosen.length===EXTRA_SLOTS)return;for(let i=offset;i<extras.length;i++)visit([...chosen,extras[i]],i+1)}visit([],0);let best=null;for(const load of candidates){const plan=simulateFlightPlan(load,id);if(plan&&(!best||plan.margin>best.margin||plan.margin===best.margin&&plan.final.science>best.final.science))best=plan}return best}

export function certifyFlight(){const plans={};for(const id of Object.keys(LAUNCHERS)){const plan=findFlightPlan(id);if(!plan)return null;plans[id]=plan}return plans}

export function ensureMissionPlans(){
 if(game.state.balanceVersion<29)return;if(game.state.flightPlans?.version===29)return;
 let plans=certifyFlight();
 for(let attempt=0;!plans&&attempt<12;attempt++){game.state.offer=[...new Set([...drawOffer(),...game.state.load])];plans=certifyFlight()}
 if(!plans){game.state.offer=[...CORE_MODULES,'supercap','thermal','tools','solar','reserveair','camera'];plans=certifyFlight()}
 if(!plans){
  // Bounded authored fallback from the unchanged NASA-sourced catalog; no unverified trip is emitted.
  const titles=[['Una caja se suelta','El panel no confirma su despliegue','Un paquete de telemetría llega incompleto'],['La alarma del aire','La imagen de navegación sale movida','El horario aprieta antes de una maniobra'],['Una señal sugiere hielo','El tubo de muestras quedó abierto','La Tierra no responde'],['Control de temperatura','La ventana de envío es corta','La bomba de agua pierde rendimiento']];
  game.state.pools=titles.map((names,p)=>names.map(title=>enrichEvent(EVENTS.find(e=>e.phase===p&&e.title===title))));
  game.state.taskSchedule={1:'repair',3:'camera',5:'signal',7:'solar',8:'landing',10:'meteor',12:'survey'};plans=certifyFlight();
 }
 if(!plans)throw Error('No se pudo construir una ruta verificable.');
 game.state.flightPlans={version:29,...plans};
}

export function recommendedLoad(){ensureOffer();ensureMissionPlans();return [...(game.state.flightPlans?.[launcherProfile().id]?.load||CORE_MODULES)]}

export function migrateFlightState(){if(!LAUNCHERS[game.state.launcher])game.state.launcher='medium';if(!Number.isFinite(game.state.balanceVersion))game.state.balanceVersion=28;if(game.state.stage==='prep'){game.state.balanceVersion=29;game.state.taskSchedule||={...LEARNING_TASKS};ensureOffer();ensureMissionPlans();calcLoad()}}

export function launchRecord(){const p=launcherProfile();return{profile:p.id,name:p.name,budget:FLIGHT_BUDGET,cost:p.cost,maxMass:p.maxMass,mass:game.state.mass,equipmentCost:MODULES.filter(m=>has(m.id)).reduce((s,m)=>s+m.cost,0),operatingReserve:game.state.r.money}}
