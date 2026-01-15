<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import * as Command from '$lib/components/ui/command';
	import { Button } from '$lib/components/ui/button';
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';

	interface Props {
		allSpecies: string[];
		selected: Set<string>;
		onToggle: (species: string) => void;
		onSelectAll: () => void;
		onSelectNone: () => void;
	}

	let { allSpecies, selected, onToggle, onSelectAll, onSelectNone }: Props = $props();

	let open = $state(false);
	let search = $state('');

	let filtered = $derived(
		search
			? allSpecies.filter((s) => s.toLowerCase().includes(search.toLowerCase()))
			: allSpecies
	);
</script>

<div class="block">
	<span class="block mb-1 text-sm font-medium">
		Filter by species ({selected.size}/{allSpecies.length}):
	</span>
	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props })}
				<Button variant="outline" class="w-64 justify-between" {...props}>
					{selected.size === allSpecies.length
						? 'All species'
						: selected.size === 0
							? 'No species selected'
							: `${selected.size} species selected`}
					<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Content class="w-64 p-0" align="start">
			<Command.Root shouldFilter={false}>
				<Command.Input placeholder="Search species..." bind:value={search} />
				<div class="flex gap-1 p-2 border-b">
					<Button variant="ghost" size="sm" class="h-7 text-xs" onclick={onSelectAll}>
						All
					</Button>
					<Button variant="ghost" size="sm" class="h-7 text-xs" onclick={onSelectNone}>
						None
					</Button>
				</div>
				<Command.List class="max-h-48">
					<Command.Empty>No species found.</Command.Empty>
					<Command.Group>
						{#each filtered as species}
							<Command.Item value={species} onclick={() => onToggle(species)}>
								<Check
									class="mr-2 h-4 w-4 {selected.has(species) ? 'opacity-100' : 'opacity-0'}"
								/>
								{species}
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Popover.Content>
	</Popover.Root>
</div>
