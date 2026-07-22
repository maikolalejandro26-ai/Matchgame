// ==================== AUTENTICACIÓN ====================
window.registrar = async function() {
  if (!isOnline) { mostrarToast('Sin conexión a internet', 'error'); return; }
  const u = document.getElementById('regUser')?.value?.trim();
  const email = document.getElementById('regEmail')?.value?.trim();
  const pass = document.getElementById('regPass')?.value;
  if (!u) { mostrarToast('Pon un nombre de usuario', 'warning'); return; }
  if (!email) { mostrarToast('Pon un email para verificación', 'warning'); return; }
  if (!email.includes('@') || !email.includes('.')) { mostrarToast('Email inválido', 'error'); return; }
  if (!pass || pass.length < 6) { mostrarToast('La contraseña debe tener al menos 6 caracteres', 'warning'); return; }
  await cargarTodosUsuarios();
  if (usuarios.find(x => x.user === u)) { mostrarToast('Ese usuario ya existe', 'warning'); return; }
  try {
    mostrarToast('Creando cuenta...', 'info');
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    codigoVerificacionActual = Math.floor(100000 + Math.random() * 900000).toString();
    const nuevoUsuario = { 
      uid: cred.user.uid, user: u, email: email,
      edad: document.getElementById('regEdad')?.value || '',
      genero: document.getElementById('regGenero')?.value || '',
      ciudad: document.getElementById('regCiudad')?.value || '',
      bio: document.getElementById('regBio')?.value || '',
      intereses: [], etiquetas:[], preguntas:{}, puntos: 0, xp:0, foto: '', fotosGaleria: [], 
      conectado: true, estado:'online', likesEnviados: [], pasadosEnviados: [], likesRecibidos: [], 
      matches: [], chats: {}, chatsNoLeidos: {}, chatsFijados:[], victorias: 0, derrotas: 0, 
      insignias: [], verificado: false, emailVerificado: false, codigoVerificacion: codigoVerificacionActual,
      marco: '', colorNombre: '', fondo: null, efecto: null, mascota: 'pollito', animacionPerfil: false, 
      regalosEnviados: 0, stats: {}, bloqueados: [], ubicacion: ubicacionUsuario, racha:1, 
      ultimaConexion: new Date().toDateString(), modoOscuro: false, encuestas: {}, 
      ruletaUsada:'', minijuegosRestantes:2, ultimaRuleta:'', rachaVictorias:{}, ultimaDesconexion:'' 
    };
    await setDoc(doc(db, "usuarios", cred.user.uid), nuevoUsuario);
    userActual = nuevoUsuario; window.userActual = userActual; 
    localStorage.setItem('mg_uid', userActual.uid);
    mostrarPagina('app'); actualizarUI(); mostrar('descubrir'); actualizarMascota();
    mostrarToast(`✅ Cuenta creada. Código: ${codigoVerificacionActual}`, 'success');
  } catch(err) {
    if (err.code === 'auth/email-already-in-use') mostrarToast('Este email ya está registrado', 'error');
    else if (err.code === 'auth/invalid-email') mostrarToast('Email inválido', 'error');
    else if (err.code === 'auth/weak-password') mostrarToast('Contraseña muy débil', 'warning');
    else mostrarToast('Error: ' + err.message, 'error');
  }
};

window.login = async function() {
  if (!isOnline) return mostrarToast('Sin conexión', 'error');
  const u = document.getElementById('logUser').value.trim();
  const p = document.getElementById('logPass').value;
  if (!u || !p) return mostrarToast('Ingresa usuario y contraseña', 'warning');
  try {
    await cargarTodosUsuarios();
    const uf = usuarios.find(x => x.user === u || x.email === u);
    if (!uf) return mostrarToast('Usuario no encontrado', 'error');
    mostrarToast('Verificando...', 'info');
    const cred = await signInWithEmailAndPassword(auth, uf.email, p);
    mostrarToast('Cargando perfil...', 'info');
    const ds = await getDoc(doc(db, "usuarios", cred.user.uid));
    if (ds.exists()) {
      userActual = ds.data(); window.userActual = userActual;
      userActual.conectado = true; userActual.estado = userActual.estado || 'online';
      if (userActual.chatsNoLeidos) chatsNoLeidos = userActual.chatsNoLeidos;
      if (userActual.chatsFijados) chatsFijados = userActual.chatsFijados || [];
      if (!userActual.encuestas) userActual.encuestas = {};
      if (!userActual.etiquetas) userActual.etiquetas = [];
      if (!userActual.preguntas) userActual.preguntas = {};
      if (!userActual.xp) userActual.xp = 0;
      if (!userActual.rachaVictorias) userActual.rachaVictorias = {};
      if (!userActual.minijuegosRestantes) userActual.minijuegosRestantes = 2;
      if (!userActual.ultimaDesconexion) userActual.ultimaDesconexion = '';
      if (userActual.rachaVictorias) rachaVictorias = userActual.rachaVictorias;
      if (!userActual.codigoVerificacion) userActual.codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();
      await setDoc(doc(db, "usuarios", cred.user.uid), { conectado: true }, { merge: true });
      localStorage.setItem('mg_uid', userActual.uid);
      if (userActual.modoOscuro) document.body.classList.add('dark-mode');
      obtenerUbicacion(); verificarRacha(); actualizarMascota(); iniciarPullToRefresh();
      mostrarPagina('app'); actualizarUI(); mostrar('descubrir');
      mostrarToast('¡Bienvenido!', 'success');
    } else { await signOut(auth); mostrarToast('Perfil no encontrado', 'error'); }
  } catch(err) {
    if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') mostrarToast('Usuario o contraseña incorrectos', 'error');
    else if (err.code === 'auth/user-not-found') mostrarToast('Usuario no encontrado', 'error');
    else mostrarToast('Error al iniciar sesión', 'error');
  }
};

window.recuperarContrasena = async function() {
  const email = document.getElementById('recupEmail').value.trim();
  if (!email) return mostrarToast('Ingresa tu email', 'warning');
  try { await sendPasswordResetEmail(auth, email); mostrarToast('Instrucciones enviadas a tu email', 'success'); mostrarPagina('login'); }
  catch(err) { mostrarToast('Error: ' + err.message, 'error'); }
};

window.verificarEmail = async function() {
  document.getElementById('menuPerfil')?.classList.add('hidden');
  document.getElementById('modalCodigoVerificacion').classList.remove('hidden');
};

window.verificarCodigo = async function() {
  const codigo = document.getElementById('codigoVerificacion').value.trim();
  if (!codigo || codigo.length !== 6) return mostrarToast('Ingresa 6 dígitos', 'warning');
  if (!userActual) return;
  if (codigo === userActual.codigoVerificacion) {
    userActual.emailVerificado = true; userActual.puntos += 50;
    await guardarTodo(); document.getElementById('modalCodigoVerificacion').classList.add('hidden');
    cargarPerfil(); incrementarMision('verificar');
    mostrarToast('✅ Email verificado! +50 puntos', 'success');
  } else { mostrarToast('❌ Código incorrecto', 'error'); }
};

window.reenviarCodigo = async function() {
  if (!userActual) return;
  codigoVerificacionActual = Math.floor(100000 + Math.random() * 900000).toString();
  userActual.codigoVerificacion = codigoVerificacionActual;
  await guardarTodo(); mostrarToast(`Nuevo código: ${codigoVerificacionActual}`, 'info');
};

window.cerrarModalCodigo = function() { document.getElementById('modalCodigoVerificacion').classList.add('hidden'); };

window.logout = async function() {
  try { if (userActual) { userActual.conectado = false; await setDoc(doc(db, "usuarios", userActual.uid), { conectado: false }, { merge: true }); } }
  catch(e) {}
  await signOut(auth); userActual = null; window.userActual = null;
  localStorage.removeItem('mg_uid');
  document.getElementById('mascotaVirtual')?.classList.add('hidden');
  mostrarPagina('login'); mostrarToast('Sesión cerrada', 'info');
};
