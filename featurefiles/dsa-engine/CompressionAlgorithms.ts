export interface HuffmanNode {
  char: string;
  freq: number;
  left?: HuffmanNode;
  right?: HuffmanNode;
}

export interface HuffmanResult {
  originalSizeBits: number;
  compressedSizeBits: number;
  compressionRatioPercent: number;
  codes: Map<string, string>;
  encodedString: string;
  treeRoot?: HuffmanNode;
}

export class CompressionEngine {
  constructor() {}

  /**
   * Huffman Coding Optimal Prefix Tree Compression
   */
  public huffmanCompress(text: string): HuffmanResult {
    if (!text || text.length === 0) {
      return { originalSizeBits: 0, compressedSizeBits: 0, compressionRatioPercent: 0, codes: new Map(), encodedString: '' };
    }

    const freqMap = new Map<string, number>();
    for (const char of text) {
      freqMap.set(char, (freqMap.get(char) || 0) + 1);
    }

    const pq: HuffmanNode[] = Array.from(freqMap.entries()).map(([char, freq]) => ({ char, freq }));
    pq.sort((a, b) => a.freq - b.freq);

    while (pq.length > 1) {
      const left = pq.shift()!;
      const right = pq.shift()!;
      const parent: HuffmanNode = {
        char: left.char + right.char,
        freq: left.freq + right.freq,
        left,
        right,
      };
      // Insert sorted
      let inserted = false;
      for (let i = 0; i < pq.length; i++) {
        if (pq[i].freq > parent.freq) {
          pq.splice(i, 0, parent);
          inserted = true;
          break;
        }
      }
      if (!inserted) pq.push(parent);
    }

    const root = pq[0];
    const codes = new Map<string, string>();
    const buildCodes = (node?: HuffmanNode, path: string = '') => {
      if (!node) return;
      if (!node.left && !node.right) {
        codes.set(node.char, path || '0');
        return;
      }
      buildCodes(node.left, path + '0');
      buildCodes(node.right, path + '1');
    };
    buildCodes(root);

    let encodedString = '';
    for (const char of text) {
      encodedString += codes.get(char) || '';
    }

    const originalSizeBits = text.length * 8; // ASCII 8 bits per char
    const compressedSizeBits = encodedString.length;
    const compressionRatioPercent = Number((((originalSizeBits - compressedSizeBits) / originalSizeBits) * 100).toFixed(1));

    return {
      originalSizeBits,
      compressedSizeBits,
      compressionRatioPercent,
      codes,
      encodedString,
      treeRoot: root,
    };
  }

  /**
   * Run-Length Encoding (RLE)
   */
  public rleCompress(text: string): { original: string; compressed: string; savedBytes: number } {
    if (!text) return { original: '', compressed: '', savedBytes: 0 };
    let compressed = '';
    let count = 1;
    for (let i = 0; i < text.length; i++) {
      if (i + 1 < text.length && text[i] === text[i + 1]) {
        count++;
      } else {
        compressed += `${count > 1 ? count : ''}${text[i]}`;
        count = 1;
      }
    }
    return {
      original: text,
      compressed,
      savedBytes: Math.max(0, text.length - compressed.length),
    };
  }

  /**
   * LZ77 Sliding Window Dictionary Simulation
   */
  public lz77Simulate(text: string): { tokens: Array<{ offset: number; length: number; nextChar: string }> } {
    const tokens: Array<{ offset: number; length: number; nextChar: string }> = [];
    let i = 0;
    const windowSize = 20;

    while (i < text.length) {
      let bestOffset = 0;
      let bestLength = 0;
      const startWindow = Math.max(0, i - windowSize);
      const searchBuffer = text.slice(startWindow, i);

      for (let l = 1; l <= Math.min(10, text.length - i); l++) {
        const substring = text.slice(i, i + l);
        const idx = searchBuffer.lastIndexOf(substring);
        if (idx !== -1) {
          bestOffset = i - (startWindow + idx);
          bestLength = l;
        } else {
          break;
        }
      }

      const nextChar = text[i + bestLength] || '';
      tokens.push({ offset: bestOffset, length: bestLength, nextChar });
      i += bestLength + 1;
    }
    return { tokens };
  }

  /**
   * Client-Side Image Downscale to 400x300 Thumbnail & WebP (Point 1, 2, 4, 12)
   */
  public async compressImageFile(file: File, maxWidth: number = 400, maxHeight: number = 300): Promise<{
    thumbnailDataUrl: string;
    originalBytes: number;
    compressedBytes: number;
    savedPercent: number;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while bounding to maxWidth x maxHeight
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context unavailable'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        // Calculate approx bytes from base64 string
        const base64Len = dataUrl.split(',')[1]?.length || 0;
        const compressedBytes = Math.round((base64Len * 3) / 4);
        const originalBytes = file.size;
        const savedPercent = Math.max(0, Number((((originalBytes - compressedBytes) / originalBytes) * 100).toFixed(1)));

        resolve({
          thumbnailDataUrl: dataUrl,
          originalBytes,
          compressedBytes,
          savedPercent,
        });
      };
      img.onerror = (err) => reject(err);
      img.src = objectUrl;
    });
  }
}

export const globalCompressionEngine = new CompressionEngine();
