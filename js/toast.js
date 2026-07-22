// ==================== SISTEMA DE TOAST ====================
function mostrarToast(mensaje, tipo = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const iconos = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `${iconos[tipo] || ''} ${mensaje}`;
  container.appendChild(toast);
  setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3000);
}
