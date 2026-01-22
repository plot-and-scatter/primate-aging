<script lang="ts">
	import type { Measurement } from '$lib/types';
	import * as Select from '$lib/components/ui/select';

	interface Props {
		measurements: Measurement[];
		selected: string;
		onSelect: (filename: string) => void;
	}

	let { measurements, selected, onSelect }: Props = $props();

	let selectedMeasurement = $derived(measurements.find((m) => m.filename === selected));
	let displayLabel = $derived(
		selectedMeasurement
			? `${selectedMeasurement.measurement} (${selectedMeasurement.unit.trim()})`
			: 'Select a measurement...'
	);

	function handleValueChange(newValue: string) {
		if (newValue && newValue !== selected) {
			onSelect(newValue);
		}
	}
</script>

<Select.Root type="single" value={selected} onValueChange={handleValueChange}>
	<Select.Trigger class="w-80 font-bold text-base">
		{displayLabel}
	</Select.Trigger>
	<Select.Content>
		{#each measurements as m}
			<Select.Item value={m.filename} label="{m.measurement} ({m.unit.trim()})" />
		{/each}
	</Select.Content>
</Select.Root>
