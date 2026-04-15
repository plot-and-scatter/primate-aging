import type { Measurement, DataPoint } from './types';

export function parseCSV(text: string): { headers: string[]; rows: string[][] } {
	const lines = text.replace(/\r/g, '').trim().split('\n');
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
	if (!res.ok) {
		throw new Error(`Failed to load measurements: ${res.status} ${res.statusText}`);
	}
	const text = await res.text();
	const lines = text.replace(/\r/g, '').trim().split('\n');

	return lines.slice(1).map((line) => {
		const values = line.split(',');
		return {
			filename: values[0],
			measurement: values[1],
			unit: values[2]
		};
	});
}

export type SubjectData = {
	species: string;
	sex: string;
	socialEnvironment: string;
	housing: string;
	diet: string;
};

export async function loadSubjects(): Promise<{
	subjects: Map<string, SubjectData>;
	filterOptions: {
		species: string[];
		sex: string[];
		socialEnvironment: string[];
		housing: string[];
		diet: string[];
	};
}> {
	const res = await fetch('/data/subjects.csv');
	if (!res.ok) {
		throw new Error(`Failed to load subjects: ${res.status} ${res.statusText}`);
	}
	const text = await res.text();
	const lines = text.replace(/\r/g, '').trim().split('\n');

	const speciesSet = new Set<string>();
	const sexSet = new Set<string>();
	const socialEnvironmentSet = new Set<string>();
	const housingSet = new Set<string>();
	const dietSet = new Set<string>();

	const subjects = new Map<string, SubjectData>();
	for (const line of lines.slice(1)) {
		const values = line.split(',');
		const subject = values[0];
		const data: SubjectData = {
			species: values[4],
			sex: values[5],
			socialEnvironment: values[6],
			housing: values[7],
			diet: values[8]
		};
		subjects.set(subject, data);

		if (data.species) speciesSet.add(data.species);
		if (data.sex) sexSet.add(data.sex);
		if (data.socialEnvironment) socialEnvironmentSet.add(data.socialEnvironment);
		if (data.housing) housingSet.add(data.housing);
		if (data.diet) dietSet.add(data.diet);
	}

	return {
		subjects,
		filterOptions: {
			species: Array.from(speciesSet).sort(),
			sex: Array.from(sexSet).sort(),
			socialEnvironment: Array.from(socialEnvironmentSet).sort(),
			housing: Array.from(housingSet).sort(),
			diet: Array.from(dietSet).sort()
		}
	};
}
