// ==================== DESCUBRIR ====================
window.cambiarModoDescubrir = function(m) { 
  modoActualDescubrir=m;
  const btnDesc = document.getElementById('btnTabDescubrir');
  const btnSol = document.getElementById('btnTabSolicitudes');
  if(btnDesc && btnSol) {
    if(m==='descubrir') {
      btnDesc.className = 'btn-primario'; btnSol.className = 'btn-sec';
      document.getElementById('solicitudes').classList.add('hidden');
      document.getElementById('listaUsuarios').classList.remove('hidden');
      cargarUsuarios();
    } else {
      btnSol.className = 'btn-primario'; btnDesc.className = 'btn-sec';
      document.getElementById('listaUsuarios').classList.add('hidden');
      document.getElementById('solicitudes').classList.remove('hidden');
      cargarSolicitudesConSecciones();
    }
  }
};

window.cargarSolicitudesConSecciones = async function() {
  await cargarTodosUsuarios();
  const div = document.getElementById('areaSolicitudes'); if(!div) return;
  const todosLosLikes = userActual.likesRecibidos || [];
  const solicitudesNuevas = [], likesEnEspera = [], likesOcultos = [];
  todosLosLikes.forEach(uid => {
    const u = usuarios.find(x => x.uid === uid); if (!u) return;
    const yaVista = (userActual.likesEnviados || []).includes(uid) || (userActual.pasadosEnviados || []).includes(uid) || (userActual.matches || []).includes(uid);
    if (yaVista) { likesOcultos.push(u); } else { solicitudesNuevas.push(u); }
  });
  (userActual.likesEnviados || []).forEach(uid => {
    if (!(userActual.matches || []).includes(uid) && !todosLosLikes.includes(uid)) {
      const u = usuarios.find(x => x.uid === uid); if (u) likesEnEspera.push(u);
    }
  });
  let html = '';
  html += `<div style="margin-bottom:14px;"><h4 style="color:var(--success);margin-bottom:6px;">🆕 SOLICITUDES NUEVAS (${solicitudesNuevas.length}) - GRATIS</h4>`;
  if (!solicitudesNuevas.length) { html += '<p style="text-align:center;color:var(--text-secondary);padding:10px;">No tienes solicitudes nuevas</p>'; }
  else { solicitudesNuevas.forEach(u => { html += `<div class="match-card solicitud" style="flex-direction:column;text-align:left;"><div style="display:flex;align-items:center;gap:8px;"><div class="avatar avatar-xs" style="background-image:url(${u.foto||''});background-size:cover;background-color:${obtenerColorAleatorio(getInicial(u.user))};">${!u.foto?getInicial(u.user):''}</div><div><b>${u.user}, ${u.edad||'?'}</b> quiere ser tu Match</div></div><div class="match-actions" style="margin-top:6px;"><button class="btn-aceptar" onclick="window.aceptarSolicitud('${u.uid}')"><i data-feather="check" class="icon-btn"></i> Aceptar</button><button class="btn-rechazar" onclick="window.rechazarSolicitud('${u.uid}')"><i data-feather="x" class="icon-btn"></i> Rechazar</button></div></div>`; }); }
  html += '</div>';
  html += `<div style="margin-bottom:14px;"><h4 style="color:var(--primary);margin-bottom:6px;">⏳ EN ESPERA (${likesEnEspera.length}) - GRATIS</h4>`;
  if (!likesEnEspera.length) { html += '<p style="text-align:center;color:var(--text-secondary);padding:10px;">No has dado like a nadie aún</p>'; }
  else { likesEnEspera.forEach(u => { html += `<div class="match-card" style="justify-content:space-between;"><div style="display:flex;align-items:center;gap:8px;"><div class="avatar avatar-xs" style="background-image:url(${u.foto||''});background-size:cover;background-color:${obtenerColorAleatorio(getInicial(u.user))};">${!u.foto?getInicial(u.user):''}</div><div><b>${u.user}, ${u.edad||'?'}</b><br><small style="color:var(--text-secondary);">Like enviado</small></div></div><button onclick="window.cancelarLikeDesdeSolicitudes('${u.uid}')" style="width:auto;padding:5px 10px;font-size:11px;min-height:auto;">❌ Cancelar</button></div>`; }); }
  html += '</div>';
  if (likesOcultos.length > 0) { html += `<div class="seccion-premium" style="margin-bottom:14px;"><p style="font-size:15px;font-weight:700;margin-bottom:3px;">🔒 ${likesOcultos.length} like${likesOcultos.length!==1?'s':''} oculto${likesOcultos.length!==1?'s':''}</p><p style="font-size:11px;opacity:0.8;margin-bottom:10px;">Personas que ya pasaste o te dieron like después</p><button onclick="window.verQuienMeDioLike()" style="width:auto;padding:8px 20px;min-height:auto;background:white;color:#16213e;border-radius:16px;font-size:13px;font-weight:700;">👁️ Desbloquear por 30 pts</button></div>`; }
  div.innerHTML = html; feather.replace();
};

window.cancelarLikeDesdeSolicitudes = async function(uid) { userActual.likesEnviados = (userActual.likesEnviados || []).filter(x => x !== uid); await guardarTodo(); cargarSolicitudesConSecciones(); };

window.abrirModalFiltros = function() {
  document.getElementById('filtroGenero').value=filtrosActivos.genero; document.getElementById('filtroEdadMin').value=filtrosActivos.edadMin;
  document.getElementById('filtroEdadMax').value=filtrosActivos.edadMax; document.getElementById('filtroDistancia').value=filtrosActivos.distancia;
  document.getElementById('filtroVerificacion').value=filtrosActivos.verificacion; document.getElementById('filtroPuntosMin').value=filtrosActivos.puntosMin;
  document.getElementById('modalFiltros').classList.remove('hidden');
};
window.cerrarModalFiltros = function() { document.getElementById('modalFiltros').classList.add('hidden'); };
window.limpiarFiltros = function() {
  filtrosActivos={genero:'',edadMin:'',edadMax:'',distancia:'',verificacion:'',puntosMin:''}; indiceUsuario=0;
  document.getElementById('filtroGenero').value=''; document.getElementById('filtroEdadMin').value=''; document.getElementById('filtroEdadMax').value='';
  document.getElementById('filtroDistancia').value=''; document.getElementById('filtroVerificacion').value=''; document.getElementById('filtroPuntosMin').value='';
  cerrarModalFiltros(); mostrarFiltrosActivos(); cargarUsuarios();
};
window.aplicarFiltros = function() {
  filtrosActivos={genero:document.getElementById('filtroGenero').value,edadMin:document.getElementById('filtroEdadMin').value,edadMax:document.getElementById('filtroEdadMax').value,distancia:document.getElementById('filtroDistancia').value,verificacion:document.getElementById('filtroVerificacion').value,puntosMin:document.getElementById('filtroPuntosMin').value};
  indiceUsuario=0; cerrarModalFiltros(); mostrarFiltrosActivos(); cargarUsuarios();
};

function mostrarFiltrosActivos(){
  const c=document.getElementById('filtrosActivosContainer'); if(!c)return; let html='';
  if(filtrosActivos.genero)html+=`<span class="filtro-etiqueta">${filtrosActivos.genero}<span class="btn-quitar" onclick="quitarFiltro('genero')">×</span></span>`;
  if(filtrosActivos.edadMin)html+=`<span class="filtro-etiqueta">≥${filtrosActivos.edadMin}<span class="btn-quitar" onclick="quitarFiltro('edadMin')">×</span></span>`;
  if(filtrosActivos.edadMax)html+=`<span class="filtro-etiqueta">≤${filtrosActivos.edadMax}<span class="btn-quitar" onclick="quitarFiltro('edadMax')">×</span></span>`;
  if(filtrosActivos.distancia)html+=`<span class="filtro-etiqueta">≤${filtrosActivos.distancia}km<span class="btn-quitar" onclick="quitarFiltro('distancia')">×</span></span>`;
  if(filtrosActivos.puntosMin)html+=`<span class="filtro-etiqueta">≥${filtrosActivos.puntosMin}pts<span class="btn-quitar" onclick="quitarFiltro('puntosMin')">×</span></span>`;
  c.innerHTML=html;
}
window.quitarFiltro=function(tipo){filtrosActivos[tipo]='';indiceUsuario=0;mostrarFiltrosActivos();cargarUsuarios();};

window.cargarUsuarios = async function() {
  await cargarTodosUsuarios(); const div = document.getElementById('listaUsuarios'); if(!div) return;
  let pool=usuarios.filter(u=>u.uid!==userActual.uid&&!(userActual.likesEnviados||[]).includes(u.uid)&&!(userActual.pasadosEnviados||[]).includes(u.uid)&&!(userActual.matches||[]).includes(u.uid)&&!(userActual.bloqueados||[]).includes(u.uid));
  if(filtrosActivos.genero)pool=pool.filter(u=>u.genero===filtrosActivos.genero);
  if(filtrosActivos.edadMin)pool=pool.filter(u=>parseInt(u.edad)>=parseInt(filtrosActivos.edadMin));
  if(filtrosActivos.edadMax)pool=pool.filter(u=>parseInt(u.edad)<=parseInt(filtrosActivos.edadMax));
  if(filtrosActivos.distancia&&ubicacionUsuario)pool=pool.filter(u=>{if(!u.ubicacion)return false;const d=calcularDistancia(ubicacionUsuario.lat,ubicacionUsuario.lon,u.ubicacion.lat,u.ubicacion.lon);return d!==null&&d<=parseInt(filtrosActivos.distancia);});
  if(filtrosActivos.verificacion==='email')pool=pool.filter(u=>u.emailVerificado);
  if(filtrosActivos.puntosMin)pool=pool.filter(u=>(u.puntos||0)>=parseInt(filtrosActivos.puntosMin));
  if(!pool.length){div.innerHTML='<p style="text-align:center;padding:40px;">No hay más personas 😢</p>';return;}
  if(indiceUsuario>=pool.length)indiceUsuario=0; const u=pool[indiceUsuario];
  div.innerHTML=crearHTMLPerfil(u,false,true); feather.replace();
};

window.abrirModalMensajeLike = function(uid) { uidLikePendiente=uid;esSuperLike=false;const u=usuarios.find(x=>x.uid===uid);document.getElementById('nombreLikeMensaje').innerText=u?.user||'Usuario';document.getElementById('mensajeLike').value='';document.getElementById('modalMensajeLike').classList.remove('hidden'); };
window.cerrarModalMensaje = function() { document.getElementById('modalMensajeLike').classList.add('hidden');if(uidLikePendiente){lanzarCorazones();darLikeDirecto(uidLikePendiente);uidLikePendiente=null;esSuperLike=false;} };
window.enviarLikeConMensaje = async function() { const mensaje=document.getElementById('mensajeLike').value.trim();document.getElementById('modalMensajeLike').classList.add('hidden');if(uidLikePendiente){lanzarCorazones();await darLikeDirecto(uidLikePendiente,mensaje);uidLikePendiente=null;esSuperLike=false;} };
window.darLikeConCorazonesDescubrir=function(uid){lanzarCorazones();darLikeDirecto(uid);};
window.pasarConAnimacionDescubrir=function(uid){lanzarEquis();pasarSiguiente(uid);};

function lanzarCorazones(){for(let i=0;i<10;i++){const c=document.createElement('span');c.innerText=['❤️','💕','💖','💘','💝','💗','💞','💓','💟','♥️'][i];c.className='particula-amor';c.style.left=Math.random()*80+10+'%';c.style.bottom='15%';c.style.fontSize=(16+Math.random()*20)+'px';c.style.animationDelay=i*0.06+'s';document.body.appendChild(c);setTimeout(()=>c.remove(),1500);}}
function lanzarEquis(){for(let i=0;i<10;i++){const e=document.createElement('span');e.innerText='✕';e.className='particula-x';e.style.left=Math.random()*80+10+'%';e.style.bottom='15%';e.style.fontSize=(16+Math.random()*20)+'px';e.style.color='#ff3b30';e.style.animationDelay=i*0.06+'s';document.body.appendChild(e);setTimeout(()=>e.remove(),1200);}}

async function darLikeDirecto(uid, mensaje = '') {
  if(!userActual.likesEnviados)userActual.likesEnviados=[]; if(userActual.likesEnviados.includes(uid))return;
  userActual.likesEnviados.push(uid); const o=usuarios.find(x=>x.uid===uid);
  if(o){if(!o.likesRecibidos)o.likesRecibidos=[];if(!o.likesRecibidos.includes(userActual.uid))o.likesRecibidos.push(userActual.uid);
    if(mensaje){if(!o.chats)o.chats={};if(!o.chats[userActual.uid])o.chats[userActual.uid]=[];const prefijo=esSuperLike?'⭐ SUPER LIKE: ':'💌 ';o.chats[userActual.uid].push({de:userActual.user,texto:prefijo+mensaje.replace('⭐ SUPER LIKE: ',''),fecha:new Date().toISOString()});if(!userActual.chats[uid])userActual.chats[uid]=[];userActual.chats[uid].push({de:userActual.user,texto:prefijo+mensaje.replace('⭐ SUPER LIKE: ',''),fecha:new Date().toISOString()});}
    if((o.likesEnviados||[]).includes(userActual.uid)&&!(userActual.matches||[]).includes(uid)){if(!userActual.matches)userActual.matches=[];userActual.matches.push(uid);if(!o.matches)o.matches=[];o.matches.push(userActual.uid);userActual.likesRecibidos=userActual.likesRecibidos.filter(x=>x!==uid);o.likesRecibidos=o.likesRecibidos.filter(x=>x!==userActual.uid);const mm={de:'SISTEMA',texto:'__MATCH__',fecha:new Date().toISOString()};if(!userActual.chats[uid])userActual.chats[uid]=[];userActual.chats[uid].push(mm);if(!o.chats[userActual.uid])o.chats[userActual.uid]=[];o.chats[userActual.uid].push(mm);reaccionarMascota('match');ganarXP(25);mostrarMatchOverlay(o);}
    await setDoc(doc(db,"usuarios",uid),o);}
  incrementarMision('like');ganarXP(3);indiceUsuario++;await guardarTodo();cargarUsuarios();actualizarBadgeSolicitudes();reaccionarMascota('like');
}

function mostrarMatchOverlay(u){const overlay=document.createElement('div');overlay.className='match-overlay';overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};overlay.innerHTML=`<div class="match-contenido"><h2>💖 ¡ES UN MATCH!</h2><p>Tú y ${u.user} hicieron match</p><div class="match-fotos"><div class="avatar" style="background-image:url(${userActual.foto||''});background-size:cover;background-color:${obtenerColorAleatorio(getInicial(userActual.user))};">${!userActual.foto?getInicial(userActual.user):''}</div><span style="font-size:36px;">💖</span><div class="avatar" style="background-image:url(${u.foto||''});background-size:cover;background-color:${obtenerColorAleatorio(getInicial(u.user))};">${!u.foto?getInicial(u.user):''}</div></div><p style="margin:10px 0;">🎁 ¿Regalo de bienvenida?</p><button onclick="window.enviarRegaloBienvenida('${u.uid}','flor');this.closest('.match-overlay').remove();" class="btn-regalo" style="width:auto;margin:3px;">🌸 Flor (GRATIS)</button><button onclick="window.enviarRegaloBienvenida('${u.uid}','carta');this.closest('.match-overlay').remove();" class="btn-sorpresa" style="width:auto;margin:3px;">💌 Carta (5pts)</button><button onclick="this.closest('.match-overlay').remove();" class="btn-sec" style="width:auto;margin:3px;">Omitir</button></div>`;document.body.appendChild(overlay);}
window.enviarRegaloBienvenida=async function(uid,regaloId){if(regaloId==='carta'&&userActual.puntos<5){mostrarToast('Puntos insuficientes','warning');return;}const regalo=regalosTienda.find(r=>r.id===regaloId);if(!regalo)return;if(regaloId==='carta')userActual.puntos-=5;const msg={de:userActual.user,texto:`__REGALO__${JSON.stringify({id:regalo.id,icono:regalo.icono,nombre:regalo.nombre,color:regalo.color,animacion:regalo.animacion})}`,fecha:new Date().toISOString()};if(!userActual.chats)userActual.chats={};if(!userActual.chats[uid])userActual.chats[uid]=[];userActual.chats[uid].push(msg);const otro=usuarios.find(x=>x.uid===uid);if(otro){if(!otro.chats)otro.chats={};if(!otro.chats[userActual.uid])otro.chats[userActual.uid]=[];otro.chats[userActual.uid].push(msg);await setDoc(doc(db,"usuarios",uid),otro);}await guardarTodo();actualizarUI();mostrarToast(`¡${regalo.nombre} enviado!`,'success');};
window.pasarSiguiente=async function(uid){if(!userActual.pasadosEnviados)userActual.pasadosEnviados=[];if(!userActual.pasadosEnviados.includes(uid))userActual.pasadosEnviados.push(uid);indiceUsuario++;await guardarTodo();cargarUsuarios();};
window.verQuienMeDioLike=async function(){if(userActual.puntos<30)return mostrarToast('Necesitas 30 puntos','warning');await cargarTodosUsuarios();const lr=userActual.likesRecibidos||[];if(!lr.length)return mostrarToast('Nadie te ha dado like aún','info');userActual.puntos-=30;await guardarTodo();actualizarUI();const div=document.getElementById('listaQuienLike');if(!div)return;div.innerHTML=lr.map(uid=>{const u=usuarios.find(x=>x.uid===uid);if(!u)return'';const f=u.foto?`style="background-image:url(${u.foto});background-size:cover;"`:`style="background:${obtenerColorAleatorio(getInicial(u.user))};"`;return`<div class="quien-like-item" onclick="window.verPerfilUsuario('${uid}');window.cerrarModalQuienLike();"><div class="avatar avatar-sm" ${f}>${!u.foto?getInicial(u.user):''}</div><div><b>${u.user}</b>, ${u.edad||'?'}</div></div>`;}).join('');document.getElementById('modalQuienLike').classList.remove('hidden');feather.replace();};
window.cerrarModalQuienLike=function(){document.getElementById('modalQuienLike').classList.add('hidden');};

// SOLICITUDES
window.aceptarSolicitud=async function(uid){if(!userActual.matches)userActual.matches=[];userActual.matches.push(uid);userActual.likesRecibidos=userActual.likesRecibidos.filter(x=>x!==uid);const o=usuarios.find(x=>x.uid===uid);if(o){if(!o.matches)o.matches=[];o.matches.push(userActual.uid);const mm={de:'SISTEMA',texto:'__MATCH__',fecha:new Date().toISOString()};if(!userActual.chats)userActual.chats={};if(!userActual.chats[uid])userActual.chats[uid]=[];userActual.chats[uid].push(mm);if(!o.chats)o.chats={};if(!o.chats[userActual.uid])o.chats[userActual.uid]=[];o.chats[userActual.uid].push(mm);await setDoc(doc(db,"usuarios",uid),o);reaccionarMascota('match');ganarXP(25);mostrarMatchOverlay(o);}await guardarTodo();cargarSolicitudesConSecciones();cargarListaChats();actualizarBadgeSolicitudes();};
window.rechazarSolicitud=async function(uid){userActual.likesRecibidos=userActual.likesRecibidos.filter(x=>x!==uid);await guardarTodo();cargarSolicitudesConSecciones();actualizarBadgeSolicitudes();};
