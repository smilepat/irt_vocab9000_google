
export interface CsvParseResult<T = any> {
    data: T[];
    headers: string[];
    error?: string;
}

export function parseCsv(content: string): CsvParseResult {
    try {
        const data: any[] = [];
        const headers: string[] = [];

        let currentRow: string[] = [];
        let currentCell = '';
        let inQuote = false;

        // Normalize line endings
        const processedContent = content.replace(/\r\n/g, '\n');

        for (let i = 0; i < processedContent.length; i++) {
            const char = processedContent[i];
            const nextChar = processedContent[i + 1];

            if (char === '"') {
                if (inQuote && nextChar === '"') {
                    // Escaped quote
                    currentCell += '"';
                    i++;
                } else {
                    // Toggle quote state
                    inQuote = !inQuote;
                }
            } else if (char === ',' && !inQuote) {
                // End of cell
                currentRow.push(currentCell.trim()); // Trim whitespace around unquoted values? usually careful with trimming inside quotes but here we pushed stripped content. Ideally strict CSV doesn't trim, but for flexibility we might. Let's keep trim for now but maybe only trimming start/end of unquoted.
                // Actually, let's allow trim for robustness.
                currentCell = '';
            } else if (char === '\n' && !inQuote) {
                // End of row
                currentRow.push(currentCell.trim());
                currentCell = '';

                if (headers.length === 0) {
                    // First row -> headers
                    // Handle duplicate headers
                    const processedHeaders = currentRow.map((h, idx) => {
                        // Basic valid char check or allow all?
                        let headerName = h;
                        if (currentRow.filter((ch, cidx) => ch === h && cidx < idx).length > 0) {
                            headerName = `${h}_${idx}`;
                        }
                        return headerName;
                    });
                    headers.push(...processedHeaders);
                } else {
                    // Data row
                    if (currentRow.length === headers.length) {
                        const row: any = {};
                        headers.forEach((h, idx) => {
                            row[h] = currentRow[idx];
                        });
                        data.push(row);
                    } else if (currentRow.length > 0 && (currentRow.length !== 1 || currentRow[0] !== '')) {
                        // Handle mismatch length or skip empty lines
                        // For now just push what we have if it matches reasonably or pad?
                        // Let's simple-pad
                        const row: any = {};
                        headers.forEach((h, idx) => {
                            row[h] = currentRow[idx] || '';
                        });
                        data.push(row);
                    }
                }
                currentRow = [];
            } else {
                currentCell += char;
            }
        }

        // Handle last row if no newline at end
        if (currentRow.length > 0 || currentCell.length > 0) {
            currentRow.push(currentCell.trim());
            if (headers.length === 0) {
                headers.push(...currentRow);
            } else {
                const row: any = {};
                headers.forEach((h, idx) => {
                    row[h] = currentRow[idx] || '';
                });
                data.push(row);
            }
        }

        return { data, headers };
    } catch (e) {
        console.error(e);
        return { data: [], headers: [], error: 'Failed to parse CSV' };
    }
}
