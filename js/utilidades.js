// ==================== FUNCIONES UTILITARIAS ====================
function obtenerColorAleatorio(letra) {
  if (coloresPorInicial[letra]) return coloresPorInicial[letra];
  const colores = ['#e91e63','#9c27b0','#673ab7','#3f51b5','#2196f3','#009688','#4caf50','#ff9800','#f44336','#795548','#607d8b','#e53935','#8e24aa','#3949ab','#1e88e5','#00897b','#43a047','#fb8c00','#d32f2f','#5d4037','#455a64'];
  const color = colores[letra.charCodeAt(0) % colores.length];
  coloresPorInicial[letra] = color;
  return color;
}

function getInicial(nombre) { return nombre?.charAt(0).toUpperCase() || '?'; }

function calcularDistancia(lat1, lon1, lat2, lon2) {
  if(!lat1||!lon1||!lat2||!lon2) return null;
  const R=6371;const dLat=(lat2-lat1)*Math.PI/180;const dLon=(lon2-lon1)*Math.PI/180;
  const a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)));
}

function mostrarDialogoMascota(texto) {
  const d=document.getElementById('mascotaDialogo');if(!d)return;
  d.innerText=texto;d.classList.remove('hidden');
  clearTimeout(dialogoMascotaTimeout);
  dialogoMascotaTimeout=setTimeout(()=>d.classList.add('hidden'),4000);
}

function reaccionarMascota(tipo) {
  const m=document.getElementById('mascotaVirtual');if(!m||m.classList.contains('hidden'))return;
  const mascota=mascotasTienda.find(x=>x.id===userActual?.mascota)||mascotasTienda[0];
  let mensaje='';
  if(tipo==='like')mensaje=mascota.reaccionLike||'¡Like!';
  else if(tipo==='match')mensaje=mascota.reaccionMatch||'¡Match!';
  else if(tipo==='mensaje')mensaje=mascota.reaccionMensaje||'¡Mensaje!';
  m.classList.add('reaccion');setTimeout(()=>m.classList.remove('reaccion'),600);
  mostrarDialogoMascota(mensaje);
}

function calcularCompatibilidad(u) {
  if(!userActual||!u)return 0;
  let puntos=0,total=0;
  const mi=userActual.intereses||[],si=u.intereses||[];
  if(mi.length||si.length){const c=mi.filter(i=>si.includes(i));total+=Math.max(mi.length,si.length);puntos+=c.length*2;}
  const me=userActual.etiquetas||[],se=u.etiquetas||[];
  if(me.length||se.length){const c=me.filter(e=>se.includes(e));total+=Math.max(me.length,se.length);puntos+=c.length*2;}
  const mp=userActual.preguntas||{},sp=u.preguntas||{};
  const pk=Object.keys(mp).filter(k=>sp[k]!==undefined);
  if(pk.length){total+=pk.length;const c=pk.filter(k=>mp[k]===sp[k]);puntos+=c.length*3;}
  if(total===0)return 50;
  return Math.round((puntos/total)*100);
}

function getClaseCompatibilidad(pct){if(pct>=80)return'compatibilidad-alta';if(pct>=50)return'compatibilidad-media';return'compatibilidad-baja';}

function getNivel(xp){const nivel=Math.floor(xp/100)+1;const titulo=titulosNivel.filter(t=>nivel>=t.min).pop()||titulosNivel[0];return{nivel,titulo:titulo.titulo,xpActual:xp%100,xpNecesaria:100};}

function ganarXP(cantidad){
  if(!userActual)return;userActual.xp=(userActual.xp||0)+cantidad;
  const na=getNivel(userActual.xp-cantidad),nn=getNivel(userActual.xp);
  if(nn.nivel>na.nivel){userActual.puntos+=nn.nivel*20;mostrarToast(`🎉 ¡Nivel ${nn.nivel}: ${nn.titulo}! +${nn.nivel*20}pts`,'success');}
  actualizarNivelUI();guardarTodo();
}

function actualizarNivelUI(){
  if(!userActual)return;const{nivel,titulo,xpActual,xpNecesaria}=getNivel(userActual.xp||0);
  const en=document.getElementById('nivelActual'),et=document.getElementById('nivelTitulo'),ep=document.getElementById('nivelProgreso'),ex=document.getElementById('xpActual'),en2=document.getElementById('xpNecesaria');
  if(en)en.innerText=nivel;if(et)et.innerText=titulo;if(ep)ep.style.width=(xpActual/xpNecesaria*100)+'%';if(ex)ex.innerText=xpActual;if(en2)en2.innerText=xpNecesaria;
}

function actualizarRachaVictorias(juego,gano){
  if(!userActual)return;if(!rachaVictorias[juego])rachaVictorias[juego]=0;
  if(gano){rachaVictorias[juego]++;if(rachaVictorias[juego]===3){userActual.puntos+=10;mostrarToast('🔥 Racha de 3! +10pts','success');}if(rachaVictorias[juego]===5){userActual.puntos+=25;mostrarToast('🔥 Racha de 5! +25pts','success');}if(rachaVictorias[juego]===7){userActual.puntos+=50;mostrarToast('🔥 Racha de 7! +50pts','success');}if(rachaVictorias[juego]===10){userActual.puntos+=100;mostrarToast('🏆 10 victorias! +100pts','success');}}
  else{rachaVictorias[juego]=0;}guardarTodo();
}

function seleccionarMinijuegos(){
  const ahora=new Date();const hb=Math.floor(ahora.getHours()/2);const seed=ahora.toDateString()+'_'+hb;
  let hash=0;for(let i=0;i<seed.length;i++){hash=((hash<<5)-hash)+seed.charCodeAt(i);hash|=0;}
  const i1=Math.abs(hash)%poolMinijuegos.length;const i2=Math.abs(hash+1)%poolMinijuegos.length;
  return[poolMinijuegos[i1],poolMinijuegos[i1===i2?(i2+1)%poolMinijuegos.length:i2]];
}

function actualizarMinijuegosUI(){
  minijuegosActuales=seleccionarMinijuegos();const c=document.getElementById('minijuegosContainer'),t=document.getElementById('minijuegosTimer');if(!c||!t)return;
  c.innerHTML=minijuegosActuales.map(m=>`<div class="minijuego-card" onclick="window.iniciarMinijuego('${m.id}')"><span style="font-size:24px;">${m.icono}</span><b>${m.nombre}</b><small style="display:block;color:var(--text-secondary);">${m.desc} (+${m.pts}pts)</small></div>`).join('');
  actualizarTimerMinijuegos();if(timerMinijuegos)clearInterval(timerMinijuegos);timerMinijuegos=setInterval(actualizarTimerMinijuegos,30000);
}

function actualizarTimerMinijuegos(){const t=document.getElementById('minijuegosTimer');if(!t)return;const a=new Date();const mr=120-(a.getMinutes()%120);t.innerText=`⏰ Nuevos en ${Math.floor(mr/60)}h ${mr%60}min`;}

// ==================== FUNCIONES PRINCIPALES ====================
let isOnline=navigator.onLine;
window.addEventListener('online',()=>{isOnline=true;document.getElementById('offlineBanner').classList.remove('show');});
window.addEventListener('offline',()=>{isOnline=false;document.getElementById('offlineBanner').classList.add('show');});
function mostrarLoading(){document.getElementById('loadingOverlay').classList.remove('hidden');}
function ocultarLoading(){document.getElementById('loadingOverlay').classList.add('hidden');}

window.mostrarPagina=function(pag){
  ['paginaLogin','paginaRegistro','paginaRecuperar','paginaApp'].forEach(x=>{const e=document.getElementById(x);if(e)e.classList.add('hidden');});
  const p=document.getElementById('pagina'+pag.charAt(0).toUpperCase()+pag.slice(1));if(p)p.classList.remove('hidden');
  document.getElementById('bottomNav').classList.toggle('hidden',pag!=='app');
  if(pag==='app')document.getElementById('mainContainer').style.paddingBottom='80px';
  else document.getElementById('mainContainer').style.paddingBottom='0';
  setTimeout(()=>feather.replace(),100);
};

window.mostrar=function(id){
  const sa=document.querySelector('.seccion:not(.hidden)'),ns=document.getElementById(id);if(sa===ns)return;
  if(sa){sa.classList.add('saliendo');setTimeout(()=>{sa.classList.add('hidden');sa.classList.remove('seccion','saliendo');},200);}
  setTimeout(()=>{ns.classList.remove('hidden');ns.classList.add('seccion');},sa?200:0);
  document.querySelectorAll('.bottom-nav button').forEach(b=>b.classList.remove('activo'));
  const nm={descubrir:'navDescubrir',chats:'navChats',juegos:'navJuegos',perfil:'navPerfil'};
  if(nm[id])document.getElementById(nm[id]).classList.add('activo');
  document.getElementById('bottomNav').classList.remove('hidden');
  setTimeout(()=>feather.replace(),50);
  if(id==='descubrir'){cargarUsuarios();actualizarBadgeSolicitudes();mostrarFiltrosActivos();}
  else if(id==='chats'){cargarListaChats();actualizarBadgeChats();}
  else if(id==='juegos'){cargarMisiones();cargarRankingTop();actualizarUI();verificarRacha();actualizarNivelUI();actualizarMinijuegosUI();verificarRuletaDiaria();}
  else if(id==='perfil'){cargarPerfil();actualizarInsignias();cargarListaMatchesPerfil();cargarGaleriaPerfil();actualizarEtiquetasPerfil();}
  setTimeout(()=>feather.replace(),300);
};

async function guardarTodo(){if(!userActual)return;userActual.chatsNoLeidos=chatsNoLeidos;userActual.chatsFijados=chatsFijados;await setDoc(doc(db,"usuarios",userActual.uid),userActual);localStorage.setItem('mg_uid',userActual.uid);}
async function cargarTodosUsuarios(){const snap=await getDocs(collection(db,"usuarios"));usuarios=snap.docs.map(d=>d.data());}

// ==================== GEOLOCALIZACIÓN ====================
function obtenerUbicacion(){if(!navigator.geolocation)return;navigator.geolocation.getCurrentPosition(pos=>{ubicacionUsuario={lat:pos.coords.latitude,lon:pos.coords.longitude};if(userActual){userActual.ubicacion=ubicacionUsuario;guardarTodo();}},()=>{},{enableHighAccuracy:false,timeout:10000});}

// ==================== PULL TO REFRESH (TODAS LAS SECCIONES) ====================
function iniciarPullToRefresh(){
  const container=document.getElementById('mainContainer');const indicator=document.getElementById('pullIndicator');
  if(!container||!indicator)return;
  let ps=0,pd=0,pr=false;
  container.addEventListener('touchstart',(e)=>{if(container.scrollTop<=0&&!pr){ps=e.touches[0].clientY;}},{passive:true});
  container.addEventListener('touchmove',(e)=>{if(pr)return;if(container.scrollTop<=0){pd=e.touches[0].clientY-ps;if(pd>30){indicator.classList.add('activo');}}},{passive:true});
  container.addEventListener('touchend',async()=>{if(pd>60&&!pr){pr=true;indicator.classList.add('activo');await cargarTodosUsuarios();const id=document.querySelector('.seccion:not(.hidden)')?.id;if(id==='descubrir')cargarUsuarios();else if(id==='chats')cargarListaChats();else if(id==='juegos'){cargarRankingTop();cargarMisiones();actualizarUI();}else if(id==='perfil'){cargarPerfil();cargarListaMatchesPerfil();}actualizarUI();pr=false;pd=0;ps=0;setTimeout(()=>indicator.classList.remove('activo'),500);}else{pd=0;ps=0;indicator.classList.remove('activo');}});
}

// ==================== MODO OSCURO ====================
window.toggleModoOscuro=function(){document.body.classList.toggle('dark-mode');const e=document.body.classList.contains('dark-mode');document.getElementById('btnModoOscuro').innerText=e?'☀️':'🌙';if(userActual){userActual.modoOscuro=e;guardarTodo();}};

// ==================== RACHA DIARIA ====================
function verificarRacha(){
  if(!userActual)return;const hoy=new Date().toDateString();
  if(!userActual.ultimaConexion||userActual.ultimaConexion!==hoy){const ayer=new Date();ayer.setDate(ayer.getDate()-1);const ayerStr=ayer.toDateString();if(userActual.ultimaConexion===ayerStr){userActual.racha=(userActual.racha||0)+1;}else{userActual.racha=1;}userActual.ultimaConexion=hoy;const pr=Math.min(userActual.racha*5,50);userActual.puntos+=pr;guardarTodo();actualizarUI();if(userActual.racha>1)mostrarToast(`🔥 Racha de ${userActual.racha} días! +${pr}pts`,'success');}
  const ri=document.getElementById('rachaIndicador');if(ri&&userActual.racha>1){ri.style.display='inline-flex';document.getElementById('rachaDias').innerText=userActual.racha;}
}

// ==================== SUPER LIKE ====================
window.abrirModalSuperLike=function(uid){if(userActual.puntos<50)return mostrarToast('Necesitas 50 puntos','warning');uidLikePendiente=uid;esSuperLike=true;document.getElementById('modalMensajeLike').classList.remove('hidden');const u=usuarios.find(x=>x.uid===uid);document.getElementById('nombreLikeMensaje').innerText=u?.user||'Usuario';};
window.enviarSuperLike=async function(){if(!uidLikePendiente||userActual.puntos<50)return;userActual.puntos-=50;esSuperLike=true;const msg=document.getElementById('mensajeLike').value.trim();document.getElementById('modalMensajeLike').classList.add('hidden');const overlay=document.createElement('div');overlay.className='superlike-overlay';document.body.appendChild(overlay);setTimeout(()=>overlay.remove(),800);for(let i=0;i<20;i++){const s=document.createElement('span');s.innerText='⭐';s.className='particula-amor';s.style.left=Math.random()*80+10+'%';s.style.bottom='15%';s.style.fontSize='30px';s.style.animationDelay=i*0.05+'s';document.body.appendChild(s);setTimeout(()=>s.remove(),1500);}await darLikeDirecto(uidLikePendiente,msg?`⭐ SUPER LIKE: ${msg}`:'⭐ SUPER LIKE!');uidLikePendiente=null;esSuperLike=false;await guardarTodo();actualizarUI();};

// PUNTOS DESDE FIRESTORE
window.actualizarUI=async function(){if(!userActual)return;try{const ds=await getDoc(doc(db,"usuarios",userActual.uid));if(ds.exists()){userActual.puntos=ds.data().puntos||0;userActual.xp=ds.data().xp||0;}}catch(e){}document.getElementById('puntosUser').innerText=userActual.puntos;document.getElementById('puntosTienda').innerText=userActual.puntos;await cargarTodosUsuarios();actualizarBadgeSolicitudes();actualizarBadgeChats();actualizarNivelUI();};

function actualizarBadgeSolicitudes(){if(!userActual)return;const n=userActual.likesRecibidos?.length||0;const bl=document.getElementById('badgeSolicitudes');if(bl){bl.innerText=n;bl.classList.toggle('hidden',n<=0);}}
function actualizarBadgeChats(){const c=Object.values(chatsNoLeidos).filter(n=>n>0).length;mensajesNoLeidos=c;const bn=document.getElementById('badgeNavChats');if(bn){bn.innerText=c;bn.classList.toggle('hidden',c<=0);}}

// MASCOTA
function actualizarMascota(){const m=document.getElementById('mascotaVirtual');if(!userActual?.mascota){m.classList.add('hidden');return;}m.classList.remove('hidden');const ma=mascotasTienda.find(x=>x.id===userActual.mascota)||mascotasTienda[0];m.innerText=ma.icono;}
window.clickMascota=function(){const ma=mascotasTienda.find(x=>x.id===userActual?.mascota)||mascotasTienda[0];const d=[ma.dialogo,`${userActual?.puntos||0} puntos`,'¡Sigue así!','Revisa tus matches','¡A jugar!',`${userActual?.matches?.length||0} matches`];mostrarDialogoMascota(d[Math.floor(Math.random()*d.length)]);};

// ESTADOS
window.cambiarEstado=function(){document.getElementById('menuPerfil')?.classList.add('hidden');document.getElementById('selectEstado').value=userActual.estado||'online';document.getElementById('modalEstado').classList.remove('hidden');};
window.guardarEstado=async function(){userActual.estado=document.getElementById('selectEstado').value;await guardarTodo();cargarPerfil();document.getElementById('modalEstado').classList.add('hidden');mostrarToast('Estado actualizado','success');};
window.cerrarModalEstado=function(){document.getElementById('modalEstado').classList.add('hidden');};

// MENÚ CHAT
window.toggleMenuChat=function(){const m=document.getElementById('menuChatFlotante');if(m)m.classList.toggle('hidden');};
document.addEventListener('click',function(e){const m=document.getElementById('menuChatFlotante');const b=e.target.closest('[onclick*="toggleMenuChat"]');if(m&&!m.classList.contains('hidden')&&!b&&!m.contains(e.target)){m.classList.add('hidden');}});

// ==================== HTML DE PERFIL ====================
function crearHTMLPerfil(u, esMatch, mostrarBotones = true) {
  const ic = (userActual?.intereses||[]).filter(i=>(u.intereses||[]).includes(i));
  const interesesHTML = ic.length ? `<p class="intereses">🎯 ${ic.join(', ')}</p>` : '';
  const claseMarco = u.marco ? ' marco-'+u.marco : '';
  const claseColor = u.colorNombre ? ' nombre-'+u.colorNombre : '';
  const fondoEstilo = u.fondo ? `background:linear-gradient(135deg,${u.fondo.color1||'#fff'},${u.fondo.color2||'#f0f0f0'});` : '';
  const estadoObj = estadosDisponibles.find(e=>e.id===u.estado) || estadosDisponibles[0];
  const estadoHTML = u.estado ? `<span class="estado-badge ${estadoObj.clase}">${estadoObj.icono} ${estadoObj.texto}</span>` : '';
  const compatibilidad = calcularCompatibilidad(u);
  const compatHTML = `<span class="compatibilidad-badge ${getClaseCompatibilidad(compatibilidad)}">💖 ${compatibilidad}%</span>`;
  const etiquetasHTML = (u.etiquetas||[]).length ? `<div style="margin:3px 0;">${u.etiquetas.map(e=>`<span class="etiqueta-pers">${e}</span>`).join('')}</div>` : '';
  let distanciaHTML = '';
  if(ubicacionUsuario && u.ubicacion && u.ubicacion.lat && u.ubicacion.lon) {const dist = calcularDistancia(ubicacionUsuario.lat, ubicacionUsuario.lon, u.ubicacion.lat, u.ubicacion.lon);if(dist!==null) distanciaHTML = `<span style="font-size:11px;color:var(--text-secondary);">📏 A ${dist} km</span>`;}
  let fotosHTML = '';
  const todasLasFotos = [u.foto, ...(u.fotosGaleria||[])].filter(f=>f);
  if (todasLasFotos.length > 1) {fotosHTML = `<div class="fotos-slider"><div class="slides" id="slides_${u.uid}">${todasLasFotos.map(f=>`<div class="slide" style="background-image:url(${f})" onclick="abrirVisorFoto('${f}',false,${todasLasFotos.indexOf(f)},'usuario')"></div>`).join('')}</div><div class="dots">${todasLasFotos.map((_,i)=>`<span class="dot${i===0?' activo':''}" onclick="window.cambiarSlide('${u.uid}',${i})"></span>`).join('')}</div></div>`;}
  else if (u.foto) {fotosHTML = `<div class="perfil-foto${claseMarco}" style="background-image:url(${u.foto})" onclick="abrirVisorFoto('${u.foto}',false,0,'usuario')"></div>`;}
  else {fotosHTML = `<div class="perfil-foto${claseMarco}" style="background:${obtenerColorAleatorio(getInicial(u.user))};display:flex;align-items:center;justify-content:center;font-size:70px;color:white;font-weight:700;">${getInicial(u.user)}</div>`;}
  let botonesHTML = '';
  if (mostrarBotones && !esMatch) {botonesHTML = `<div class="perfil-botones-flotantes"><button class="btn-dating btn-dating-no" onclick="pasarConAnimacionDescubrir('${u.uid}')"><i data-feather="x"></i></button><button class="btn-dating btn-dating-super" onclick="window.abrirModalSuperLike('${u.uid}')">⭐</button><button class="btn-dating btn-dating-si" onclick="window.abrirModalMensajeLike('${u.uid}')"><i data-feather="heart"></i></button></div>`;}
  else if (esMatch) {botonesHTML = `<div style="display:flex;gap:6px;padding:0 14px 14px;flex-wrap:wrap;"><button class="btn-eliminar" onclick="eliminarMatch('${u.uid}')" style="flex:1;font-size:11px;padding:6px;min-height:auto;border-radius:16px;">Eliminar</button><button onclick="enviarMensajeDesdePerfil('${u.uid}')" style="flex:1;font-size:11px;padding:6px;min-height:auto;border-radius:16px;background:var(--primary);color:white;">Mensaje</button><button class="btn-regalo" onclick="window.abrirEnviarRegalo('${u.uid}')" style="flex:1;font-size:11px;padding:6px;min-height:auto;border-radius:16px;">Regalo</button></div>`;}
  return `<div class="perfil-card" style="${fondoEstilo}">${fotosHTML}${mostrarBotones&&!esMatch?botonesHTML:''}<div class="perfil-info"><h2 class="${claseColor.trim()}">${u.user}, ${u.edad||'?'} ${u.emailVerificado?'<span class="badge-verificado"><i data-feather="check" style="width:10px;height:10px;"></i> Verificado</span>':''}</h2>${compatHTML}${etiquetasHTML}<p class="ciudad">📍 ${u.ciudad||'Ciudad desconocida'}, Chile ${distanciaHTML}</p>${estadoHTML?`<p>${estadoHTML}</p>`:''}<p class="bio">${u.bio||'Sin bio'}</p>${interesesHTML}</div>${esMatch?botonesHTML:''}${u.fotosGaleria?.length?`<div class="galeria-vertical">${u.fotosGaleria.map(f=>`<div class="galeria-item"><img src="${f}" onclick="abrirVisorFoto('${f}',false,${u.fotosGaleria.indexOf(f)},'usuario')" loading="lazy"></div>`).join('')}</div>`:''}<div class="perfil-footer"><button class="btn-reportar" onclick="reportarUsuario('${u.uid}')">🚩 Reportar</button><button class="btn-bloquear" onclick="bloquearUsuario('${u.uid}')">🚫 Bloquear</button></div></div>`;
}
window.cambiarSlide=function(uid,index){const slides=document.getElementById('slides_'+uid);const dots=slides?.parentElement?.querySelectorAll('.dot');if(slides)slides.style.transform=`translateX(-${index*100}%)`;if(dots){dots.forEach((d,i)=>d.classList.toggle('activo',i===index));}};
