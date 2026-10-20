import { LogoTrimHelper } from './logo-trim.utils';

describe('LogoTrimHelper', () => {
  /** Builds RGBA pixel data where the listed [x, y] pixels get the given alpha. */
  const pixels = (width: number, height: number, opaque: [number, number][], alpha = 255) => {
    const data = new Uint8ClampedArray(width * height * 4);
    for (const [x, y] of opaque) {
      data[(y * width + x) * 4 + 3] = alpha;
    }
    return { data, width, height };
  };

  it('should return the box around the non-transparent pixels', () => {
    expect(LogoTrimHelper.findVisibleBounds(pixels(10, 8, [[2, 1], [6, 5]]))).toEqual({
      left: 2,
      top: 1,
      width: 5,
      height: 5,
    });
  });

  it('should return the whole image when it has no transparent padding', () => {
    expect(LogoTrimHelper.findVisibleBounds(pixels(3, 2, [[0, 0], [2, 1]]))).toEqual({
      left: 0,
      top: 0,
      width: 3,
      height: 2,
    });
  });

  it('should return null for a fully transparent image', () => {
    expect(LogoTrimHelper.findVisibleBounds(pixels(4, 4, []))).toBeNull();
  });

  it('should ignore nearly transparent pixels', () => {
    const faint = pixels(4, 4, [[0, 0]], LogoTrimHelper.ALPHA_THRESHOLD);
    expect(LogoTrimHelper.findVisibleBounds(faint)).toBeNull();
  });

  /** Builds a 10px wide image whose rows have the given numbers of opaque pixels. */
  const rows = (...counts: number[]) =>
    pixels(
      10,
      counts.length,
      counts.flatMap((count, y) => Array.from({ length: count }, (_, x): [number, number] => [x, y]))
    );

  it('should find the lettering band between narrower artwork above and below', () => {
    expect(LogoTrimHelper.findTextBand(rows(0, 2, 2, 9, 10, 8, 3, 0))).toEqual({ top: 3, height: 3 });
  });

  it('should keep narrow rows inside the lettering band', () => {
    expect(LogoTrimHelper.findTextBand(rows(2, 10, 1, 10, 2, 2, 2, 2))).toEqual({ top: 1, height: 3 });
  });

  it('should find no lettering band when the busy rows fill most of the logo', () => {
    expect(LogoTrimHelper.findTextBand(rows(0, 10, 10, 10, 10, 10, 3, 0))).toBeNull();
  });

  it('should find no lettering band in a fully transparent image', () => {
    expect(LogoTrimHelper.findTextBand(rows(0, 0))).toBeNull();
  });

  it('should return null for an image that has not loaded', () => {
    expect(LogoTrimHelper.measureLogo(new Image())).toBeNull();
  });
});
