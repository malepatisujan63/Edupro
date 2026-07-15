import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

// ── Koinexa Color Replacements ─────────────────────────────────────────────
// Logo palette: Cyan #00CFFF → Blue #4169E1 → Purple #9B5DE5
const replacements = [
  // ── Background / Surface ──
  [/bg-\[#05050A\]/g,          'bg-[#000000]'],
  [/bg-\[#0A0A0A\]/g,          'bg-[#000000]'],
  [/bg-\[#08050A\]/g,          'bg-[#000000]'],
  [/bg-\[#080B14\]/g,          'bg-[#000000]'],
  [/bg-\[#0D0D12\]/g,          'bg-[#000000]'],
  [/bg-\[#101018\]/g,          'bg-[#0D0D0D]'],
  [/bg-\[#1a1a2e\]/g,          'bg-[#111111]'],
  [/bg-\[#202020\]/g,          'bg-[#111111]'],
  [/'#05050A'/g,               "'#000000'"],
  [/'#0A0A0A'/g,               "'#000000'"],
  [/'#101018'/g,               "'#0D0D0D'"],
  [/"#05050A"/g,               '"#000000"'],
  [/"#0A0A0A"/g,               '"#000000"'],
  [/"#101018"/g,               '"#0D0D0D"'],

  // ── Primary accent: Hot Pink → Koinexa Cyan ──
  [/\[#FF007F\]/g,             '[#00CFFF]'],
  [/'#FF007F'/g,               "'#00CFFF'"],
  [/"#FF007F"/g,               '"#00CFFF"'],
  [/#FF007F/g,                 '#00CFFF'],

  // ── Secondary accent: Old Purple → Koinexa Purple ──
  [/\[#7F00FF\]/g,             '[#9B5DE5]'],
  [/'#7F00FF'/g,               "'#9B5DE5'"],
  [/"#7F00FF"/g,               '"#9B5DE5"'],
  [/#7F00FF/g,                 '#9B5DE5'],

  // ── Tertiary: Old Cyan → Koinexa Blue ──
  [/\[#00E5FF\]/g,             '[#4169E1]'],
  [/'#00E5FF'/g,               "'#4169E1'"],
  [/"#00E5FF"/g,               '"#4169E1"'],
  [/#00E5FF/g,                 '#4169E1'],

  // ── Green accents → Koinexa Cyan ──
  [/\[#00E676\]/g,             '[#00CFFF]'],
  [/'#00E676'/g,               "'#00CFFF'"],
  [/"#00E676"/g,               '"#00CFFF"'],
  [/#00E676/g,                 '#00CFFF'],

  // ── Old violet → Koinexa Blue ──
  [/\[#6C63FF\]/g,             '[#4169E1]'],
  [/'#6C63FF'/g,               "'#4169E1'"],

  // ── Old coral orange → Koinexa Purple ──
  [/\[#FCB045\]/g,             '[#9B5DE5]'],
  [/'#FCB045'/g,               "'#9B5DE5'"],

  // ── Gradient: from/via/to replacements ──
  [/from-\[#FF007F\]/g,        'from-[#00CFFF]'],
  [/via-\[#7F00FF\]/g,         'via-[#4169E1]'],
  [/to-\[#7F00FF\]/g,          'to-[#9B5DE5]'],
  [/to-\[#00E5FF\]/g,          'to-[#9B5DE5]'],
  [/from-\[#00E5FF\]/g,        'from-[#00CFFF]'],
  [/via-\[#00E5FF\]/g,         'via-[#4169E1]'],

  // ── Old gradient strings in style attributes ──
  [/from-\[#FF007F\]\/(\d+)/g, 'from-[#00CFFF]/$1'],
  [/to-\[#7F00FF\]\/(\d+)/g,   'to-[#9B5DE5]/$1'],
  [/to-\[#9B5DE5\]\/(\d+)/g,   'to-[#9B5DE5]/$1'], // keep if already done
  [/from-\[#00CFFF\]\/(\d+)/g, 'from-[#00CFFF]/$1'], // keep
  
  // ── Selection ──
  [/selection:bg-\[#FF007F\]/g, 'selection:bg-[#9B5DE5]'],
  [/selection:bg-\[#00CFFF\]/g, 'selection:bg-[#9B5DE5]'],
];

function processFile(filePath) {
  let content = readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [pattern, replacement] of replacements) {
    const next = content.replace(pattern, replacement);
    if (next !== content) { changed = true; content = next; }
  }
  if (changed) {
    writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory() && !['node_modules', '.git', 'dist', 'scripts'].includes(entry)) {
      walkDir(fullPath);
    } else if (stat.isFile() && ['.tsx', '.ts', '.css', '.js'].includes(extname(entry))) {
      processFile(fullPath);
    }
  }
}

console.log('🎨 Applying Koinexa color theme across all source files…');
walkDir('d:/Edunetwork/src');
walkDir('d:/Edunetwork/src/../public');
console.log('✅ Done!');
