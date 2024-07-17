import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), '');

	return {
		base: '/',
		plugins: [react(), tsconfigPaths()],
		publicDir: './public',
		server: {
			port: 5173,
			strictPort: true,
			// Uncomment the following line to expose to network
			// host: true,
		},
		build: {
			sourcemap: true,
			rollupOptions: {
				output: {
					manualChunks: {
						vendor: ['react', 'react-dom', 'react-router-dom'],
					},
				},
			},
		},
		define: {
			__APP_VERSION__: JSON.stringify(process.env.npm_package_version),
		},
	};
});
