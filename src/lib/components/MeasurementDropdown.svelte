<script lang="ts">
	import type { Measurement } from '$lib/types';
	import * as Select from '$lib/components/ui/select';

	interface Props {
		measurements: Measurement[];
		selected: string;
		onSelect: (filename: string) => void;
	}

	let { measurements, selected, onSelect }: Props = $props();

	let value = $derived(
		selected
			? {
					value: selected,
					label: measurements.find((m) => m.filename === selected)
						? `${measurements.find((m) => m.filename === selected)!.measurement} (${measurements.find((m) => m.filename === selected)!.unit.trim()})`
						: selected
				}
			: undefined
	);

	function handleValueChange(newValue: { value: string; label?: string } | undefined) {
		if (newValue?.value) {
			onSelect(newValue.value);
		}
	}
</script>

<Select.Root type="single" {value} onValueChange={handleValueChange}>
	<Select.Trigger class="w-80 font-bold text-base">
		{#if value}
			{value.label}
		{:else}
			Select a measurement...
		{/if}
	</Select.Trigger>
	<Select.Content>
		{#each measurements as m}
			<Select.Item value={m.filename} label="{m.measurement} ({m.unit.trim()})" />
		{/each}
	</Select.Content>
</Select.Root>
