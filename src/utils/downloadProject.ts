import JSZip from 'jszip';
import packageJson from '../../package.json?raw';
import viteConfig from '../../vite.config.ts?raw';
import tsConfig from '../../tsconfig.json?raw';
import indexHtml from '../../index.html?raw';
import readme from '../../README.md?raw';

const sourceFiles = import.meta.glob('/src/**/*.{ts,tsx,css}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export async function downloadProject() {
  const zip = new JSZip();
  const folder = zip.folder('anatomica')!;
  folder.file('package.json', packageJson);
  folder.file('vite.config.ts', viteConfig);
  folder.file('tsconfig.json', tsConfig);
  folder.file('index.html', indexHtml);
  folder.file('README.md', readme);
  for (const [path, content] of Object.entries(sourceFiles)) folder.file(path.replace(/^\//, ''), content);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'anatomica-project.zip';
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}