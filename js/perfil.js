// ==================== VISOR DE FOTOS FULLSCREEN CON SWIPE ====================
window.abrirVisorFoto = function(url, esPerfil = false, index = 0, tipo = 'perfil') {
  if(!url) return;
  fotoVisorActual = url;
  esFotoPerfilVisor = esPerfil;
  visorTipo = tipo;
  if(tipo === 'perfil' && userActual) { visorFotos = [userActual.foto, ...(userActual.fotosGaleria || [])].filter(f => f); }
  else if(tipo === 'galeria' && userActual) { visorFotos = (userActual.fotosGaleria || []).filter(f => f); }
  else { visorFotos = [url]; }
  visorIndex = visorFotos.indexOf(url);
  if(visorIndex < 0) visorIndex = index;
  actualizarVisor();
  document.getElementById('visorFotoOverlay').classList.remove('hidden');
  const btnEliminar = document.getElementById('btnEliminarVisor');
  if(btnEliminar) { btnEliminar.classList.toggle('hidden', !(tipo === 'perfil' || tipo === 'galeria')); }
};

function actualizarVisor() {
  const slides = document.getElementById('visorSlides');
  const contador = document.getElementById('visorContador');
  if(!slides || !contador) return;
  slides.innerHTML = visorFotos.map((f, i) => 
    `<div class="slide" style="transform: translateX(-${visorIndex * 100}%); min-width:100%; height:100%; display:flex; align-items:center; justify-content:center;">
      <img src="${f}" style="max-width:100%; max-height:80vh; object-fit:contain;">
    </div>`
  ).join('');
  slides.style.display = 'flex';
  slides.style.transform = `translateX(-${visorIndex * 100}%)`;
  slides.style.transition = 'transform 0.3s ease';
  contador.innerText = visorFotos.length > 1 ? `${visorIndex + 1}/${visorFotos.length}` : '';
  fotoVisorActual = visorFotos[visorIndex];
  esFotoPerfilVisor = (visorTipo === 'perfil' && visorIndex === 0);
}

window.navegarVisor = function(direccion) {
  const nuevoIndex = visorIndex + direccion;
  if(nuevoIndex >= 0 && nuevoIndex < visorFotos.length) {
    visorIndex = nuevoIndex;
    actualizarVisor();
  }
};

let touchStartX = 0;
document.addEventListener('DOMContentLoaded', () => {
  const visor = document.getElementById('visorFotoOverlay');
  if(visor) {
    visor.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
    visor.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if(Math.abs(diff) > 50) { navegarVisor(diff > 0 ? 1 : -1); }
    });
  }
});

window.cerrarVisorFoto = function() {
  document.getElementById('visorFotoOverlay').classList.add('hidden');
  fotoVisorActual = null; esFotoPerfilVisor = false; visorFotos = []; visorIndex = 0;
};

window.borrarFotoDesdeVisor = async function() {
  if(!fotoVisorActual) return;
  if(!confirm('¿Borrar esta foto?')) return;
  mostrarLoading();
  try {
    try { const fotoRef = ref(storage, fotoVisorActual); await deleteObject(fotoRef); } catch(e) {}
    if(esFotoPerfilVisor && visorTipo === 'perfil') { userActual.foto = ''; }
    else if(visorTipo === 'perfil' || visorTipo === 'galeria') {
      if(userActual.fotosGaleria) { userActual.fotosGaleria = userActual.fotosGaleria.filter(f => f !== fotoVisorActual); }
    }
    await guardarTodo();
    visorFotos = visorFotos.filter(f => f !== fotoVisorActual);
    if(visorFotos.length === 0) { cerrarVisorFoto(); }
    else { if(visorIndex >= visorFotos.length) visorIndex = visorFotos.length - 1; actualizarVisor(); }
    cargarPerfil(); cargarGaleriaPerfil();
    ocultarLoading(); mostrarToast('Foto eliminada', 'success');
  } catch(x) { ocultarLoading(); mostrarToast('Error al eliminar', 'error'); }
};

// ==================== SUBIDA DE FOTOS ====================
window.cambiarFotoPerfil = function() { document.getElementById('inputFoto').click(); };
window.agregarFotoGaleria = function() { document.getElementById('inputFotoGaleria').click(); };

window.cambiarFoto = async function(e) { 
  const f=e.target.files[0];if(!f)return;mostrarToast('Subiendo foto...','info');mostrarLoading();
  try{
    if(userActual.foto){try{const fvr=ref(storage,userActual.foto);await deleteObject(fvr);}catch(ex){}}
    const sr=ref(storage,`usuarios/${userActual.uid}/perfil_${Date.now()}`);await uploadBytes(sr,f);userActual.foto=await getDownloadURL(sr);
    await guardarTodo();cargarPerfil();feather.replace();ocultarLoading();mostrarToast('✅ Foto de perfil actualizada','success');
  }catch(x){ocultarLoading();mostrarToast('Error al subir la foto','error');}e.target.value=''; 
};

window.subirFotosGaleria = async function(e) { 
  const fs=e.target.files;if(!fs.length)return;if(!userActual?.uid){mostrarToast('Sesión no iniciada','error');e.target.value='';return;}
  const fa=(userActual.fotosGaleria||[]).length;if(fa+fs.length>20){mostrarToast(`Máximo 20 fotos. Tienes ${fa}.`,'warning');e.target.value='';return;}
  mostrarLoading();mostrarToast('Subiendo fotos...','info');
  try{
    for(let f of fs){const sr=ref(storage,`usuarios/${userActual.uid}/galeria/${Date.now()}_${Math.random().toString(36).substring(2,9)}`);await uploadBytes(sr,f);if(!userActual.fotosGaleria)userActual.fotosGaleria=[];userActual.fotosGaleria.push(await getDownloadURL(sr));}
    await guardarTodo();cargarGaleriaPerfil();ocultarLoading();mostrarToast('¡Fotos agregadas!','success');
  }catch(x){ocultarLoading();mostrarToast('Error: '+x.message,'error');}e.target.value=''; 
};

// ==================== PERFIL ====================
window.toggleMenuAgregar = function() { document.getElementById('menuAgregar').classList.toggle('hidden'); document.getElementById('menuPerfil').classList.add('hidden'); };
window.toggleMenuPerfil = function() { document.getElementById('menuPerfil').classList.toggle('hidden'); document.getElementById('menuAgregar').classList.add('hidden'); };

window.cargarPerfil = function() {
  if(!userActual) return;
  const contenedor = document.getElementById('perfilFondoContainer');
  if(userActual.fondo) {contenedor.style.background = `linear-gradient(135deg, ${userActual.fondo.color1}, ${userActual.fondo.color2})`;contenedor.style.padding = '8px';contenedor.style.borderRadius = '12px';}
  else {contenedor.style.background = 'transparent';contenedor.style.padding = '0';}
  const fotoDiv = document.getElementById('fotoPerfil');
  fotoDiv.className = 'foto-usuario' + (userActual.marco ? ' marco-'+userActual.marco : '');
  if(userActual.foto) { 
    fotoDiv.style.backgroundImage = `url(${userActual.foto})`; 
    fotoDiv.style.backgroundSize = 'cover'; 
    fotoDiv.style.backgroundPosition = 'center';
    fotoDiv.style.backgroundRepeat = 'no-repeat';
    fotoDiv.innerText = ''; 
  } else { 
    fotoDiv.style.backgroundImage = 'none';
    fotoDiv.style.background = obtenerColorAleatorio(getInicial(userActual.user)); 
    fotoDiv.innerText = getInicial(userActual.user); 
    fotoDiv.style.color = 'white'; 
  }
  document.getElementById('nombrePerfil').innerHTML = `${userActual.user}, ${userActual.edad||'?'} ${userActual.emailVerificado?'<span class="badge-verificado"><i data-feather="check" style="width:10px;height:10px;"></i> Verificado</span>':''}`;
  document.getElementById('nombrePerfil').className = userActual.colorNombre ? 'nombre-'+userActual.colorNombre : '';
  document.getElementById('datosPerfil').innerText = `📍 ${userActual.ciudad||'Ciudad desconocida'}\n${userActual.bio||'Sin bio'}`;
  const estadoObj=estadosDisponibles.find(e=>e.id===userActual.estado)||estadosDisponibles[0];
  document.getElementById('estadoUsuario').innerHTML=`<span class="estado-badge ${estadoObj.clase}">${estadoObj.icono} ${estadoObj.texto}</span>`;
  const etDiv=document.getElementById('etiquetasPerfil');if(etDiv)etDiv.innerHTML=(userActual.etiquetas||[]).map(e=>`<span class="etiqueta-pers">${e}</span>`).join('');
  const compDiv=document.getElementById('compatibilidadPromedio');
  if(compDiv&&userActual.matches?.length){const comps=userActual.matches.map(uid=>{const u=usuarios.find(x=>x.uid===uid);return u?calcularCompatibilidad(u):0;}).filter(c=>c>0);if(comps.length){const prom=Math.round(comps.reduce((a,b)=>a+b,0)/comps.length);compDiv.innerHTML=`<span class="compatibilidad-badge ${getClaseCompatibilidad(prom)}">💖 ${prom}% compatibilidad promedio</span>`;}}
  const efectoDiv=document.getElementById('efectoActivo');if(userActual.efecto){const ef=efectosTienda.find(e=>e.id===userActual.efecto);if(ef)efectoDiv.innerHTML=`<span class="efecto-indicador">✨ ${ef.nombre} activo</span>`;else efectoDiv.innerHTML='';}else{efectoDiv.innerHTML='';}
  feather.replace();
};

window.cargarGaleriaPerfil = function() { if(!userActual)return;const div=document.getElementById('galeriaPerfilMini');if(!userActual.fotosGaleria?.length){div.innerHTML='<p style="font-size:12px;color:var(--text-secondary);">No hay fotos en galería</p>';}else{div.innerHTML=userActual.fotosGaleria.map((f,i)=>`<div class="galeria-item"><img src="${f}" onclick="abrirVisorFoto('${f}',false,${i},'galeria')" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;cursor:pointer;"></div>`).join('');} };
window.eliminarFotoGaleria = async function(i){if(!confirm('¿Eliminar esta foto?'))return;const url=userActual.fotosGaleria[i];if(url){try{const fr=ref(storage,url);await deleteObject(fr);}catch(e){}}userActual.fotosGaleria.splice(i,1);await guardarTodo();cargarGaleriaPerfil();mostrarToast('Foto eliminada','success');};

window.eliminarCuenta = async function(){
  if(!confirm('⚠️ ¿Estás seguro?\n\nSe borrarán TODOS tus datos:\n- Fotos de perfil y galería\n- Chats y conversaciones\n- Matches y likes\n\nEsta acción NO se puede deshacer.'))return;
  if(!confirm('Última confirmación:\n¿Eliminar cuenta de forma PERMANENTE?'))return;
  mostrarLoading();
  try{
    const uid=userActual.uid;
    const carpetaUsuario=ref(storage,`usuarios/${uid}`);
    try{const lr=await listAll(carpetaUsuario);for(const item of lr.items){await deleteObject(item);}for(const folder of lr.prefixes){const sf=await listAll(folder);for(const item of sf.items){await deleteObject(item);}}}catch(e){}
    await deleteDoc(doc(db,"usuarios",uid));localStorage.removeItem('mg_uid');userActual=null;window.userActual=null;
    ocultarLoading();mostrarPagina('login');mostrarToast('✅ Cuenta eliminada. Todos tus datos han sido borrados.','success');
  }catch(err){ocultarLoading();mostrarToast('Error: '+err.message,'error');}
};

function actualizarInsignias(){if(!userActual)return;const div=document.getElementById('insigniasPerfil');if(!userActual.insignias)userActual.insignias=[];if(div)div.innerHTML=userActual.insignias.map(i=>`<span class="insignia"><i data-feather="award" class="icon-btn"></i> ${i}</span>`).join('');feather.replace();}

window.cargarListaMatchesPerfil = async function(){
  if(!userActual)return;await cargarTodosUsuarios();const div=document.getElementById('listaMatchesPerfil'),cont=document.getElementById('contadorMatches');
  if(!userActual.matches?.length){div.innerHTML='<p style="font-size:12px;color:var(--text-secondary);">Aún no tienes matches</p>';cont.innerText='0';return;}
  cont.innerText=userActual.matches.length;
  div.innerHTML=userActual.matches.map(uid=>{const u=usuarios.find(x=>x.uid===uid);if(!u)return'';const f=u.foto?`style="background-image:url(${u.foto});background-size:cover;"`:`style="background:${obtenerColorAleatorio(getInicial(u.user))};"`;const comp=calcularCompatibilidad(u);return`<div class="mini-match" onclick="verPerfilUsuario('${uid}')"><div class="avatar avatar-xs" ${f}>${!u.foto?getInicial(u.user):''}</div><span>${u.user}</span><span class="compatibilidad-badge ${getClaseCompatibilidad(comp)}" style="font-size:9px;padding:1px 4px;">${comp}%</span></div>`;}).join('');feather.replace();
};

window.verPerfilUsuario=function(uid){if(!userActual)return;const u=usuarios.find(x=>x.uid===uid);if(!u)return;const esMatch=(userActual.matches||[]).includes(uid);document.getElementById('contenidoPerfilUsuario').innerHTML=crearHTMLPerfil(u,esMatch,true);document.getElementById('perfilUsuarioOverlay').classList.remove('hidden');document.getElementById('bottomNav').classList.add('hidden');feather.replace();incrementarMision('perfil');};
window.reportarUsuario=async function(uid){if(!confirm('¿Reportar a este usuario?'))return;mostrarToast('Usuario reportado. Gracias.','info');};
window.bloquearUsuario=async function(uid){if(!confirm('¿Bloquear a este usuario?'))return;if(!userActual.bloqueados)userActual.bloqueados=[];userActual.bloqueados.push(uid);await guardarTodo();cerrarPerfilUsuario();mostrarToast('Usuario bloqueado.','info');};
window.cerrarPerfilUsuario=function(){document.getElementById('perfilUsuarioOverlay').classList.add('hidden');document.getElementById('bottomNav').classList.remove('hidden');};
window.verPerfilDesdeChat=function(){if(chatActivo)verPerfilUsuario(chatActivo);};
window.enviarMensajeDesdePerfil=function(uid){cerrarPerfilUsuario();mostrar('chats');setTimeout(()=>abrirChat(uid),200);};
window.eliminarMatch=async function(uid){if(!confirm('¿Eliminar este Match?'))return;userActual.matches=userActual.matches.filter(x=>x!==uid);const otro=usuarios.find(x=>x.uid===uid);if(otro){otro.matches=otro.matches.filter(x=>x!==userActual.uid);await setDoc(doc(db,"usuarios",uid),otro);}await guardarTodo();cerrarPerfilUsuario();cargarListaMatchesPerfil();cargarListaChats();mostrarToast('Match eliminado','info');};

// ==================== MODAL EDITAR PERFIL UNIFICADO ====================
window.abrirModalEditarPerfil = function() {
  document.getElementById('menuPerfil').classList.add('hidden');
  document.getElementById('editEdadModal').value = userActual.edad || '';
  document.getElementById('editGeneroModal').value = userActual.genero || 'Hombre';
  document.getElementById('editCiudadModal').value = userActual.ciudad || '';
  document.getElementById('editBioModal').value = userActual.bio || '';
  document.getElementById('editInteresesModal').value = (userActual.intereses || []).join(', ');
  cargarEtiquetasEditar(); cargarInteresesEditar(); cargarPreguntasEditar(); cargarGaleriaEditarMini();
  const select = document.getElementById('selectEtiqueta');
  const seleccionadas = userActual.etiquetas || [];
  select.innerHTML = '<option value="">+ Agregar etiqueta</option>' + etiquetasDisponibles.filter(e => !seleccionadas.includes(e)).map(e => `<option value="${e}">${e}</option>`).join('');
  document.getElementById('modalEditarPerfil').classList.remove('hidden');
};

window.cerrarModalEditarPerfil = function() { document.getElementById('modalEditarPerfil').classList.add('hidden'); };

window.guardarTodoPerfil = async function() {
  userActual.edad = document.getElementById('editEdadModal').value;
  userActual.genero = document.getElementById('editGeneroModal').value;
  userActual.ciudad = document.getElementById('editCiudadModal').value;
  userActual.bio = document.getElementById('editBioModal').value;
  userActual.intereses = document.getElementById('editInteresesModal').value.split(',').map(s => s.trim()).filter(s => s);
  await guardarTodo(); cargarPerfil(); cerrarModalEditarPerfil();
  mostrarToast('✅ Perfil actualizado', 'success');
};

function cargarEtiquetasEditar() {
  const div = document.getElementById('etiquetasEditar');
  const seleccionadas = userActual.etiquetas || [];
  div.innerHTML = seleccionadas.map(e => `<span class="etiqueta-pers seleccionada" onclick="quitarEtiquetaEditar('${e}')" style="cursor:pointer;">${e} ✕</span>`).join('');
}

window.agregarEtiquetaDesdeSelect = function() {
  const select = document.getElementById('selectEtiqueta'); const valor = select.value;
  if(!valor) return; const seleccionadas = userActual.etiquetas || [];
  if(seleccionadas.length >= 5) return mostrarToast('Máximo 5 etiquetas','warning');
  if(!seleccionadas.includes(valor)) { userActual.etiquetas = [...seleccionadas, valor]; cargarEtiquetasEditar(); select.innerHTML = '<option value="">+ Agregar etiqueta</option>' + etiquetasDisponibles.filter(e => !userActual.etiquetas.includes(e)).map(e => `<option value="${e}">${e}</option>`).join(''); }
  select.value = '';
};

window.quitarEtiquetaEditar = function(etiqueta) {
  userActual.etiquetas = (userActual.etiquetas || []).filter(e => e !== etiqueta);
  cargarEtiquetasEditar();
  const select = document.getElementById('selectEtiqueta');
  select.innerHTML = '<option value="">+ Agregar etiqueta</option>' + etiquetasDisponibles.filter(e => !userActual.etiquetas.includes(e)).map(e => `<option value="${e}">${e}</option>`).join('');
};

function cargarInteresesEditar() {
  const div = document.getElementById('interesesEditar');
  const seleccionados = userActual.intereses || [];
  div.innerHTML = interesesIconos.map(i => { const sel = seleccionados.includes(i.nombre); return `<span class="interes-icono${sel?' seleccionado':''}" onclick="toggleInteresEditar(this,'${i.nombre}')">${i.icono} ${i.nombre}</span>`; }).join('');
}

window.toggleInteresEditar = function(el, interes) {
  const seleccionados = userActual.intereses || [];
  if(seleccionados.includes(interes)) { userActual.intereses = seleccionados.filter(i => i !== interes); el.classList.remove('seleccionado'); }
  else { userActual.intereses = [...seleccionados, interes]; el.classList.add('seleccionado'); }
  document.getElementById('editInteresesModal').value = userActual.intereses.join(', ');
};

function cargarPreguntasEditar() {
  const div = document.getElementById('preguntasEditar');
  const respondidas = userActual.preguntas || {};
  div.innerHTML = preguntasPersonalidad.map(p => { const respuesta = respondidas[p.id]; return `<div style="margin-bottom:6px;padding:8px;background:var(--card-bg);border-radius:8px;border:1px solid var(--border);"><p style="font-weight:600;font-size:12px;margin-bottom:3px;">${p.pregunta}</p><div style="display:flex;gap:4px;">${p.opciones.map((op,i) => `<button onclick="responderPreguntaEditar('${p.id}',${i},this)" style="flex:1;font-size:11px;min-height:auto;padding:5px;${respuesta===i?'background:var(--primary);color:white;':'background:var(--btn-bg);'}">${op}</button>`).join('')}</div></div>`; }).join('');
}

window.responderPreguntaEditar = function(id, respuesta, btn) {
  if(!userActual.preguntas) userActual.preguntas = {}; userActual.preguntas[id] = respuesta;
  const btns = btn.parentElement.querySelectorAll('button'); btns.forEach(b => { b.style.background = 'var(--btn-bg)'; b.style.color = 'var(--btn-text)'; });
  btn.style.background = 'var(--primary)'; btn.style.color = 'white'; userActual.puntos += 5;
};

function cargarGaleriaEditarMini() {
  const div = document.getElementById('galeriaEditarMini');
  if(!userActual.fotosGaleria || !userActual.fotosGaleria.length) { div.innerHTML = '<p style="font-size:11px;color:var(--text-secondary);">No hay fotos en galería</p>'; return; }
  div.innerHTML = userActual.fotosGaleria.map((f, i) => `<div style="position:relative;width:55px;height:55px;border-radius:6px;overflow:hidden;"><img src="${f}" style="width:100%;height:100%;object-fit:cover;"><span onclick="eliminarFotoGaleria(${i})" style="position:absolute;top:1px;right:1px;background:var(--danger);color:white;border-radius:50%;width:16px;height:16px;font-size:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;">✕</span></div>`).join('');
}

// ETIQUETAS, INTERESES, PREGUNTAS, STATS
window.abrirModalEtiquetas=function(){const div=document.getElementById('listaEtiquetas');if(!div)return;const s=userActual.etiquetas||[];div.innerHTML=etiquetasDisponibles.map(e=>{const sel=s.includes(e);return`<span class="etiqueta-pers${sel?' seleccionada':''}" onclick="window.toggleEtiqueta(this,'${e}')">${e}</span>`;}).join('');document.getElementById('contadorEtiquetas').innerText=s.length;document.getElementById('modalEtiquetas').classList.remove('hidden');};
window.toggleEtiqueta=function(el,e){const s=userActual.etiquetas||[];if(s.includes(e)){userActual.etiquetas=s.filter(x=>x!==e);el.classList.remove('seleccionada');}else{if(s.length>=5)return mostrarToast('Máximo 5','warning');userActual.etiquetas=[...s,e];el.classList.add('seleccionada');}document.getElementById('contadorEtiquetas').innerText=userActual.etiquetas.length;};
window.guardarEtiquetas=async function(){await guardarTodo();cargarPerfil();document.getElementById('modalEtiquetas').classList.add('hidden');mostrarToast('Etiquetas guardadas','success');};
window.cerrarModalEtiquetas=function(){document.getElementById('modalEtiquetas').classList.add('hidden');};

window.abrirModalIntereses=function(){const div=document.getElementById('listaInteresesIconos');if(!div)return;const s=userActual.intereses||[];div.innerHTML=interesesIconos.map(i=>{const sel=s.includes(i.nombre);return`<span class="interes-icono${sel?' seleccionado':''}" onclick="window.toggleInteres(this,'${i.nombre}')">${i.icono} ${i.nombre}</span>`;}).join('');document.getElementById('modalIntereses').classList.remove('hidden');};
window.toggleInteres=function(el,i){const s=userActual.intereses||[];if(s.includes(i)){userActual.intereses=s.filter(x=>x!==i);el.classList.remove('seleccionado');}else{userActual.intereses=[...s,i];el.classList.add('seleccionado');}};
window.guardarIntereses=async function(){await guardarTodo();cargarPerfil();document.getElementById('modalIntereses').classList.add('hidden');mostrarToast('Intereses guardados','success');};
window.cerrarModalIntereses=function(){document.getElementById('modalIntereses').classList.add('hidden');};

window.abrirModalPreguntas=function(){const div=document.getElementById('listaPreguntas');if(!div)return;const r=userActual.preguntas||{};div.innerHTML=preguntasPersonalidad.map(p=>{const res=r[p.id];return`<div style="margin-bottom:8px;padding:8px;background:var(--card-bg);border-radius:8px;border:1px solid var(--border);"><p style="font-weight:600;font-size:12px;margin-bottom:4px;">${p.pregunta}</p><div style="display:flex;gap:4px;">${p.opciones.map((op,i)=>`<button onclick="window.responderPregunta('${p.id}',${i},this)" style="flex:1;font-size:11px;min-height:auto;padding:5px;${res===i?'background:var(--primary);color:white;':''}">${op}</button>`).join('')}</div></div>`;}).join('');document.getElementById('modalPreguntas').classList.remove('hidden');};
window.responderPregunta=function(id,respuesta,btn){if(!userActual.preguntas)userActual.preguntas={};userActual.preguntas[id]=respuesta;const btns=btn.parentElement.querySelectorAll('button');btns.forEach(b=>{b.style.background='var(--btn-bg)';b.style.color='var(--btn-text)';});btn.style.background='var(--primary)';btn.style.color='white';userActual.puntos+=5;actualizarUI();};
window.guardarPreguntas=async function(){await guardarTodo();document.getElementById('modalPreguntas').classList.add('hidden');mostrarToast('Respuestas guardadas','success');};
window.cerrarModalPreguntas=function(){document.getElementById('modalPreguntas').classList.add('hidden');};

window.verStatsPerfil=function(){const div=document.getElementById('contenidoStatsPerfil');if(!div)return;const tj=(userActual.stats?Object.values(userActual.stats).reduce((a,b)=>a+(b.victorias||0)+(b.derrotas||0),0):0);const tv=(userActual.stats?Object.values(userActual.stats).reduce((a,b)=>a+(b.victorias||0),0):0);div.innerHTML=`<div class="stat-item"><span>📅 Miembro desde</span><span class="stat-valor">${userActual.uid?new Date(parseInt(userActual.uid.substring(0,8)||'0')*1000).toLocaleDateString('es'):'?'}</span></div><div class="stat-item"><span>🔥 Racha</span><span class="stat-valor">${userActual.racha||1} días</span></div><div class="stat-item"><span>❤️ Likes dados</span><span class="stat-valor">${userActual.likesEnviados?.length||0}</span></div><div class="stat-item"><span>💖 Matches</span><span class="stat-valor">${userActual.matches?.length||0}</span></div><div class="stat-item"><span>💬 Mensajes</span><span class="stat-valor">${userActual.chats?Object.values(userActual.chats).reduce((a,b)=>a+b.length,0):0}</span></div><div class="stat-item"><span>🎁 Regalos</span><span class="stat-valor">${userActual.regalosEnviados||0}</span></div><div class="stat-item"><span>🎮 Juegos</span><span class="stat-valor">${tj}</span></div><div class="stat-item"><span>🏆 Victorias</span><span class="stat-valor">${tv}</span></div><div class="stat-item"><span>📊 Winrate</span><span class="stat-valor">${tj>0?Math.round((tv/tj)*100):0}%</span></div><div class="stat-item"><span>🏅 Nivel</span><span class="stat-valor">${getNivel(userActual.xp||0).nivel}</span></div>`;document.getElementById('modalStatsPerfil').classList.remove('hidden');};
window.cerrarModalStatsPerfil=function(){document.getElementById('modalStatsPerfil').classList.add('hidden');};
function actualizarEtiquetasPerfil(){const etDiv=document.getElementById('etiquetasPerfil');if(etDiv)etDiv.innerHTML=(userActual.etiquetas||[]).map(e=>`<span class="etiqueta-pers">${e}</span>`).join('');}
