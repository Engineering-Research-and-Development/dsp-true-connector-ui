/** A rectangle in an image's natural pixel coordinates. */
export interface ImageBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** A horizontal band of an image's rows, in its natural pixel coordinates. */
export interface RowBand {
  top: number;
  height: number;
}

/** The measured visible part of a logo, and the band its lettering occupies, if any. */
export interface LogoMeasurement {
  visible: ImageBounds;
  text: RowBand | null;
}

/**
 * Helper for finding the visible part of a logo, so transparent padding baked
 * into the image file can be cropped away on screen without changing the file.
 */
export class LogoTrimHelper {
  /** Pixels at or below this alpha (0-255) count as transparent, so faint edge noise is ignored. */
  static readonly ALPHA_THRESHOLD = 10;
  /** The image is measured at most this large on its longest side, which is plenty for trimming. */
  static readonly MAX_SAMPLE_SIZE = 512;
  /** Rows holding at least this share of the busiest row's pixels count as lettering. */
  static readonly TEXT_ROW_RATIO = 0.4;
  /** A lettering band taller than this share of the visible height is no band at all (e.g. an icon). */
  static readonly MAX_TEXT_BAND_RATIO = 0.75;

  /**
   * Returns the smallest rectangle holding every non-transparent pixel of the
   * given pixel data, or null when the whole image is transparent.
   */
  static findVisibleBounds(
    pixels: Pick<ImageData, 'data' | 'width' | 'height'>
  ): ImageBounds | null {
    const { data, width, height } = pixels;
    let left = width;
    let top = height;
    let right = -1;
    let bottom = -1;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > LogoTrimHelper.ALPHA_THRESHOLD) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }

    if (right < 0) {
      return null;
    }
    return { left, top, width: right - left + 1, height: bottom - top + 1 };
  }

  /**
   * Finds the band of rows the logo's lettering (from capital top to baseline) occupies:
   * lettering spans the logo's width, so its rows hold the most visible pixels, while artwork
   * sticking out above or below it (icons, descenders) is narrower. Returns null when no such
   * band stands out, e.g. for a logo that is just an icon.
   */
  static findTextBand(pixels: Pick<ImageData, 'data' | 'width' | 'height'>): RowBand | null {
    const { data, width, height } = pixels;
    const rowCounts: number[] = [];
    for (let y = 0; y < height; y++) {
      let count = 0;
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > LogoTrimHelper.ALPHA_THRESHOLD) {
          count++;
        }
      }
      rowCounts.push(count);
    }

    const busiest = Math.max(0, ...rowCounts);
    if (!busiest) {
      return null;
    }
    let visibleTop = height;
    let visibleBottom = -1;
    let top = height;
    let bottom = -1;
    rowCounts.forEach((count, y) => {
      if (count > 0) {
        visibleTop = Math.min(visibleTop, y);
        visibleBottom = y;
      }
      if (count >= busiest * LogoTrimHelper.TEXT_ROW_RATIO) {
        top = Math.min(top, y);
        bottom = y;
      }
    });
    const textHeight = bottom - top + 1;
    if (textHeight > (visibleBottom - visibleTop + 1) * LogoTrimHelper.MAX_TEXT_BAND_RATIO) {
      return null;
    }
    return { top, height: textHeight };
  }

  /**
   * Measures the visible part of a loaded image and its lettering band, in its natural pixel size.
   * Returns null when it cannot be measured (not loaded, fully transparent,
   * no canvas support, or a cross-origin image the canvas may not read).
   */
  static measureLogo(image: HTMLImageElement): LogoMeasurement | null {
    const { naturalWidth, naturalHeight } = image;
    if (!naturalWidth || !naturalHeight) {
      return null;
    }

    const sampleScale = Math.min(
      1,
      LogoTrimHelper.MAX_SAMPLE_SIZE / Math.max(naturalWidth, naturalHeight)
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(naturalWidth * sampleScale));
    canvas.height = Math.max(1, Math.round(naturalHeight * sampleScale));

    try {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        return null;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const sampledPixels = context.getImageData(0, 0, canvas.width, canvas.height);
      const sampled = LogoTrimHelper.findVisibleBounds(sampledPixels);
      if (!sampled) {
        return null;
      }
      // Map back to natural pixels, rounding outwards so no visible pixel is cut off
      const left = Math.max(0, Math.floor(sampled.left / sampleScale));
      const top = Math.max(0, Math.floor(sampled.top / sampleScale));
      const right = Math.min(naturalWidth, Math.ceil((sampled.left + sampled.width) / sampleScale));
      const bottom = Math.min(naturalHeight, Math.ceil((sampled.top + sampled.height) / sampleScale));
      const sampledText = LogoTrimHelper.findTextBand(sampledPixels);
      let text: RowBand | null = null;
      if (sampledText) {
        const textTop = Math.floor(sampledText.top / sampleScale);
        const textBottom = Math.ceil((sampledText.top + sampledText.height) / sampleScale);
        text = { top: textTop, height: textBottom - textTop };
      }
      return { visible: { left, top, width: right - left, height: bottom - top }, text };
    } catch {
      return null;
    }
  }
}
