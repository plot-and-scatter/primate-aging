import type { Measurement, DataPoint } from './types';

export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
	const lines = text.trim().split('\n');
	const headers = lines[0].split(',');
	const rows = lines.slice(1).map((line) => line.split(','));
	return { headers, rows };
}

export function extractScatterData(
	headers: string[],
	rows: string[][],
	subjectSpecies: Map<string, string>,
	speciesFilter: Set<string>
): DataPoint[] {
	const points: DataPoint[] = [];
	const subjectIndex = headers.indexOf('subject');

	const ageColumns = headers
		.map((h, i) => ({ header: h, index: i }))
		.filter(({ header }) => header.match(/^y\d/));

	for (const row of rows) {
		const subject = row[subjectIndex];
		const species = subjectSpecies.get(subject);

		if (!species || !speciesFilter.has(species)) continue;

		for (const { header, index } of ageColumns) {
			const value = row[index];
			if (value && value !== '') {
				const age = parseFloat(header.slice(1));
				const y = parseFloat(value);
				if (!isNaN(age) && !isNaN(y)) {
					points.push({ x: age, y });
				}
			}
		}
	}

	return points;
}

export async function loadMeasurements(): Promise<Measurement[]> {
	const res = await fetch('/data/measurements.csv');
	const text = await res.text();
	const lines = text.trim().split('\n');

	return lines.slice(1).map((line) => {
		const values = line.split(',');
		return {
			filename: values[0],
			measurement: values[1],
			unit: values[2]
		};
	});
}

export async function loadSubjects(): Promise<{
	subjectSpecies: Map<string, string>;
	allSpecies: string[];
}> {
	const res = await fetch('/data/subjects.csv');
	const text = await res.text();
	const lines = text.trim().split('\n');
	const speciesSet = new Set<string>();

	const map = new Map<string, string>();
	for (const line of lines.slice(1)) {
		const values = line.split(',');
		const subject = values[0];
		const species = values[4];
		map.set(subject, species);
		if (species) speciesSet.add(species);
	}

	return {
		subjectSpecies: map,
		allSpecies: Array.from(speciesSet).sort()
	};
}
