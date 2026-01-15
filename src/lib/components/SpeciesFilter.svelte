<script lang="ts">
	interface Props {
		allSpecies: string[];
		selected: Set<string>;
		onToggle: (species: string) => void;
		onSelectAll: () => void;
		onSelectNone: () => void;
	}

	let { allSpecies, selected, onToggle, onSelectAll, onSelectNone }: Props = $props();
</script>

<div class="block">
	<div class="flex items-center gap-4 mb-2">
		<span class="text-sm font-medium">Filter by species ({selected.size}/{allSpecies.length}):</span>
		<button type="button" class="text-xs text-blue-600 hover:underline" onclick={onSelectAll}>All</button>
		<button type="button" class="text-xs text-blue-600 hover:underline" onclick={onSelectNone}>None</button>
	</div>
	<div class="flex flex-wrap gap-x-4 gap-y-1 max-h-32 overflow-y-auto">
		{#each allSpecies as species}
			<label class="flex items-center gap-1 text-sm">
				<input
					type="checkbox"
					checked={selected.has(species)}
					onchange={() => onToggle(species)}
				/>
				{species}
			</label>
		{/each}
	</div>
</div>
