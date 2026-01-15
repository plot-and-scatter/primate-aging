import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = './data/normalized';
const OUTPUT_DIR = './static/data-optimized';

// Load subjects data
const subjectsText = readFileSync(join(DATA_DIR, 'subjects.csv'), 'utf-8');
const subjectsLines = subjectsText.trim().split('\n');
const subjectSpecies = new Map();

for (let i = 1; i < subjectsLines.length; i++) {
	const parts = subjectsLines[i].split(',');
	const subject = parts[0];
	const species = parts[4];
	if (subject && species) {
		subjectSpecies.set(subject, species);
	}
}

console.log(`Loaded ${subjectSpecies.size} subjects`);

// Process each measurement file
const files = readdirSync(DATA_DIR).filter(f => f.startsWith('primate') && f.endsWith('.csv'));

console.log(`Processing ${files.length} measurement files...`);

for (const filename of files) {
	const csvPath = join(DATA_DIR, filename);
	const text = readFileSync(csvPath, 'utf-8');
	const lines = text.trim().split('\n');

	if (lines.length < 2) {
		console.log(`  Skipping ${filename} - no data`);
		continue;
	}

	const headers = lines[0].split(',');
	const subjectIndex = headers.indexOf('subject');

	// Pre-compute age columns
	const ageColumns = [];
	for (let i = 0; i < headers.length; i++) {
		const header = headers[i];
		if (header.length > 1 && header[0] === 'y') {
			const age = parseFloat(header.substring(1));
			if (!isNaN(age)) {
				ageColumns.push({ age, index: i });
			}
		}
	}

	// Process rows into optimized structure
	const processed = [];

	for (let i = 1; i < lines.length; i++) {
		const row = lines[i].split(',');
		const subject = row[subjectIndex];
		const species = subjectSpecies.get(subject);

		if (!species) continue;

		const dataPoints = [];

		for (const { age, index } of ageColumns) {
			const value = row[index];
			if (value && value !== '') {
				const y = parseFloat(value);
				if (!isNaN(y)) {
					dataPoints.push({ x: age, y });
				}
			}
		}

		if (dataPoints.length > 0) {
			processed.push({ subject, species, dataPoints });
		}
	}

	// Write optimized JSON
	const jsonFilename = filename.replace('.csv', '.json');
	const outputPath = join(OUTPUT_DIR, jsonFilename);
	writeFileSync(outputPath, JSON.stringify(processed));

	const originalSize = Buffer.byteLength(text);
	const newSize = Buffer.byteLength(JSON.stringify(processed));
	const savings = ((1 - newSize / originalSize) * 100).toFixed(1);

	console.log(`  ✓ ${filename} → ${jsonFilename} (${savings}% smaller, ${processed.length} subjects)`);
}

console.log('\nDone! All files preprocessed.');
