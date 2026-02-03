
const fs = require('fs');
const path = require('path');

function parseCsv(content) {
    try {
        const data = [];
        const headers = [];

        let currentRow = [];
        let currentCell = '';
        let inQuote = false;

        const processedContent = content.replace(/\r\n/g, '\n');

        for (let i = 0; i < processedContent.length; i++) {
            const char = processedContent[i];
            const nextChar = processedContent[i + 1];

            if (char === '"') {
                if (inQuote && nextChar === '"') {
                    currentCell += '"';
                    i++;
                } else {
                    inQuote = !inQuote;
                }
            } else if (char === ',' && !inQuote) {
                currentRow.push(currentCell.trim());
                currentCell = '';
            } else if (char === '\n' && !inQuote) {
                currentRow.push(currentCell.trim());
                currentCell = '';

                if (headers.length === 0) {
                    headers.push(...currentRow);
                } else {
                    if (currentRow.length === headers.length) {
                        const row = {};
                        headers.forEach((h, idx) => {
                            row[h] = currentRow[idx];
                        });
                        data.push(row);
                    } else if (currentRow.length > 0 && (currentRow.length !== 1 || currentRow[0] !== '')) {
                        const row = {};
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

        if (currentRow.length > 0 || currentCell.length > 0) {
            currentRow.push(currentCell.trim());
            if (headers.length === 0) {
                headers.push(...currentRow);
            } else {
                const row = {};
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

const filePath = path.join(__dirname, 'public', 'master_vocabulary_table9000.csv');

try {
    const buffer = fs.readFileSync(filePath);
    const decoder = new TextDecoder('euc-kr');
    const content = decoder.decode(buffer);

    // Parse the content
    const { data, headers } = parseCsv(content);

    console.log('--- ALL HEADERS ---');
    console.log(JSON.stringify(headers, null, 2));
    console.log('-------------------');

    // console.log('\n--- First 5 Data Rows ---');
    for (let i = 0; i < 5; i++) {
        if (data[i]) {
            console.log(`Row ${i} Word:`, data[i]['Word']);
            // console.log(`Row ${i}:`, JSON.stringify(data[i], null, 2));
        }
    }

} catch (error) {
    console.error('Error reading/parsing file:', error);
}
