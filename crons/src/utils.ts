// Keep only entries that change the number of bikes or free docks compated to the previous entry.
// It also always keep the first and last entries

export function reduceLog(
	input: { bikes: number | null; free_docks: number | null; timestamp: string }[],
): { bikes: number | null; free_docks: number | null; timestamp: string }[] {
	if (input.length === 0) {
		return [];
	}
	const output = [input[0]];
	for (let i = 1; i < input.length; i++) {
		if (input[i].bikes !== input[i - 1].bikes || input[i].free_docks !== input[i - 1].free_docks || i === input.length - 1) {
			output.push(input[i]);
		}
	}
	return output;
}
