
import { parseCsv } from './utils/csvParser';

export interface VocabItem {
    id: string;
    word: string;
    rank: number;
    meaning?: string;
    [key: string]: any;
}

export interface ColumnMapping {
    word: string; // The column name for 'Word'
    rank?: string; // The column name for 'Rank'
    meaning?: string; // The column name for 'Meaning'
}

class VocabService {
    private items: VocabItem[] = [];
    private isLoaded: boolean = false;

    async loadFromCsv(file: File, mapping: ColumnMapping, encoding: string = 'UTF-8'): Promise<{ count: number; error?: string }> {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const content = e.target?.result as string;
                if (!content) {
                    resolve({ count: 0, error: 'File is empty' });
                    return;
                }

                const { data, error } = parseCsv(content);
                if (error) {
                    resolve({ count: 0, error });
                    return;
                }

                this.items = data.map((row, idx) => ({
                    id: `custom_${idx}`,
                    word: row[mapping.word],
                    rank: mapping.rank && row[mapping.rank] ? parseInt(row[mapping.rank]) : 1000, // Default rank if missing
                    meaning: mapping.meaning ? row[mapping.meaning] : undefined,
                    ...row
                })).filter(item => item.word); // Filter out empty words

                this.isLoaded = true;
                resolve({ count: this.items.length });
            };

            reader.onerror = () => resolve({ count: 0, error: 'Failed to read file' });
            reader.readAsText(file, encoding);
        });
    }

    getWordForRank(targetRank: number, excludeWords: string[] = []): VocabItem | null {
        if (!this.isLoaded || this.items.length === 0) return null;

        // 1. Filter out used words
        let candidates = this.items.filter(item => !excludeWords.includes(item.word.toLowerCase()));

        if (candidates.length === 0) {
            // If all words used, reset history? Or just return null (end session)
            return null;
        }

        // 2. Find words with rank closest to targetRank
        // Strategy: Look for words within +/- 10% range, expanding if none found
        let range = 100; // Initial range +/- 100 rank
        let qualified: VocabItem[] = [];

        // Max 3 attempts to find words
        for (let i = 0; i < 3; i++) {
            const min = targetRank - range;
            const max = targetRank + range;

            qualified = candidates.filter(item => item.rank >= min && item.rank <= max);

            if (qualified.length > 0) break;
            range *= 2; // Double the range
        }

        // If still no words, just pick any random word from candidates
        if (qualified.length === 0) {
            qualified = candidates;
        }

        // 3. Pick random
        const randomIndex = Math.floor(Math.random() * qualified.length);
        return qualified[randomIndex];
    }

    hasData(): boolean {
        return this.isLoaded && this.items.length > 0;
    }

    clear(): void {
        this.items = [];
        this.isLoaded = false;
    }
}

export const vocabService = new VocabService();
