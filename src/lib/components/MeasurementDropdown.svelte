<script lang="ts">
	import type { Measurement } from '$lib/types';
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { Button } from '$lib/components/ui/button';
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';

	interface Props {
		measurements: Measurement[];
		selected: string;
		onSelect: (filename: string) => void;
	}

	let { measurements, selected, onSelect }: Props = $props();

	let open = $state(false);

	let selectedMeasurement = $derived(measurements.find((m) => m.filename === selected));
	let displayLabel = $derived(
		selectedMeasurement
			? `${selectedMeasurement.measurement} (${selectedMeasurement.unit.trim()})`
			: 'Select a measurement...'
	);


	function handleSelect(filename: string) {
		onSelect(filename);
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		<Button variant="outline" class="w-80 justify-between font-bold text-base">
			{displayLabel}
			<ChevronsUpDownIcon class="ml-2 h-4 w-4 shrink-0 opacity-50" />
		</Button>
	</Popover.Trigger>
	<Popover.Content class="w-80 p-0">
		<Command.Root>
			<Command.Input placeholder="Search biomarkers..." />
			<Command.List>
				<Command.Empty>No biomarker found.</Command.Empty>
				<Command.Group>
					{#each measurements as m}
						<Command.Item
							value={m.measurement}
							onSelect={() => handleSelect(m.filename)}
						>
							<CheckIcon
								class="mr-2 h-4 w-4 {selected === m.filename ? 'opacity-100' : 'opacity-0'}"
							/>
							{m.measurement} ({m.unit.trim()})
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
