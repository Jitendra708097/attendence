/**
 * @module validators
 * @description Common form validation rules.
 */
export const validators = {
  email: {
    required: true,
    type: 'email',
    message: 'Please enter a valid email address',
  },

  password: {
    required: true,
    min: 8,
    message: 'Password must be at least 8 characters',
  },

  phone: {
    pattern: /^[0-9]{10}$/,
    message: 'Phone must be 10 digits',
  },

  name: {
    required: true,
    min: 2,
    message: 'Name must be at least 2 characters',
  },
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  return phone.length === 10 && /^[0-9]{10}$/.test(phone);
};

export const validatePassword = (password) => {
  return password.length >= 8;
};
