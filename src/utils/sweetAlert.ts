import Swal from 'sweetalert2';

// Custom SweetAlert configuration
const swalConfig = {
  confirmButtonColor: '#dc2626', // red-600
  cancelButtonColor: '#6b7280', // gray-500
  confirmButtonText: 'Yes, delete it!',
  cancelButtonText: 'Cancel',
  showCancelButton: true,
  focusCancel: true,
  reverseButtons: true,
  customClass: {
    confirmButton: 'px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2',
    cancelButton: 'px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 mr-3'
  }
};

// Delete confirmation dialog
export const confirmDelete = async (title: string, text?: string): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text: text || 'This action cannot be undone!',
    icon: 'warning',
    ...swalConfig
  });
  
  return result.isConfirmed;
};

// Success message
export const showSuccess = (title: string, text?: string) => {
  Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonColor: '#10b981', // green-500
    customClass: {
      confirmButton: 'px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2'
    }
  });
};

// Error message
export const showError = (title: string, text?: string) => {
  Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: '#dc2626', // red-600
    customClass: {
      confirmButton: 'px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
    }
  });
};

// Info message
export const showInfo = (title: string, text?: string) => {
  Swal.fire({
    title,
    text,
    icon: 'info',
    confirmButtonColor: '#3b82f6', // blue-500
    customClass: {
      confirmButton: 'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2'
    }
  });
};

// Warning message
export const showWarning = (title: string, text?: string) => {
  Swal.fire({
    title,
    text,
    icon: 'warning',
    confirmButtonColor: '#f59e0b', // amber-500
    customClass: {
      confirmButton: 'px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2'
    }
  });
};

// Loading dialog
export const showLoading = (title: string = 'Loading...') => {
  Swal.fire({
    title,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// Close loading dialog
export const closeLoading = () => {
  Swal.close();
};
