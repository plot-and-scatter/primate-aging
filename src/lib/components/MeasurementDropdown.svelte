<script lang="ts">
	import type { Measurement } from '$lib/types';

	interface Props {
		measurements: Measurement[];
		selected: string;
		onSelect: (filename: string) => void;
	}

	let { measurements, selected, onSelect }: Props = $props();

	function handleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		onSelect(target.value);
	}
</script>

<div class="block">
	<label class="block mb-1 text-sm font-medium">
		Select measurement:
		<select
			class="mt-1 block w-64 rounded-md border border-input bg-background px-3 py-2 text-sm"
			value={selected}
			onchange={handleChange}
		>
			<option value="">Select a measurement...</option>
			{#each measurements as m}
				<option value={m.filename}>{m.measurement} ({m.unit})</option>
			{/each}
		</select>
	</label>
</div>
