import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  sassOptions: {
    // Permet aux SCSS portés du legacy Angular de résoudre `bases`, `colors`, etc.
    // sans préfixe relatif (comportement Angular/Webpack reproduit).
    loadPaths: [path.join(process.cwd(), 'src/styles')],
    silenceDeprecations: ['legacy-js-api', 'import'],
  },
};

export default nextConfig;
