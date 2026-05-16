import Swal from 'sweetalert2';

const getTema = () => document.body.className || 'escuro';

const getToast = () =>
  Swal.mixin({
    toast: true,
    position: 'top-right',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    customClass: {
      popup: `swal-toast-${getTema()}`,
    },
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

export const toastSucesso = (mensagem) =>
  getToast().fire({ icon: 'success', title: mensagem });

export const toastErro = (mensagem) =>
  getToast().fire({ icon: 'error', title: mensagem });

export const toastAviso = (mensagem) =>
  getToast().fire({ icon: 'warning', title: mensagem });

export const toastInfo = (mensagem) =>
  getToast().fire({ icon: 'info', title: mensagem });

export const confirmar = (titulo, texto) =>
  Swal.fire({
    title: titulo,
    text: texto,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#e74c3c',
    cancelButtonColor: '#6c757d',
    reverseButtons: true,
    customClass: {
      popup: `swal-confirm-${getTema()}`,
    },
  });

export const notificacaoViagem = (clienteNome) =>
  Swal.fire({
    title: '🚗 Nova Viagem!',
    html: `<p>O cliente <strong>${clienteNome}</strong> confirmou a viagem</p>`,
    icon: 'info',
    timer: 10000,
    timerProgressBar: true,
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: 'VER',
    cancelButtonText: 'FECHAR',
    confirmButtonColor: '#f5a623',
    cancelButtonColor: '#999',
    allowOutsideClick: false,
    customClass: {
      popup: `swal-confirm-${getTema()}`,
    },
  });