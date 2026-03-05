// tools/build_catalog.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Sysclone ROM Catalog Builder
 * Scans the examples directory and generates a static JSON index.
 * Filters out private drafts (prefixed with _) to maintain repository cleanliness.
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXAMPLES_DIR = path.resolve(__dirname, '../examples');
const CATALOG_FILE = path.resolve(EXAMPLES_DIR, 'catalog.json');

try {
    console.log(`🔍 Scanning for public ROMs in: ${EXAMPLES_DIR}`);
    
    const files = fs.readdirSync(EXAMPLES_DIR);
    
    const publicRoms = files.filter(filename => {
        const filePath = path.join(EXAMPLES_DIR, filename);
        const isFile = fs.statSync(filePath).isFile();
        const isBas = filename.toLowerCase().endsWith('.bas');
        // Filter out catalog itself and private drafts starting with underscore
        const isPublic = !filename.startsWith('_') && filename !== 'catalog.json';
        
        return isFile && isBas && isPublic;
    });

    // Generate formatted JSON for GitHub Pages compatibility
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(publicRoms, null, 2), 'utf-8');
    
    console.log(`✅ Success: ${publicRoms.length} official ROMs indexed in catalog.json.`);
} catch (error) {
    console.error(`❌ Catalog Build Error: ${error.message}`);
    process.exit(1);
}