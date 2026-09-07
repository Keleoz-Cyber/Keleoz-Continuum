// Byte-for-byte font delivery compression. Do not transcode the source background.
import { readFile, writeFile } from 'node:fs/promises'
import { brotliCompressSync, gzipSync, constants } from 'node:zlib'
const css = await readFile('public/fonts/source.css')
const compressed = brotliCompressSync(css, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } })
await writeFile('public/fonts/source.css.br', compressed)
await writeFile('public/fonts/source.css.gz', gzipSync(css, { level: 9 }))
console.log({ cssBytes: css.length, brotliBytes: compressed.length })
