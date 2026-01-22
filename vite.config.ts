import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		watch: {
			usePolling: true,
			interval: 300,
			ignored: ['**/node_modules/**', '**/data/**', '**/data-optimized/**', '**/.git/**']
		}
	}
});
