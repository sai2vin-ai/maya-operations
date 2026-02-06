import { describe, it, expect } from 'vitest';
import {
    validateEmail,
    validatePhone,
    validateName,
    validateEmployeeId,
    validatePassword,
    validateVehicleNumber,
    validateFile,
    sanitizeString,
    sanitizeFilename,
    generateSafeFilename,
    validateUrl,
    validateWebhookHeaders,
} from './validation';

describe('validation utilities', () => {
    describe('validateEmail', () => {
        it('should accept valid emails', () => {
            expect(validateEmail('test@example.com').isValid).toBe(true);
            expect(validateEmail('user.name@domain.co.in').isValid).toBe(true);
            expect(validateEmail('user+tag@example.org').isValid).toBe(true);
        });

        it('should reject invalid emails', () => {
            expect(validateEmail('').isValid).toBe(false);
            expect(validateEmail('invalid').isValid).toBe(false);
            expect(validateEmail('no@domain').isValid).toBe(false);
            expect(validateEmail('@nodomain.com').isValid).toBe(false);
            expect(validateEmail('spaces in@email.com').isValid).toBe(false);
        });

        it('should reject emails that are too long', () => {
            const longEmail = 'a'.repeat(250) + '@example.com';
            expect(validateEmail(longEmail).isValid).toBe(false);
        });

        it('should return appropriate error messages', () => {
            expect(validateEmail('').error).toBe('Email is required');
            expect(validateEmail('invalid').error).toBe('Invalid email format');
        });
    });

    describe('validatePhone', () => {
        it('should accept valid Indian phone numbers', () => {
            expect(validatePhone('9876543210').isValid).toBe(true);
            expect(validatePhone('+919876543210').isValid).toBe(true);
            expect(validatePhone('98765 43210').isValid).toBe(true);
            expect(validatePhone('9876-543-210').isValid).toBe(true);
        });

        it('should reject invalid phone numbers', () => {
            expect(validatePhone('').isValid).toBe(false);
            expect(validatePhone('12345').isValid).toBe(false);
            expect(validatePhone('1234567890').isValid).toBe(false); // Doesn't start with 6-9
            expect(validatePhone('98765432101').isValid).toBe(false); // 11 digits
        });

        it('should return appropriate error messages', () => {
            expect(validatePhone('').error).toBe('Phone number is required');
            expect(validatePhone('123').error).toContain('Invalid phone number');
        });
    });

    describe('validateName', () => {
        it('should accept valid names', () => {
            expect(validateName('John Doe').isValid).toBe(true);
            expect(validateName('Mary-Jane').isValid).toBe(true);
            expect(validateName("O'Brien").isValid).toBe(true);
        });

        it('should reject invalid names', () => {
            expect(validateName('').isValid).toBe(false);
            expect(validateName('A').isValid).toBe(false); // Too short
            expect(validateName('John123').isValid).toBe(false); // Contains numbers
            expect(validateName('John@Doe').isValid).toBe(false); // Contains special chars
        });

        it('should reject names that are too long', () => {
            const longName = 'A'.repeat(101);
            expect(validateName(longName).isValid).toBe(false);
        });

        it('should use custom field name in error messages', () => {
            expect(validateName('', 'First Name').error).toBe('First Name is required');
        });
    });

    describe('validateEmployeeId', () => {
        it('should accept valid employee IDs', () => {
            expect(validateEmployeeId('EMP001').isValid).toBe(true);
            expect(validateEmployeeId('ABC-123').isValid).toBe(true);
            expect(validateEmployeeId('user_id_01').isValid).toBe(true);
        });

        it('should reject invalid employee IDs', () => {
            expect(validateEmployeeId('').isValid).toBe(false);
            expect(validateEmployeeId('AB').isValid).toBe(false); // Too short
            expect(validateEmployeeId('ID@123').isValid).toBe(false); // Invalid char
            expect(validateEmployeeId('A'.repeat(21)).isValid).toBe(false); // Too long
        });
    });

    describe('validatePassword', () => {
        it('should accept valid passwords', () => {
            expect(validatePassword('Password1').isValid).toBe(true);
            expect(validatePassword('MySecure123').isValid).toBe(true);
            expect(validatePassword('Test@Password99').isValid).toBe(true);
        });

        it('should reject passwords without uppercase', () => {
            const result = validatePassword('password1');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('uppercase');
        });

        it('should reject passwords without lowercase', () => {
            const result = validatePassword('PASSWORD1');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('lowercase');
        });

        it('should reject passwords without numbers', () => {
            const result = validatePassword('PasswordABC');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('number');
        });

        it('should reject short passwords', () => {
            const result = validatePassword('Pass1');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('8 characters');
        });
    });

    describe('validateVehicleNumber', () => {
        it('should accept valid Indian vehicle numbers', () => {
            expect(validateVehicleNumber('KA01AB1234').isValid).toBe(true);
            expect(validateVehicleNumber('MH12DE5678').isValid).toBe(true);
            expect(validateVehicleNumber('DL1CAB1234').isValid).toBe(true);
            expect(validateVehicleNumber('KA 01 AB 1234').isValid).toBe(true); // With spaces
        });

        it('should reject invalid vehicle numbers', () => {
            expect(validateVehicleNumber('').isValid).toBe(false);
            expect(validateVehicleNumber('INVALID').isValid).toBe(false);
            expect(validateVehicleNumber('123456').isValid).toBe(false);
            expect(validateVehicleNumber('KA01AB12345').isValid).toBe(false); // 5 digits at end
        });
    });

    describe('validateFile', () => {
        function createMockFile(name: string, size: number, type: string): File {
            const blob = new Blob(['x'.repeat(size)], { type });
            return new File([blob], name, { type });
        }

        it('should accept valid image files', () => {
            const file = createMockFile('photo.jpg', 1024, 'image/jpeg');
            expect(validateFile(file).isValid).toBe(true);
        });

        it('should reject files that are too large', () => {
            const file = createMockFile('large.jpg', 15 * 1024 * 1024, 'image/jpeg');
            const result = validateFile(file, { maxSizeMB: 10 });
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('10MB');
        });

        it('should reject empty files', () => {
            const file = createMockFile('empty.jpg', 0, 'image/jpeg');
            expect(validateFile(file).isValid).toBe(false);
            expect(validateFile(file).error).toBe('File is empty');
        });

        it('should reject disallowed MIME types', () => {
            const file = createMockFile('script.js', 1024, 'application/javascript');
            const result = validateFile(file);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('type not allowed');
        });

        it('should reject disallowed extensions', () => {
            const file = createMockFile('photo.exe', 1024, 'image/jpeg');
            const result = validateFile(file);
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('extension not allowed');
        });

        it('should reject suspicious filenames with path traversal', () => {
            const file1 = createMockFile('../etc/passwd.jpg', 1024, 'image/jpeg');
            expect(validateFile(file1).isValid).toBe(false);

            const file2 = createMockFile('photo/../../secret.jpg', 1024, 'image/jpeg');
            expect(validateFile(file2).isValid).toBe(false);
        });

        it('should respect custom options', () => {
            const file = createMockFile('doc.pdf', 1024, 'application/pdf');
            const result = validateFile(file, {
                allowedTypes: ['application/pdf'],
                allowedExtensions: ['pdf'],
            });
            expect(result.isValid).toBe(true);
        });
    });

    describe('sanitizeString', () => {
        it('should remove angle brackets', () => {
            expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
        });

        it('should trim whitespace', () => {
            expect(sanitizeString('  hello  ')).toBe('hello');
        });

        it('should limit length', () => {
            const longString = 'a'.repeat(2000);
            expect(sanitizeString(longString).length).toBe(1000);
        });

        it('should handle empty input', () => {
            expect(sanitizeString('')).toBe('');
        });
    });

    describe('sanitizeFilename', () => {
        it('should remove dangerous characters', () => {
            expect(sanitizeFilename('file/name.txt')).toBe('filename.txt');
            expect(sanitizeFilename('file\\name.txt')).toBe('filename.txt');
            expect(sanitizeFilename('file:name.txt')).toBe('filename.txt');
            expect(sanitizeFilename('file"name.txt')).toBe('filename.txt');
        });

        it('should remove path traversal attempts', () => {
            expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
        });

        it('should limit length', () => {
            const longFilename = 'a'.repeat(300) + '.txt';
            expect(sanitizeFilename(longFilename).length).toBeLessThanOrEqual(255);
        });

        it('should return default for empty input', () => {
            expect(sanitizeFilename('')).toBe('file');
        });
    });

    describe('generateSafeFilename', () => {
        it('should generate unique filenames', () => {
            const filename1 = generateSafeFilename('photo.jpg', 'vehicle');
            const filename2 = generateSafeFilename('photo.jpg', 'vehicle');
            expect(filename1).not.toBe(filename2);
        });

        it('should include prefix', () => {
            const filename = generateSafeFilename('photo.jpg', 'vehicle');
            expect(filename.startsWith('vehicle_')).toBe(true);
        });

        it('should preserve extension', () => {
            expect(generateSafeFilename('photo.png', 'test').endsWith('.png')).toBe(true);
            expect(generateSafeFilename('photo.JPEG', 'test').endsWith('.jpeg')).toBe(true);
        });

        it('should default to jpg extension', () => {
            expect(generateSafeFilename('noextension', 'test').endsWith('.jpg')).toBe(true);
        });
    });

    describe('validateUrl', () => {
        it('should accept valid https URLs', () => {
            expect(validateUrl('https://example.com/webhook').isValid).toBe(true);
            expect(validateUrl('https://api.service.com/v1/hook').isValid).toBe(true);
            expect(validateUrl('http://external-api.com/callback').isValid).toBe(true);
        });

        it('should reject empty URLs', () => {
            expect(validateUrl('').isValid).toBe(false);
            expect(validateUrl('   ').isValid).toBe(false);
        });

        it('should reject non-http protocols', () => {
            expect(validateUrl('ftp://example.com').isValid).toBe(false);
            expect(validateUrl('javascript://alert(1)').isValid).toBe(false);
            expect(validateUrl('file:///etc/passwd').isValid).toBe(false);
        });

        it('should reject localhost URLs', () => {
            expect(validateUrl('http://localhost/hook').isValid).toBe(false);
            expect(validateUrl('http://127.0.0.1/hook').isValid).toBe(false);
            expect(validateUrl('http://0.0.0.0/hook').isValid).toBe(false);
        });

        it('should reject private IP ranges', () => {
            expect(validateUrl('http://10.0.0.1/hook').isValid).toBe(false);
            expect(validateUrl('http://192.168.1.1/hook').isValid).toBe(false);
            expect(validateUrl('http://172.16.0.1/hook').isValid).toBe(false);
        });

        it('should reject invalid URL formats', () => {
            expect(validateUrl('not-a-url').isValid).toBe(false);
            expect(validateUrl('://missing-protocol').isValid).toBe(false);
        });

        it('should reject URLs that are too long', () => {
            const longUrl = 'https://example.com/' + 'a'.repeat(2050);
            expect(validateUrl(longUrl).isValid).toBe(false);
        });
    });

    describe('validateWebhookHeaders', () => {
        it('should accept valid custom headers', () => {
            expect(validateWebhookHeaders({
                'X-Custom-Header': 'value',
                'Authorization': 'Bearer token123',
            }).isValid).toBe(true);
        });

        it('should reject forbidden headers', () => {
            expect(validateWebhookHeaders({ 'Host': 'evil.com' }).isValid).toBe(false);
            expect(validateWebhookHeaders({ 'Cookie': 'session=abc' }).isValid).toBe(false);
            expect(validateWebhookHeaders({ 'Transfer-Encoding': 'chunked' }).isValid).toBe(false);
        });

        it('should reject headers with newline characters', () => {
            expect(validateWebhookHeaders({ 'X-Bad': 'value\r\nInjected: header' }).isValid).toBe(false);
        });

        it('should reject too many headers', () => {
            const headers: Record<string, string> = {};
            for (let i = 0; i < 21; i++) {
                headers[`X-Header-${i}`] = 'value';
            }
            expect(validateWebhookHeaders(headers).isValid).toBe(false);
        });

        it('should accept empty headers object', () => {
            expect(validateWebhookHeaders({}).isValid).toBe(true);
        });
    });
});
