import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'url';
import process from 'node:process';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	return {
		base: '/',
		plugins: [react(), tsconfigPaths()],
		publicDir: './public',
		server: {
			port: parseInt(env.VITE_PORT || '5173'),
			strictPort: true,
			// Uncomment the following line to expose to network
			// host: true,
		},
		build: {
			sourcemap: true,
			outDir: 'dist', // Explicitly set the output directory to 'dist'
			rollupOptions: {
				output: {
					manualChunks: {
						vendor: ['react', 'react-dom', 'react-router-dom'],
					},
				},
			},
		},
		define: {
			'__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
			// Expose env variables to your app
			'process.env': env,
		},
		resolve: {
			alias: {
				'@': fileURLToPath(new URL('./src', import.meta.url)),
			},
		},
	};
});
