
import { parseCsv } from './utils/csvParser';

export interface VocabItem {
    id: string;
    word: string;
    rank: number;
    meaning?: string;
    questionText?: string;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    type?: string;
    [key: string]: any;
}

export interface ColumnMapping {
    word: string; // The column name for 'Word'
    rank?: string; // The column name for 'Rank'
    meaning?: string; // The column name for 'Meaning'
    questionText?: string;
    optionA?: string;
    optionB?: string;
    optionC?: string;
    optionD?: string;
    answer?: string;
    explanation?: string;
    type?: string;
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

                this.processData(data, mapping);
                resolve({ count: this.items.length });
            };

            reader.onerror = () => resolve({ count: 0, error: 'Failed to read file' });
            reader.readAsText(file, encoding);
        });
    }

    async loadFromUrl(url: string, mapping: ColumnMapping, encoding: string = 'UTF-8'): Promise<{ count: number; error?: string }> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                return { count: 0, error: `Failed to fetch file: ${response.statusText}` };
            }
            const buffer = await response.arrayBuffer();
            const decoder = new TextDecoder(encoding);
            const content = decoder.decode(buffer);

            const { data, error } = parseCsv(content);
            if (error) {
                return { count: 0, error };
            }

            this.processData(data, mapping);
            return { count: this.items.length };
        } catch (e: any) {
            return { count: 0, error: e.message || "Unknown error loading DB" };
        }
    }

    private processData(data: any[], mapping: ColumnMapping) {
        this.items = data.map((row, idx) => {
            let rank = mapping.rank && row[mapping.rank] ? parseInt(row[mapping.rank]) : NaN;
            if (isNaN(rank) || rank === 0) {
                // If Rank is missing or 0, fallback to row index (1-based)
                rank = idx + 1;
            }

            return {
                id: `custom_${idx}`,
                word: row[mapping.word],
                rank: rank,
                meaning: mapping.meaning ? row[mapping.meaning] : undefined,
                questionText: mapping.questionText ? row[mapping.questionText] : undefined,
                options: (mapping.optionA && mapping.optionB && mapping.optionC && mapping.optionD) ?
                    [row[mapping.optionA], row[mapping.optionB], row[mapping.optionC], row[mapping.optionD]] : undefined,
                correctAnswer: mapping.answer ? row[mapping.answer] : undefined,
                explanation: mapping.explanation ? row[mapping.explanation] : undefined,
                type: mapping.type ? row[mapping.type] : undefined,
                ...row
            };
        }).filter(item => item.word && item.word.trim().length > 0); // Filter out empty words

        this.isLoaded = true;
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
