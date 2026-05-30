// Form validation utilities

export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validatePhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
}

export function validateRequired(value) {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return true;
  return value !== null && value !== undefined;
}

export function validateMinLength(value, min) {
  return typeof value === 'string' && value.trim().length >= min;
}

export function validateMaxLength(value, max) {
  return typeof value === 'string' && value.trim().length <= max;
}

export function validatePositiveNumber(value) {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

export function validateForm(fields, rules) {
  const errors = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = fields[field];
    
    for (const rule of fieldRules) {
      if (rule.type === 'required' && !validateRequired(value)) {
        errors[field] = rule.message || `${field} is required`;
        break;
      }
      if (rule.type === 'email' && value && !validateEmail(value)) {
        errors[field] = rule.message || 'Invalid email address';
        break;
      }
      if (rule.type === 'phone' && value && !validatePhone(value)) {
        errors[field] = rule.message || 'Invalid phone number (10 digits)';
        break;
      }
      if (rule.type === 'minLength' && !validateMinLength(value, rule.value)) {
        errors[field] = rule.message || `Minimum ${rule.value} characters`;
        break;
      }
      if (rule.type === 'positive' && value && !validatePositiveNumber(value)) {
        errors[field] = rule.message || 'Must be a positive number';
        break;
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
