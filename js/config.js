import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDocs, collection, onSnapshot, query, orderBy, limit, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = { 
  apiKey: "AIzaSyDTrtXSS18fXn4cEsaKRBIGrSfExSkv2kk", 
  authDomain: "matchgame-e8d2d.firebaseapp.com", 
  projectId: "matchgame-e8d2d", 
  storageBucket: "matchgame-e8d2d.firebasestorage.app", 
  messagingSenderId: "996947022844", 
  appId: "1:996947022844:web:b40a2780c4fdab9da99879" 
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ==================== VARIABLES GLOBALES ====================
let usuarios = [];
let userActual = null;
let chatActivo = null;
let indiceUsuario = 0;
let partidaActiva = null;
let intervaloDesconexion = null;
let timeoutEscritura = null;
let accionPendiente = null;
let filtrosActivos = { genero: '', edadMin: '', edadMax: '', distancia: '', verificacion: '', puntosMin: '' };
let seccionTiendaActual = 'marcos';
let modoActualDescubrir = 'descubrir';
let mensajesNoLeidos = 0;
let fotoVisorActual = null;
let esFotoPerfilVisor = false;
let visorFotos = [];
let visorIndex = 0;
let visorTipo = 'perfil';
let coloresPorInicial = {};
let intervaloContadorInvitacion = null;
let regaloPendienteId = null, regaloPendientePrecio = null;
let chatsNoLeidos = {};
let uidLikePendiente = null;
let esSuperLike = false;
let ubicacionUsuario = null;
let dialogoMascotaTimeout = null;
let mediaRecorder = null;
let audioChunks = [];
let grabando = false;
let chatsFijados = [];
let ruletaUsadaHoy = false;
let busquedaActual = '';
let indiceBusqueda = -1;
let resultadosBusqueda = [];
let rachaVictorias = {};
let codigoVerificacionActual = null;
let minijuegosActuales = [];
let timerMinijuegos = null;
let minijuegosRestantes = 2;

// ==================== CONSTANTES ====================
const mascotasTienda = [
  { id:'pollito', nombre:'Pollito 🐣', precio:100, icono:'🐣', dialogo:'¡Pío pío!', reaccionLike:'¡Te gusta! 🎉', reaccionMatch:'¡Es un match! 💖', reaccionMensaje:'¡Tienes un mensaje! 💬' },
  { id:'gatito', nombre:'Gatito 🐱', precio:200, icono:'🐱', dialogo:'¡Miau!', reaccionLike:'¡Miau! Like 😻', reaccionMatch:'¡Match! 🐾', reaccionMensaje:'Mensaje 😼' },
  { id:'perrito', nombre:'Perrito 🐶', precio:250, icono:'🐶', dialogo:'¡Guau!', reaccionLike:'¡Like! 🦴', reaccionMatch:'¡Match! 🎾', reaccionMensaje:'¡Mensaje! 🐕' },
  { id:'conejo', nombre:'Conejo 🐰', precio:180, icono:'🐰', dialogo:'¡Hola!', reaccionLike:'Like 🥕', reaccionMatch:'Match 🐇', reaccionMensaje:'Mensaje 📩' },
  { id:'zorro', nombre:'Zorro 🦊', precio:300, icono:'🦊', dialogo:'Astuto...', reaccionLike:'Like 🧐', reaccionMatch:'Match 🦊', reaccionMensaje:'Mensaje 🗨️' },
  { id:'panda', nombre:'Panda 🐼', precio:350, icono:'🐼', dialogo:'Relájate...', reaccionLike:'Like 🎋', reaccionMatch:'Match 🧘', reaccionMensaje:'Mensaje 📨' },
  { id:'dragon', nombre:'Dragón 🐉', precio:500, icono:'🐉', dialogo:'¡Fuego!', reaccionLike:'Like 🔥', reaccionMatch:'Match 💥', reaccionMensaje:'Mensaje 🐲' },
  { id:'unicornio', nombre:'Unicornio 🦄', precio:600, icono:'🦄', dialogo:'¡Magia!', reaccionLike:'Like ✨', reaccionMatch:'Match 🌈', reaccionMensaje:'Mensaje 🪄' }
];

const estadosDisponibles = [
  { id:'online', icono:'🟢', texto:'En línea', clase:'estado-online' },
  { id:'ausente', icono:'🟠', texto:'Ausente', clase:'estado-ausente' },
  { id:'ocupado', icono:'🔴', texto:'Ocupado', clase:'estado-ocupado' },
  { id:'invisible', icono:'⚫', texto:'Invisible', clase:'estado-invisible' }
];

const etiquetasDisponibles = ['Aventurero','Foodie','Gamer','Fitness','Viajero','Cinéfilo','Amante perros','Músico','Friki','Deportista','Casero','Fiestero','Friolento','Madrugador','Amante gatos','Artista','Lector','Bailarín','Cantante'];

const interesesIconos = [
  { icono:'🎸', nombre:'Rock' },{ icono:'🎧', nombre:'Pop' },{ icono:'🎵', nombre:'Reguetón' },{ icono:'🎹', nombre:'Electrónica' },
  { icono:'⚽', nombre:'Fútbol' },{ icono:'🏀', nombre:'Básquetbol' },{ icono:'🏃', nombre:'Running' },{ icono:'🧘', nombre:'Yoga' },
  { icono:'🍣', nombre:'Sushi' },{ icono:'🍕', nombre:'Pizza' },{ icono:'🌮', nombre:'Tacos' },{ icono:'🥗', nombre:'Ensaladas' },
  { icono:'🎮', nombre:'Gaming' },{ icono:'📚', nombre:'Leer' },{ icono:'🎬', nombre:'Cine' },{ icono:'✈️', nombre:'Viajar' }
];

const preguntasPersonalidad = [
  { id:'p1', pregunta:'🍕 ¿Pizza con piña?', opciones:['✅ Sí','❌ No'] },
  { id:'p2', pregunta:'🐶 ¿Perros o gatos?', opciones:['🐶 Perros','🐱 Gatos'] },
  { id:'p3', pregunta:'🎬 ¿Película o serie?', opciones:['🎬 Película','📺 Serie'] },
  { id:'p4', pregunta:'🌄 ¿Playa o montaña?', opciones:['🌊 Playa','⛰️ Montaña'] },
  { id:'p5', pregunta:'☕ ¿Café o té?', opciones:['☕ Café','🍵 Té'] },
  { id:'p6', pregunta:'🌅 ¿Madrugador o nocturno?', opciones:['🌅 Madrugador','🌙 Nocturno'] },
  { id:'p7', pregunta:'🎵 ¿Playlist o álbum?', opciones:['📋 Playlist','💿 Álbum'] },
  { id:'p8', pregunta:'📱 ¿Android o iOS?', opciones:['🤖 Android','🍎 iOS'] },
  { id:'p9', pregunta:'🍺 ¿Cerveza o vino?', opciones:['🍺 Cerveza','🍷 Vino'] },
  { id:'p10', pregunta:'🎮 ¿Consola o PC?', opciones:['🎮 Consola','💻 PC'] }
];

const regalosSorpresa = [
  { icono:'🎁', nombre:'Regalo Misterioso', color:'#a855f7' },
  { icono:'🎪', nombre:'Caja de Sorpresas', color:'#6366f1' },
  { icono:'🎰', nombre:'Premio Aleatorio', color:'#8b5cf6' },
  { icono:'🎲', nombre:'Dado del Amor', color:'#ec4899' },
  { icono:'🔮', nombre:'Bola de Cristal', color:'#d946ef' }
];

const ruletaPremios = [
  { icono:'🪙', texto:'5 puntos', puntos:5, peso:30 },
  { icono:'⭐', texto:'10 puntos', puntos:10, peso:25 },
  { icono:'💎', texto:'25 puntos', puntos:25, peso:15 },
  { icono:'🎁', texto:'Regalo Flor', premio:'flor', peso:10 },
  { icono:'💣', texto:'Nada...', puntos:0, peso:15 },
  { icono:'💖', texto:'50 puntos!', puntos:50, peso:5 }
];

const titulosNivel = [
  { min:1, titulo:'Novato' },{ min:5, titulo:'Aprendiz' },{ min:10, titulo:'Jugador' },
  { min:20, titulo:'Experto' },{ min:35, titulo:'Maestro' },{ min:50, titulo:'Leyenda' }
];

const poolMinijuegos = [
  { id:'corazones', nombre:'🎯 Toca el corazón', icono:'❤️', desc:'Toca corazones, evita calaveras', pts:5 },
  { id:'calculo', nombre:'🧮 Cálculo mental', icono:'🔢', desc:'Responde sumas rápido', pts:3 },
  { id:'colores', nombre:'🎨 Memoria de colores', icono:'🟥', desc:'Recuerda la secuencia', pts:5 },
  { id:'rapidez', nombre:'⚡ Toque rápido', icono:'👆', desc:'Toca el botón correcto', pts:4 },
  { id:'parejas', nombre:'🃏 Encuentra el par', icono:'🃏', desc:'Voltea cartas iguales', pts:5 },
  { id:'ordenar', nombre:'📏 Ordena números', icono:'1️⃣', desc:'Del 1 al 9 en orden', pts:4 },
  { id:'letras', nombre:'🔤 Letra faltante', icono:'❓', desc:'Completa la palabra', pts:3 },
  { id:'dados', nombre:'🎲 Suma de dados', icono:'🎲', desc:'Calcula la suma total', pts:4 }
];

// ==================== TIENDA COMPLETA ====================
const marcosTienda = [
  { id:'gris', nombre:'Gris', precio:10, icono:'🩶' },{ id:'bronce', nombre:'Bronce', precio:25, icono:'🟤' },
  { id:'plata', nombre:'Plateado', precio:40, icono:'⚪' },{ id:'oro', nombre:'Dorado', precio:60, icono:'🟡' },
  { id:'rosa', nombre:'Rosa', precio:35, icono:'💖' },{ id:'azul', nombre:'Azul', precio:35, icono:'🔵' },
  { id:'verde', nombre:'Verde', precio:35, icono:'🟢' },{ id:'purpura', nombre:'Púrpura', precio:40, icono:'🟣' },
  { id:'naranja', nombre:'Naranja', precio:35, icono:'🟠' },{ id:'turquesa', nombre:'Turquesa', precio:40, icono:'🩵' },
  { id:'coral', nombre:'Coral', precio:45, icono:'🪸' },{ id:'menta', nombre:'Menta', precio:45, icono:'🍃' },
  { id:'lavanda', nombre:'Lavanda', precio:50, icono:'💜' },{ id:'melocoton', nombre:'Melocotón', precio:50, icono:'🍑' },
  { id:'lima', nombre:'Lima', precio:50, icono:'🍋' },{ id:'fresa', nombre:'Fresa', precio:55, icono:'🍓' },
  { id:'uva', nombre:'Uva', precio:55, icono:'🍇' },{ id:'cereza', nombre:'Cereza', precio:60, icono:'🍒' },
  { id:'sandia', nombre:'Sandía', precio:65, icono:'🍉' },{ id:'kiwi', nombre:'Kiwi', precio:65, icono:'🥝' },
  { id:'diamante', nombre:'Diamante 💎', precio:150, icono:'💎' },{ id:'rubi', nombre:'Rubí 🔴', precio:130, icono:'🔴' },
  { id:'esmeralda', nombre:'Esmeralda 💚', precio:130, icono:'💚' },{ id:'zafiro', nombre:'Zafiro 💙', precio:130, icono:'💙' },
  { id:'amatista', nombre:'Amatista 💜', precio:120, icono:'💜' },{ id:'topacio', nombre:'Topacio 💛', precio:120, icono:'💛' },
  { id:'jade', nombre:'Jade 🟢', precio:140, icono:'🟢' },{ id:'ambar', nombre:'Ámbar 🟠', precio:140, icono:'🟠' },
  { id:'neon', nombre:'Neón 💚', precio:200, icono:'💚' },{ id:'fuego', nombre:'Fuego 🔥', precio:250, icono:'🔥' },
  { id:'hielo', nombre:'Hielo ❄️', precio:250, icono:'❄️' },{ id:'galaxia', nombre:'Galaxia 🌌', precio:350, icono:'🌌' },
  { id:'arcoiris', nombre:'Arcoíris 🌈', precio:300, icono:'🌈' },{ id:'electrico', nombre:'Eléctrico ⚡', precio:280, icono:'⚡' },
  { id:'fantasma', nombre:'Fantasma 👻', precio:320, icono:'👻' },{ id:'aurora', nombre:'Aurora 🌠', precio:500, icono:'🌠' },
  { id:'dracula', nombre:'Drácula 🧛', precio:350, icono:'🧛' },{ id:'robotico', nombre:'Robótico 🤖', precio:380, icono:'🤖' },
  { id:'alien', nombre:'Alien 👽', precio:400, icono:'👽' },{ id:'angelical', nombre:'Angelical 👼', precio:450, icono:'👼' }
];

const coloresTienda = [
  { id:'gris', nombre:'Gris', precio:5, icono:'🩶' },{ id:'bronce', nombre:'Bronce', precio:15, icono:'🟤' },
  { id:'plata', nombre:'Plateado', precio:20, icono:'⚪' },{ id:'oro', nombre:'Dorado', precio:30, icono:'🟡' },
  { id:'rosa', nombre:'Rosa', precio:18, icono:'💖' },{ id:'azul', nombre:'Azul', precio:18, icono:'🔵' },
  { id:'verde', nombre:'Verde', precio:18, icono:'🟢' },{ id:'purpura', nombre:'Púrpura', precio:20, icono:'🟣' },
  { id:'naranja', nombre:'Naranja', precio:18, icono:'🟠' },{ id:'turquesa', nombre:'Turquesa', precio:20, icono:'🩵' },
  { id:'coral', nombre:'Coral', precio:22, icono:'🪸' },{ id:'menta', nombre:'Menta', precio:22, icono:'🍃' },
  { id:'lavanda', nombre:'Lavanda', precio:25, icono:'💜' },{ id:'melocoton', nombre:'Melocotón', precio:25, icono:'🍑' },
  { id:'lima', nombre:'Lima', precio:25, icono:'🍋' },{ id:'fresa', nombre:'Fresa', precio:28, icono:'🍓' },
  { id:'uva', nombre:'Uva', precio:28, icono:'🍇' },{ id:'cereza', nombre:'Cereza', precio:30, icono:'🍒' },
  { id:'sandia', nombre:'Sandía', precio:32, icono:'🍉' },{ id:'kiwi', nombre:'Kiwi', precio:32, icono:'🥝' },
  { id:'diamante', nombre:'Diamante 💎', precio:100, icono:'💎' },{ id:'rubi', nombre:'Rubí 🔴', precio:90, icono:'🔴' },
  { id:'esmeralda', nombre:'Esmeralda 💚', precio:90, icono:'💚' },{ id:'zafiro', nombre:'Zafiro 💙', precio:90, icono:'💙' },
  { id:'neon', nombre:'Neón 💚', precio:150, icono:'💚' },{ id:'fuego', nombre:'Fuego 🔥', precio:180, icono:'🔥' },
  { id:'hielo', nombre:'Hielo ❄️', precio:180, icono:'❄️' },{ id:'galaxia', nombre:'Galaxia 🌌', precio:250, icono:'🌌' },
  { id:'arcoiris', nombre:'Arcoíris 🌈', precio:220, icono:'🌈' },{ id:'oro-rosa', nombre:'Oro Rosa 🌸', precio:140, icono:'🌸' },
  { id:'cyberpunk', nombre:'Cyberpunk 🤖', precio:300, icono:'🤖' },{ id:'electrico', nombre:'Eléctrico ⚡', precio:200, icono:'⚡' },
  { id:'fantasma', nombre:'Fantasma 👻', precio:250, icono:'👻' },{ id:'aurora', nombre:'Aurora 🌠', precio:400, icono:'🌠' },
  { id:'vampiro', nombre:'Vampiro 🧛', precio:280, icono:'🧛' },{ id:'angel', nombre:'Angel 👼', precio:350, icono:'👼' },
  { id:'meteorito', nombre:'Meteorito ☄️', precio:320, icono:'☄️' },{ id:'supernova', nombre:'Supernova 💥', precio:500, icono:'💥' }
];

const regalosTienda = [
  { id:'flor', nombre:'Flor', precio:10, icono:'🌸', color:'#ff9eb5', animacion:'girar' },
  { id:'corazon', nombre:'Corazón', precio:15, icono:'❤️', color:'#ff4757', animacion:'latir' },
  { id:'chocolate', nombre:'Chocolate', precio:20, icono:'🍫', color:'#8B4513', animacion:'deslizar' },
  { id:'peluche', nombre:'Peluche', precio:30, icono:'🧸', color:'#d4a574', animacion:'rebotar' },
  { id:'rosa', nombre:'Rosa', precio:25, icono:'🌹', color:'#e74c3c', animacion:'girar' },
  { id:'globo', nombre:'Globo', precio:10, icono:'🎈', color:'#ff6b81', animacion:'flotar' },
  { id:'carta', nombre:'Carta Amor', precio:35, icono:'💌', color:'#ff6b9d', animacion:'deslizar' },
  { id:'anillo', nombre:'Anillo Oro', precio:80, icono:'💍', color:'#ffd700', animacion:'brillar' },
  { id:'collar', nombre:'Collar Perlas', precio:90, icono:'📿', color:'#f5f5f5', animacion:'brillar' },
  { id:'perfume', nombre:'Perfume', precio:70, icono:'🧴', color:'#9b59b6', animacion:'girar' },
  { id:'reloj', nombre:'Reloj Lujo', precio:120, icono:'⌚', color:'#ffd700', animacion:'brillar' },
  { id:'diamante', nombre:'Diamante', precio:150, icono:'💎', color:'#00ffff', animacion:'brillar' },
  { id:'corona', nombre:'Corona Real', precio:200, icono:'👑', color:'#ffd700', animacion:'brillar' },
  { id:'tesoro', nombre:'Cofre Tesoro', precio:250, icono:'🏆', color:'#ffd700', animacion:'rebotar' },
  { id:'auto', nombre:'Auto Lujo', precio:400, icono:'🚗', color:'#e74c3c', animacion:'deslizar' },
  { id:'yate', nombre:'Yate Lujo', precio:500, icono:'🛥️', color:'#3498db', animacion:'flotar' },
  { id:'mansion', nombre:'Mansión', precio:1000, icono:'🏰', color:'#9b59b6', animacion:'brillar' },
  { id:'avion', nombre:'Jet Privado', precio:800, icono:'✈️', color:'#95a5a6', animacion:'deslizar' },
  { id:'isla', nombre:'Isla Privada', precio:2000, icono:'🏝️', color:'#2ecc71', animacion:'flotar' },
  { id:'nave', nombre:'Nave Espacial', precio:5000, icono:'🚀', color:'#e74c3c', animacion:'deslizar' },
  { id:'galaxia', nombre:'Galaxia Entera', precio:10000, icono:'🌌', color:'#8e44ad', animacion:'brillar' },
  { id:'unicornio', nombre:'Unicornio', precio:300, icono:'🦄', color:'#ff69b4', animacion:'latir' },
  { id:'dragon', nombre:'Dragón', precio:600, icono:'🐉', color:'#e74c3c', animacion:'rebotar' },
  { id:'fenix', nombre:'Fénix', precio:700, icono:'🐦‍🔥', color:'#ff4500', animacion:'brillar' },
  { id:'planeta', nombre:'Planeta', precio:3000, icono:'🪐', color:'#e67e22', animacion:'girar' },
  { id:'meteorito', nombre:'Meteorito', precio:2500, icono:'☄️', color:'#f39c12', animacion:'deslizar' },
  { id:'satelite', nombre:'Satélite', precio:1800, icono:'🛰️', color:'#7f8c8d', animacion:'flotar' },
  { id:'robot', nombre:'Robot IA', precio:3500, icono:'🤖', color:'#3498db', animacion:'rebotar' },
  { id:'viaje', nombre:'Viaje Mundial', precio:4000, icono:'🌍', color:'#2ecc71', animacion:'girar' },
  { id:'luna', nombre:'Terreno Lunar', precio:8000, icono:'🌙', color:'#f1c40f', animacion:'flotar' },
  { id:'agujero', nombre:'Agujero Negro', precio:15000, icono:'🕳️', color:'#1a1a1a', animacion:'brillar' },
  { id:'bigbang', nombre:'Big Bang', precio:20000, icono:'💥', color:'#ff4444', animacion:'latir' },
  { id:'dinosaurio', nombre:'Dinosaurio', precio:550, icono:'🦕', color:'#27ae60', animacion:'rebotar' },
  { id:'ballena', nombre:'Ballena', precio:650, icono:'🐋', color:'#2980b9', animacion:'flotar' },
  { id:'castillo', nombre:'Castillo', precio:1200, icono:'🏯', color:'#8e44ad', animacion:'brillar' },
  { id:'piramide', nombre:'Pirámide', precio:1500, icono:'🔺', color:'#d4a574', animacion:'girar' }
];

const fondosTienda = [
  { id:'gradiente-rosa', nombre:'Gradiente Rosa', precio:30, color1:'#ff9a9e', color2:'#fad0c4' },
  { id:'gradiente-azul', nombre:'Gradiente Azul', precio:30, color1:'#a1c4fd', color2:'#c2e9fb' },
  { id:'gradiente-verde', nombre:'Gradiente Verde', precio:30, color1:'#84fab0', color2:'#8fd3f4' },
  { id:'gradiente-purpura', nombre:'Gradiente Púrpura', precio:40, color1:'#a18cd1', color2:'#fbc2eb' },
  { id:'gradiente-naranja', nombre:'Gradiente Naranja', precio:40, color1:'#ffecd2', color2:'#fcb69f' },
  { id:'gradiente-oscuro', nombre:'Gradiente Oscuro', precio:50, color1:'#434343', color2:'#000000' },
  { id:'estrellas', nombre:'Cielo Estrellado', precio:80, color1:'#0c0c1d', color2:'#111132' },
  { id:'atardecer', nombre:'Atardecer', precio:70, color1:'#ff512f', color2:'#dd2476' },
  { id:'oceano', nombre:'Océano', precio:70, color1:'#00b4db', color2:'#0083b0' },
  { id:'bosque', nombre:'Bosque', precio:60, color1:'#134e5e', color2:'#71b280' },
  { id:'neon-fondo', nombre:'Neón', precio:100, color1:'#00ff00', color2:'#003300' },
  { id:'arcoiris-fondo', nombre:'Arcoíris', precio:120, color1:'#ff0000', color2:'#7f00ff' },
  { id:'galaxia-fondo', nombre:'Galaxia', precio:200, color1:'#0f0c29', color2:'#302b63' },
  { id:'aurora-fondo', nombre:'Aurora Boreal', precio:250, color1:'#00ff88', color2:'#00ffff' },
  { id:'fuego-fondo', nombre:'Fuego', precio:180, color1:'#ff0000', color2:'#ff8c00' }
];

const efectosTienda = [
  { id:'brillo', nombre:'Brillo ✨', precio:80 },{ id:'lluvia', nombre:'Lluvia estrellas 🌟', precio:120 },
  { id:'corazones', nombre:'Corazones 💕', precio:100 },{ id:'nieve', nombre:'Nieve ❄️', precio:90 },
  { id:'fuego-efecto', nombre:'Aura Fuego 🔥', precio:150 },{ id:'rayo', nombre:'Rayos ⚡', precio:180 },
  { id:'humo', nombre:'Humo Místico 🌫️', precio:130 },{ id:'burbujas', nombre:'Burbujas 🫧', precio:90 },
  { id:'confeti', nombre:'Confeti 🎊', precio:110 },{ id:'plumas', nombre:'Plumas 🪶', precio:100 },
  { id:'mariposas', nombre:'Mariposas 🦋', precio:140 },{ id:'hojas', nombre:'Hojas Otoño 🍂', precio:95 },
  { id:'polvo-estrella', nombre:'Polvo Estelar ✨', precio:200 },{ id:'aura-dorada', nombre:'Aura Dorada 👑', precio:300 }
];

const misionesDiarias = [
  { id:'m1', texto:'Jugar 3 partidas de Gato', juego:'gato', meta:3, puntos:30 },
  { id:'m2', texto:'Jugar 2 partidas de Adivina', juego:'adivina', meta:2, puntos:25 },
  { id:'m3', texto:'Jugar 2 partidas de Ahorcado', juego:'ahorcado', meta:2, puntos:35 },
  { id:'m4', texto:'Jugar 2 partidas de Memoria', juego:'memoria', meta:2, puntos:30 },
  { id:'m5', texto:'Dar 5 likes', juego:'like', meta:5, puntos:20 },
  { id:'m6', texto:'Enviar 3 mensajes', juego:'chat', meta:3, puntos:15 },
  { id:'m7', texto:'Jugar 1 partida de PPT', juego:'ppt', meta:1, puntos:20 },
  { id:'m8', texto:'Comprar 1 artículo', juego:'tienda', meta:1, puntos:40 },
  { id:'m9', texto:'Ver 3 perfiles', juego:'perfil', meta:3, puntos:10 },
  { id:'m10', texto:'Enviar 1 regalo', juego:'regalo', meta:1, puntos:50 },
  { id:'m11', texto:'Verificar email', juego:'verificar', meta:1, puntos:100 }
];
