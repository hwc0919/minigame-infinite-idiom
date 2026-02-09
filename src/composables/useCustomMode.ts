import { ref, computed } from 'vue';
import { encryptIdiom, decryptIdiom } from '../idiom';

export interface QuizResult {
    idiom: string;
    guesses: string[];
    won: boolean;
    time: number;
    completed: boolean;
}

interface CustomModeState {
    idioms: string[];
    currentIndex: number;
    results: QuizResult[];
}

const state = ref<CustomModeState | null>(null);
let quizId: string | null = null;
const viewingIndex = ref<number | null>(null); // 当前查看的题目索引

async function generateQuizId(idioms: string[]): Promise<string> {
    const str = idioms.map(encryptIdiom).join(',');
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => {
        const hex = b.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
    return hashHex.slice(0, 16);
}

export function useCustomMode() {
    const isActive = computed(() => state.value !== null);

    const currentIndex = computed(() => state.value?.currentIndex ?? 0);

    const viewIndex = computed(() => viewingIndex.value ?? currentIndex.value);

    const totalCount = computed(() => state.value?.idioms.length ?? 0);

    const currentIdiom = computed(() =>
        state.value ? state.value.idioms[viewIndex.value] : null
    );

    const progress = computed(() =>
        state.value ? `第 ${state.value.currentIndex + 1}/${state.value.idioms.length} 题` : ''
    );

    const results = computed(() => state.value?.results ?? []);

    const isCompleted = computed(() =>
        state.value ? state.value.currentIndex >= state.value.idioms.length : false
    );

    const init = async (idioms: string[], id?: string) => {
        quizId = id || await generateQuizId(idioms);

        const saved = localStorage.getItem(`customQuiz_${quizId}`);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // 确保 results 数组与 idioms 数组长度一致
                const results = idioms.map((idiom, index) => {
                    const savedResult = data.results[index];
                    if (savedResult) {
                        return savedResult;
                    }
                    return {
                        idiom,
                        guesses: [],
                        won: false,
                        time: 0,
                        completed: false
                    };
                });
                state.value = {
                    idioms,
                    currentIndex: Math.min(data.currentIndex, idioms.length - 1),
                    results
                };
                return;
            } catch { }
        }

        state.value = {
            idioms,
            currentIndex: 0,
            results: idioms.map(idiom => ({
                idiom,
                guesses: [],
                won: false,
                time: 0,
                completed: false
            }))
        };
        save();
    };

    const save = () => {
        if (!state.value || !quizId) return;

        const saveData = {
            currentIndex: state.value.currentIndex,
            results: state.value.results
        };
        localStorage.setItem(`customQuiz_${quizId}`, JSON.stringify(saveData));
    };

    const restore = (idioms: string[], id: string): boolean => {
        quizId = id;
        const saved = localStorage.getItem(`customQuiz_${quizId}`);
        if (!saved) return false;

        try {
            const data = JSON.parse(saved);
            state.value = {
                idioms,
                currentIndex: data.currentIndex,
                results: data.results
            };
            return true;
        } catch {
            return false;
        }
    };

    const updateCurrentResult = (guesses: string[], won: boolean, time: number) => {
        if (!state.value) return;

        state.value.results[state.value.currentIndex] = {
            idiom: state.value.idioms[state.value.currentIndex]!,
            guesses: [...guesses],
            won,
            time,
            completed: true
        };
        save();
    };

    const saveCurrentProgress = (guesses: string[]) => {
        if (!state.value) return;

        const current = state.value.results[state.value.currentIndex]!;
        state.value.results[state.value.currentIndex] = {
            ...current,
            guesses: [...guesses]
        };
        save();
    };

    const nextIdiom = (): boolean => {
        if (!state.value) return false;

        // 检查是否还有下一题
        if (state.value.currentIndex >= state.value.idioms.length - 1) {
            return false;
        }

        state.value.currentIndex++;
        save();
        return true;
    };

    const jumpToIdiom = (index: number) => {
        if (!state.value || index < 0 || index >= state.value.idioms.length) return;
        viewingIndex.value = index;
    };

    const backToCurrent = () => {
        viewingIndex.value = null;
    };

    const exit = () => {
        if (quizId) {
            localStorage.removeItem(`customQuiz_${quizId}`);
        }
        state.value = null;
        quizId = null;
        viewingIndex.value = null;
    };

    return {
        isActive,
        currentIndex,
        viewIndex,
        totalCount,
        currentIdiom,
        progress,
        results,
        isCompleted,
        init,
        restore,
        updateCurrentResult,
        saveCurrentProgress,
        nextIdiom,
        jumpToIdiom,
        backToCurrent,
        exit,
        save
    };
}
