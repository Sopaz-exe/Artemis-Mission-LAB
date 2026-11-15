// ARTEMIS MISSION LAB v3.0 · Native ES modules, no runtime libraries.
import { activityRuntime } from './activities.js';
import { uiText } from './i18n.js';
import { game } from './main.js';
import { $ } from './render.js';

export const sound={audioOn:true,audioCtx:null,engineSound:null,lastAlarmAt:-Infinity,audioWarnings:new Set(),musicEnabled:true,musicTransport:null,musicDuckUntil:0,soundscapeSeed:918273,lastUiHover:-Infinity,lastUiSelect:-Infinity,lastOutcomeCue:'',lastOutcomeTime:-Infinity,audioMix:null,cinemaSound:null};

export function ensureAudio(){if(!sound.audioOn)return null;try{sound.audioCtx ||=new(window.AudioContext||window.webkitAudioContext)();return sound.audioCtx}catch{return null}}

export function audioNote(ctx,freq,start,duration,level=.035){const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='sine';oscillator.frequency.value=freq;gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(level,start+.015);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);oscillator.connect(gain);gain.connect(audioDestination());oscillator.onended=()=>{oscillator.disconnect();gain.disconnect()};oscillator.start(start);oscillator.stop(start+duration+.02)}

export function setEngineSound(on){if(!on||!sound.audioOn){if(sound.engineSound){const old=sound.engineSound;sound.engineSound=null;old.gain.gain.cancelScheduledValues(old.ctx.currentTime);old.gain.gain.setTargetAtTime(.0001,old.ctx.currentTime,.025);old.source.stop(old.ctx.currentTime+.12)}return}if(sound.engineSound)return;const ctx=ensureAudio();if(!ctx)return;const buffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=soundRandom()*2-1;const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=620;filter.Q.value=.7;gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.014,ctx.currentTime+.08);source.connect(filter);filter.connect(gain);gain.connect(audioDestination());source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};source.start();sound.engineSound={ctx,source,filter,gain}}

export function audioFrame(){updateAmbientMusic();const active=sound.audioOn&&!document.hidden&&!game.cinema&&!$('#modal').open;setEngineSound(!!(active&&activityRuntime.activity?.type==='landing'&&activityRuntime.activity.started&&activityRuntime.activity.lander.started&&activityRuntime.activity.lander.thrust&&activityRuntime.activity.lander.fuel>0));if(!active||!game.state||!['mission','activity'].includes(game.state.stage))return;let crossed=false;for(const key of ['energy','life','comm','hull','fuel','money']){if(game.state.r[key]>=25)sound.audioWarnings.delete(key);else if(!sound.audioWarnings.has(key)){sound.audioWarnings.add(key);crossed=true}}if(crossed&&sound.audioCtx&&sound.audioCtx.currentTime-sound.lastAlarmAt>=4){sound.lastAlarmAt=sound.audioCtx.currentTime;tone('alarm')}}

export const AMBIENT_CHORDS=[[50,57,62,64,65],[46,53,57,60,65],[48,55,60,62,65],[43,50,55,57,62]];

export const MUSIC_STEP=1.25;

export function soundRandom(){sound.soundscapeSeed=(Math.imul(sound.soundscapeSeed,1664525)+1013904223)>>>0;return sound.soundscapeSeed/4294967296}

export function noteFrequency(midi){return 440*Math.pow(2,(midi-69)/12)}

export function createMusicTransport(ctx){const input=ctx.createGain(),dry=ctx.createGain(),master=ctx.createGain();dry.gain.value=.82;master.gain.value=.0001;input.connect(dry);dry.connect(master);master.connect(audioDestination('music'));const transport={ctx,input,master,playing:false,step:0,next:0,voices:new Set()};if(ctx.createConvolver){const reverb=ctx.createConvolver(),wet=ctx.createGain(),length=Math.floor(ctx.sampleRate*2.8),impulse=ctx.createBuffer(2,length,ctx.sampleRate);for(let channel=0;channel<2;channel++){const samples=impulse.getChannelData(channel);for(let i=0;i<length;i++)samples[i]=(soundRandom()*2-1)*Math.pow(1-i/length,3.3)*.3}reverb.buffer=impulse;wet.gain.value=.26;input.connect(reverb);reverb.connect(wet);wet.connect(master);transport.reverb=reverb;transport.wet=wet}return transport}

export function musicVoice(transport,midi,at,duration,level,type='sine',pan=0,attack=.08){const ctx=transport.ctx,source=ctx.createOscillator(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.type=type;source.frequency.value=noteFrequency(midi);filter.type='lowpass';filter.frequency.value=type==='triangle'?850:2200;gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(level,at+attack);gain.gain.setValueAtTime(level,at+Math.max(attack,duration*.55));gain.gain.exponentialRampToValueAtTime(.0001,at+duration);source.connect(filter);filter.connect(gain);let panner=null;if(ctx.createStereoPanner){panner=ctx.createStereoPanner();panner.pan.value=pan;gain.connect(panner);panner.connect(transport.input)}else gain.connect(transport.input);transport.voices.add(source);source.onended=()=>{transport.voices.delete(source);source.disconnect();filter.disconnect();gain.disconnect();panner?.disconnect()};source.start(at);source.stop(at+duration+.04)}

export function scheduleAmbientStep(transport){const step=transport.step,chord=AMBIENT_CHORDS[Math.floor(step/8)%AMBIENT_CHORDS.length],at=transport.next;if(step%8===0){chord.forEach((midi,i)=>musicVoice(transport,midi,at,12,.023,i%2?'triangle':'sine',(i-2)*.3,2.1))}const bell=[0,null,3,null,1,null,2,null][step%8];if(bell!==null)musicVoice(transport,chord[bell]+12,at+.08,2.7,.032,'sine',Math.sin(step*.7)*.45,.025);if(step%4===0)musicVoice(transport,chord[0]-12,at,3,.028,'sine',0,.55);transport.step++;transport.next+=MUSIC_STEP}

export function stopAmbientMusic(){if(!sound.musicTransport?.playing)return;const transport=sound.musicTransport,now=transport.ctx.currentTime;transport.playing=false;transport.master.gain.cancelScheduledValues(now);transport.master.gain.setTargetAtTime(.0001,now,.035);for(const voice of transport.voices){try{voice.stop(now+.14)}catch{}}}

export function updateAmbientMusic(){if(!sound.audioOn||!sound.musicEnabled||document.hidden){stopAmbientMusic();return}const ctx=ensureAudio();if(!ctx||ctx.state==='closed')return;if(!sound.musicTransport||sound.musicTransport.ctx!==ctx)sound.musicTransport=createMusicTransport(ctx);const transport=sound.musicTransport;if(!transport.playing){transport.playing=true;transport.step=0;transport.next=ctx.currentTime+.06}if(transport.next<ctx.currentTime-.5){transport.step=Math.ceil(transport.step/8)*8;transport.next=ctx.currentTime+.06}const target=(game.cinema||ctx.currentTime<sound.musicDuckUntil)? .42 : .85;transport.master.gain.setTargetAtTime(target,ctx.currentTime,.18);let guard=0;while(transport.next<ctx.currentTime+.2&&guard++<12)scheduleAmbientStep(transport)}

export function updateMusicButton(){const button=$('#music');if(!button)return;const enabled=sound.audioOn&&sound.musicEnabled;button.textContent=uiText(enabled?'Música: activada':'Música: apagada');button.setAttribute('aria-pressed',String(enabled))}

export function toggleAmbientMusic(){if(!sound.audioOn){sound.musicEnabled=true;setAudioEnabled(true)}else{sound.musicEnabled=!sound.musicEnabled;if(sound.musicEnabled)updateAmbientMusic();else{stopAmbientMusic();stopCinemaSound('music')}updateMusicButton()}}

export function faultNoise(ctx,at){const length=Math.max(1,Math.floor(ctx.sampleRate*.14)),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=soundRandom()*2-1;const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=buffer;filter.type='bandpass';filter.frequency.value=1150;filter.Q.value=.7;gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.012,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+.14);source.connect(filter);filter.connect(gain);gain.connect(audioDestination());source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};source.start(at);source.stop(at+.15)}

export function tone(kind=500,duration=.12){const ctx=ensureAudio();if(!ctx||document.hidden)return;const now=ctx.currentTime,cue=kind==='confirm'?'correct':kind;if(cue==='hover'){if(now-sound.lastUiHover<.12)return;sound.lastUiHover=now;audioNote(ctx,880,now,.055,.009);return}if(cue==='select'){if(now-sound.lastUiSelect<.08)return;sound.lastUiSelect=now;audioNote(ctx,660,now,.075,.018);return}if(['correct','error','partial'].includes(cue)){if(cue===sound.lastOutcomeCue&&now-sound.lastOutcomeTime<.18)return;sound.lastOutcomeCue=cue;sound.lastOutcomeTime=now;sound.musicDuckUntil=now+1;if(cue==='correct'){[523.25,659.25,783.99].forEach((f,i)=>audioNote(ctx,f,now+i*.075,i===2?.3:.17,.028))}else if(cue==='error'){[196,146.83,98].forEach((f,i)=>audioNote(ctx,f,now+i*.09,.24,.032));faultNoise(ctx,now+.025)}else{audioNote(ctx,392,now,.2,.022);audioNote(ctx,329.63,now+.15,.27,.02)}return}if(cue==='alarm'){audioNote(ctx,392,now,.11,.025);audioNote(ctx,311.13,now+.15,.14,.025)}else audioNote(ctx,Number(cue)||500,now,duration,.035)}

export function setAudioEnabled(enabled){sound.audioOn=!!enabled;if(enabled){unlockSound()}else{if(sound.audioMix)sound.audioMix.master.gain.setTargetAtTime(0,sound.audioMix.ctx.currentTime,.008);setEngineSound(false);stopAmbientMusic();stopCinemaSound()}$('#audio').textContent=uiText(`Sonido: ${enabled?'activado':'apagado'}`);$('#audio').setAttribute('aria-pressed',String(sound.audioOn));updateMusicButton();if(enabled)tone('select')}

export function soundOptionTarget(target){return target?.closest?.('[data-launcher],[data-option],[data-module],[data-specialty],[data-answer],[data-meteor],[data-spectrum],[data-plug],[data-socket]')||null}

export function initSoundscape(){document.addEventListener('pointerdown',unlockSound,true);document.addEventListener('keydown',unlockSound,true);const button=$('#music');if(button)button.onclick=toggleAmbientMusic;document.addEventListener('pointerover',e=>{const target=soundOptionTarget(e.target);if(!target||target.disabled||target===soundOptionTarget(e.relatedTarget))return;tone('hover')});document.addEventListener('focusin',e=>{const target=soundOptionTarget(e.target);if(target&&!target.disabled)tone('hover')});document.addEventListener('click',e=>{unlockSound();const button=e.target?.closest?.('button');if(button&&!button.disabled&&!['audio','music'].includes(button.id))tone('select')},true);document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAmbientMusic();stopCinemaSound();setEngineSound(false)}else if(sound.audioOn)unlockSound()});$('#audio').textContent=uiText('Sonido: activado');$('#audio').setAttribute('aria-pressed','true');updateMusicButton();unlockSound()}

export function audioDestination(channel='effects'){
 const ctx=sound.audioCtx;if(!ctx)return null;
 if(!sound.audioMix||sound.audioMix.ctx!==ctx){
  const master=ctx.createGain(),effects=ctx.createGain(),music=ctx.createGain();
  master.gain.value=sound.audioOn?1:0;effects.gain.value=2.8;music.gain.value=1.6;
  effects.connect(master);music.connect(master);
  let limiter=null;
  if(ctx.createDynamicsCompressor){limiter=ctx.createDynamicsCompressor();limiter.threshold.value=-12;limiter.knee.value=18;limiter.ratio.value=4;limiter.attack.value=.008;limiter.release.value=.24;master.connect(limiter);limiter.connect(ctx.destination)}else master.connect(ctx.destination);
  sound.audioMix={ctx,master,effects,music,limiter};
 }
 return sound.audioMix[channel]||sound.audioMix.effects;
}

export function unlockSound(){
 if(!sound.audioOn||document.hidden)return;
 const ctx=ensureAudio();if(!ctx)return;
 if(ctx.state==='suspended'){try{ctx.resume()?.catch?.(()=>{})}catch{}}
 audioDestination();sound.audioMix.master.gain.setTargetAtTime(1,ctx.currentTime,.015);
 updateAmbientMusic();
}

export function sceneVoice(group,source,offset,duration,level,channel='effects',filter=null){
 const ctx=group.ctx,at=group.at+offset,gain=ctx.createGain(),attack=Math.min(.14,duration*.2);
 gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(level,at+attack);gain.gain.setValueAtTime(level,at+duration*.55);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
 if(filter){source.connect(filter);filter.connect(gain)}else source.connect(gain);
 gain.connect(audioDestination(channel));const voice={source,gain,filter,channel};group.voices.add(voice);
 source.onended=()=>{group.voices.delete(voice);source.disconnect();gain.disconnect();filter?.disconnect()};
 source.start(at);source.stop(at+duration+.03);return voice;
}

export function sceneTone(group,frequency,endFrequency,offset,duration,level,type='sine',channel='effects'){
 const source=group.ctx.createOscillator();source.type=type;source.frequency.setValueAtTime(frequency,group.at+offset);source.frequency.exponentialRampToValueAtTime(Math.max(20,endFrequency),group.at+offset+duration);
 return sceneVoice(group,source,offset,duration,level,channel);
}

export function sceneNoise(group,offset,duration,level,frequency,endFrequency,type='lowpass'){
 const ctx=group.ctx,length=Math.max(1,Math.ceil(ctx.sampleRate*duration)),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<length;i++)data[i]=soundRandom()*2-1;
 const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter();source.buffer=buffer;filter.type=type;filter.Q.value=.6;filter.frequency.setValueAtTime(frequency,group.at+offset);filter.frequency.exponentialRampToValueAtTime(endFrequency,group.at+offset+duration);
 return sceneVoice(group,source,offset,duration,level,'effects',filter);
}

export function stopCinemaSound(channel=null){
 if(!sound.cinemaSound)return;const group=sound.cinemaSound,now=group.ctx.currentTime;
 for(const voice of group.voices){if(channel&&voice.channel!==channel)continue;voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setTargetAtTime(.0001,now,.012);try{voice.source.stop(now+.055)}catch{}}
 if(!channel)sound.cinemaSound=null;
}

export function playCinemaSound(type,cue){
 stopCinemaSound();const ctx=ensureAudio();if(!ctx||document.hidden)return;
 const duration=Math.max(.2,game.cinema?.duration||2.8),group={ctx,at:ctx.currentTime,voices:new Set(),type};sound.cinemaSound=group;
 const span=Math.min(duration,4.5),at=(fraction)=>span*fraction;
 // The result cue remains explicit; cinematic layers follow the actual animation type.
 if(type!=='death')tone(cue||(type==='damage'?'error':type==='success'?'correct':'select'));
 if(type==='launch'){
  sceneNoise(group,0,span,.12,260,1750);sceneTone(group,58,104,0,span,.045,'triangle');
 }else if(type==='death'){
  sceneNoise(group,0,at(.35),.045,1400,180,'bandpass');
  sceneTone(group,220,55,0,at(.83),.045,'triangle');
  for(let i=0;i<3;i++)sceneTone(group,660,440,at(i*.18),at(.11),.023);
 }else if(type==='damage'){
  sceneNoise(group,0,Math.min(.45,span),.07,1800,160);sceneTone(group,90,32,0,Math.min(.7,span),.045);
 }else if(type==='landing'){
  sceneNoise(group,0,Math.min(.7,span),.055,650,130);sceneTone(group,105,48,0,Math.min(.8,span),.025);
 }else if(type==='camera'){
  sceneNoise(group,0,Math.min(.09,span),.055,3800,1200,'bandpass');
 }else if(['signal','antenna'].includes(type)){
  for(let i=0;i<3;i++)sceneTone(group,740+i*110,860+i*110,at(i*.13),at(.1),.014);
 }else if(['water','oxygen','recycle'].includes(type)){
  sceneNoise(group,0,at(.65),.026,550,850,'bandpass');
 }
 if(sound.musicEnabled){
  const notes=type==='death'?[50,53,57]:type==='success'?[60,64,67,72]:type==='launch'?[50,57,62]:cue==='error'?[45,52,58]:[50,57,65];
  notes.forEach((midi,i)=>sceneTone(group,noteFrequency(midi),noteFrequency(midi),at(i*.045),at(.76),.028,'sine','music'));
 }
 sound.musicDuckUntil=ctx.currentTime+span;
}
