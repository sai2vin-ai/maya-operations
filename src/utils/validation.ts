// Input validation utilities for security and data integrity

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

// Email validation
export function validateEmail(email: string): ValidationResult {
    if (!email || email.trim().length === 0) {
        return { isValid: false, error: 'Email is required' };
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return { isValid: false, error: 'Invalid email format' };
    }
    
    if (email.length > 254) {
        return { isValid: false, error: 'Email is too long' };
    }
    
    return { isValid: true };
}

// Phone number validation (Indian format)
export function validatePhone(phone: string): ValidationResult {
    if (!phone || phone.trim().length === 0) {
        return { isValid: false, error: 'Phone number is required' };
    }
    
    // Remove spaces, dashes, and parentheses
    const cleaned = phone.replace(/[\s\-()]/g, '');
    
    // Indian phone number: 10 digits, optionally starting with +91
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(cleaned)) {
        return { isValid: false, error: 'Invalid phone number. Use 10 digit Indian mobile number' };
    }
    
    return { isValid: true };
}

// Name validation
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
    if (!name || name.trim().length === 0) {
        return { isValid: false, error: `${fieldName} is required` };
    }
    
    const trimmed = name.trim();
    
    if (trimmed.length < 2) {
        return { isValid: false, error: `${fieldName} must be at least 2 characters` };
    }
    
    if (trimmed.length > 100) {
        return { isValid: false, error: `${fieldName} must be less than 100 characters` };
    }
    
    // Only allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(trimmed)) {
        return { isValid: false, error: `${fieldName} can only contain letters, spaces, hyphens, and apostrophes` };
    }
    
    return { isValid: true };
}

// Employee ID validation
export function validateEmployeeId(employeeId: string): ValidationResult {
    if (!employeeId || employeeId.trim().length === 0) {
        return { isValid: false, error: 'Employee ID is required' };
    }
    
    const trimmed = employeeId.trim();
    
    // Alphanumeric, 3-20 characters
    const idRegex = /^[A-Za-z0-9\-_]{3,20}$/;
    if (!idRegex.test(trimmed)) {
        return { isValid: false, error: 'Employee ID must be 3-20 alphanumeric characters' };
    }
    
    return { isValid: true };
}

// Password validation
export function validatePassword(password: string): ValidationResult {
    if (!password || password.length === 0) {
        return { isValid: false, error: 'Password is required' };
    }
    
    if (password.length < 8) {
        return { isValid: false, error: 'Password must be at least 8 characters' };
    }
    
    if (password.length > 128) {
        return { isValid: false, error: 'Password is too long' };
    }
    
    // Check for at least one uppercase, one lowercase, and one number
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one uppercase letter' };
    }
    
    if (!/[a-z]/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one lowercase letter' };
    }
    
    if (!/\d/.test(password)) {
        return { isValid: false, error: 'Password must contain at least one number' };
    }
    
    return { isValid: true };
}

// Vehicle number validation (Indian format)
export function validateVehicleNumber(vehicleNumber: string): ValidationResult {
    if (!vehicleNumber || vehicleNumber.trim().length === 0) {
        return { isValid: false, error: 'Vehicle number is required' };
    }
    
    // Remove spaces and convert to uppercase
    const cleaned = vehicleNumber.replace(/\s/g, '').toUpperCase();
    
    // Indian vehicle registration format: XX00XX0000 or XX00X0000
    const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;
    if (!vehicleRegex.test(cleaned)) {
        return { isValid: false, error: 'Invalid vehicle number format (e.g., KA01AB1234)' };
    }
    
    return { isValid: true };
}

// File validation for uploads
export interface FileValidationOptions {
    maxSizeMB?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
}

export function validateFile(file: File, options: FileValidationOptions = {}): ValidationResult {
    const {
        maxSizeMB = 10,
        allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    } = options;
    
    if (!file) {
        return { isValid: false, error: 'No file provided' };
    }
    
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` };
    }
    
    if (file.size === 0) {
        return { isValid: false, error: 'File is empty' };
    }
    
    // Check MIME type
    if (!allowedTypes.includes(file.type)) {
        return { isValid: false, error: `File type not allowed. Allowed: ${allowedTypes.join(', ')}` };
    }
    
    // Check file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
        return { isValid: false, error: `File extension not allowed. Allowed: ${allowedExtensions.join(', ')}` };
    }
    
    // Check for suspicious filenames
    const filename = file.name.toLowerCase();
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        return { isValid: false, error: 'Invalid filename' };
    }
    
    return { isValid: true };
}

// Sanitize string input (remove potential XSS)
export function sanitizeString(input: string): string {
    if (!input) return '';
    
    return input
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .slice(0, 1000); // Limit length
}

// Sanitize filename
export function sanitizeFilename(filename: string): string {
    if (!filename) return 'file';

    // Remove path components and special characters
    return filename
        .replace(/[/\\:*?"<>|]/g, '')
        .replace(/\.\./g, '')
        .slice(0, 255);
}

// Generate safe filename for uploads
export function generateSafeFilename(originalName: string, prefix: string = 'file'): string {
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${randomSuffix}.${extension}`;
}
