import { slugify } from '../../../src/utils/slugify';

describe('slugify', () => {
  it('lowercases the input', () => {
    expect(slugify('Spaghetti Bolognese')).toBe('spaghetti-bolognese');
  });

  it('updates spaces with hyphens', () => {
    expect(slugify('hello world')).toBe('hello-world');
  });

  it('updates multiple consecutive spaces with a single hyphen', () => {
    expect(slugify('hello   world')).toBe('hello-world');
  });

  it('removes leading and trailing whitespace', () => {
    expect(slugify('  pasta  ')).toBe('pasta');
  });

  it('strips leading hyphens produced by leading special characters', () => {
    expect(slugify('!hello')).toBe('hello');
  });

  it('strips trailing hyphens produced by trailing special characters', () => {
    expect(slugify('hello!')).toBe('hello');
  });

  it('updates non-alphanumeric characters with hyphens', () => {
    expect(slugify('chicken & rice')).toBe('chicken-rice');
  });

  it('collapses multiple consecutive special characters into one hyphen', () => {
    expect(slugify('a--b')).toBe('a-b');
    expect(slugify('a!@#b')).toBe('a-b');
  });

  it('preserves numbers', () => {
    expect(slugify('3 ingredient pasta')).toBe('3-ingredient-pasta');
  });

  it('handles a string that is already a valid slug', () => {
    expect(slugify('simple-tomato-pasta')).toBe('simple-tomato-pasta');
  });

  it('returns an empty string for an all-special-character input', () => {
    expect(slugify('!!!')).toBe('');
  });

  it('returns an empty string for an empty input', () => {
    expect(slugify('')).toBe('');
  });
});
