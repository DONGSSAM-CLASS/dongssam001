import { describe, expect, it } from 'vitest';
import {
  buildStudentEmail,
  buildStudentPassword,
  generateClassCode,
  isValidClassCode,
  isValidStudentPin,
  normalizeClassCode,
  parseStudentEmail,
} from './studentAuth';

describe('studentAuth', () => {
  it('builds virtual emails in the required format', () => {
    expect(buildStudentEmail('ABC123', 7)).toBe('ABC123-7@student.local');
    expect(buildStudentEmail('ABC123', 7, 2)).toBe('ABC123-7-2@student.local');
    expect(() => buildStudentEmail('abc', 7)).toThrow();
    expect(() => buildStudentEmail('ABC123', 0)).toThrow();
  });

  it('parses virtual emails (round trip)', () => {
    expect(parseStudentEmail('ABC123-7@student.local')).toEqual({ authPrefix: 'ABC123', number: 7, generation: 0 });
    expect(parseStudentEmail('ABC123-12-3@student.local')).toEqual({ authPrefix: 'ABC123', number: 12, generation: 3 });
    expect(parseStudentEmail('teacher@school.kr')).toBeNull();
    expect(parseStudentEmail('abc123-7@student.local')).toBeNull();
  });

  it('derives a >=6 char Auth password from a 4~6 digit PIN', () => {
    expect(buildStudentPassword('1234', 'ABC123')).toBe('1234#ABC123');
    expect(buildStudentPassword('1234', 'ABC123').length).toBeGreaterThanOrEqual(6);
    expect(() => buildStudentPassword('12', 'ABC123')).toThrow();
    expect(() => buildStudentPassword('abcd', 'ABC123')).toThrow();
    expect(isValidStudentPin('123456')).toBe(true);
    expect(isValidStudentPin('1234567')).toBe(false);
  });

  it('generates and normalizes class codes', () => {
    const code = generateClassCode();
    expect(isValidClassCode(code)).toBe(true);
    expect(code).not.toMatch(/[IO01]/);
    expect(normalizeClassCode(' ab c-123 ')).toBe('ABC123');
    const fixed = generateClassCode(() => 0);
    expect(fixed).toBe('AAAAAA');
  });
});
