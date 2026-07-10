const { sanitizeObject, sanitizeValue } = require('../middleware/sanitize');

describe('Sanitize middleware', () => {
  it('strips MongoDB operators from object keys', () => {
    const input = { $gt: 1, name: 'Tomatoes' };
    expect(sanitizeObject(input)).toEqual({ gt: 1, name: 'Tomatoes' });
  });

  it('escapes HTML entities in strings', () => {
    expect(sanitizeValue('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('removes leading $ from string values', () => {
    expect(sanitizeValue('$where')).toBe('where');
  });

  it('replaces dots in keys with underscores', () => {
    const input = { 'user.name': 'test' };
    expect(sanitizeObject(input)).toEqual({ user_name: 'test' });
  });

  it('handles nested objects', () => {
    const input = { data: { $ne: null, title: '<b>Hello</b>' } };
    expect(sanitizeObject(input)).toEqual({
      data: { ne: null, title: '&lt;b&gt;Hello&lt;/b&gt;' }
    });
  });
});
