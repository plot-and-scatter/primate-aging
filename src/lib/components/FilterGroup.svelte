<script lang="ts">
	import * as Select from '$lib/components/ui/select';

	interface Props {
		label: string;
		options: string[];
		selected: Set<string>;
		onChange: (selected: Set<string>) => void;
	}

	let { label, options, selected, onChange }: Props = $props();

	function handleValueChange(newValue: string[]) {
		onChange(new Set(newValue));
	}
</script>

<Select.Root type="multiple" value={Array.from(selected)} onValueChange={handleValueChange}>
	<Select.Trigger class="w-44 text-sm">
		{#if selected.size === 1}
			{[...selected][0]}
		{:else}
			{label} ({selected.size}/{options.length})
		{/if}
	</Select.Trigger>
	<Select.Content>
		<div class="flex gap-2 px-2 py-1.5 border-b mb-1">
			<button
				type="button"
				class="text-xs text-blue-600 hover:underline"
				onclick={() => onChange(new Set(options))}
			>All</button>
			<button
				type="button"
				class="text-xs text-blue-600 hover:underline"
				onclick={() => onChange(new Set())}
			>None</button>
		</div>
		{#each options as option}
			<Select.Item value={option} label={option} />
		{/each}
	</Select.Content>
</Select.Root>
