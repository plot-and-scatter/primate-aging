<script lang="ts">
	interface Props {
		label: string;
		options: string[];
		selected: Set<string>;
		onToggle: (value: string) => void;
		onSelectAll: () => void;
		onSelectNone: () => void;
	}

	let { label, options, selected, onToggle, onSelectAll, onSelectNone }: Props = $props();
</script>

<div class="block">
	<div class="flex items-center gap-4 mb-2">
		<span class="text-sm font-medium">{label} ({selected.size}/{options.length}):</span>
		<button type="button" class="text-xs text-blue-600 hover:underline" onclick={onSelectAll}>All</button>
		<button type="button" class="text-xs text-blue-600 hover:underline" onclick={onSelectNone}>None</button>
	</div>
	<div class="flex flex-col gap-1 max-h-32 overflow-y-auto">
		{#each options as option}
			<label class="flex items-center gap-1 text-sm">
				<input
					type="checkbox"
					checked={selected.has(option)}
					onchange={() => onToggle(option)}
				/>
				{option}
			</label>
		{/each}
	</div>
</div>
