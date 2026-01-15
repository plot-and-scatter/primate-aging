<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { Button } from '$lib/components/ui/button';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import type { Measurement } from '$lib/types';

	interface Props {
		measurements: Measurement[];
		selected: string;
		onSelect: (filename: string) => void;
	}

	let { measurements, selected, onSelect }: Props = $props();

	let open = $state(false);
	let search = $state('');

	let filtered = $derived(
		search
			? measurements.filter((m) =>
					m.measurement.toLowerCase().includes(search.toLowerCase())
				)
			: measurements
	);

	function handleSelect(filename: string) {
		onSelect(filename);
		open = false;
	}
</script>

<div class="block">
	<span class="block mb-1 text-sm font-medium">Select measurement:</span>
	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button variant="outline" class="w-64 justify-between" {...props}>
					{#if selected}
						{@const m = measurements.find((m) => m.filename === selected)}
						{m?.measurement} ({m?.unit})
					{:else}
						Select a measurement...
					{/if}
					<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-72 p-0" align="start">
			<Command.Root shouldFilter={false}>
				<Command.Input placeholder="Search measurements..." bind:value={search} />
				<Command.List class="max-h-64">
					<Command.Empty>No measurements found.</Command.Empty>
					<Command.Group>
						{#each filtered as m}
							<Command.Item
								value={m.filename}
								onclick={() => handleSelect(m.filename)}
							>
								<Check
									class="mr-2 h-4 w-4 {selected === m.filename ? 'opacity-100' : 'opacity-0'}"
								/>
								{m.measurement} ({m.unit})
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>
