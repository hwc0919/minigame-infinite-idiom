<script setup lang="ts">
import { ref, computed } from 'vue';
import { pinyin } from 'pinyin-pro';
import CharBox from './components/CharBox.vue';

interface PinyinParts {
    initial: string;
    final: string;
    tone: string;
}

interface CharWithPinyin {
    char: string;
    pinyin: PinyinParts;
}

interface PinyinMatch {
    initial: number;
    final: number;
    tone: number;
}

interface CharMatch {
    char: number;
    pinyin: PinyinMatch;
}

const answer = '一马当先'; // 答案成语
const guesses = ref<string[]>([]);
const currentInput = ref('');
const gameWon = ref(false);

const parseIdiom = (idiom: string): CharWithPinyin[] => {
    const chars = idiom.split('');
    const initials = pinyin(idiom, { pattern: 'initial', type: 'array' }) as string[];
    const finals = pinyin(idiom, { pattern: 'final', toneType: 'none', type: 'array' }) as string[];
    const toneNums = pinyin(idiom, { pattern: 'num', type: 'array' }) as (string | undefined)[];

    const toneSymbols: Record<string, string> = {
        '1': '\u02C9',
        '2': '\u02CA',
        '3': '\u02C7',
        '4': '\u02CB',
    };

    return chars.map((char, index) => ({
        char,
        pinyin: {
            initial: initials[index] || '',
            final: finals[index] || '',
            tone: toneSymbols[toneNums[index] || ''] || ''
        }
    }));
};

const answerParsed = parseIdiom(answer);

const deepCopy = function <T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
};

const compareIdioms = (guess0: CharWithPinyin[], answer0: CharWithPinyin[]): CharMatch[] => {
    let guess = deepCopy(guess0);
    let answer = deepCopy(answer0);

    // default value
    let matches: CharMatch[] = [];
    let matchedAnswer: CharMatch[] = [];
    for (let i = 0; i < guess.length; ++i) {
        matches.push({
            char: 0,
            pinyin: {
                initial: 0,
                final: 0,
                tone: 0
            }
        });
        matchedAnswer.push({
            char: 0,
            pinyin: {
                initial: 0,
                final: 0,
                tone: 0
            }
        });
    }

    const charCmp = (i: number, j: number) => {
        if (matches[i]!.char || matchedAnswer[j]!.char) {
            return 0;
        }
        if (guess[i]!.char === answer[j]!.char) {
            matches[i]!.char = (j === i) ? 2 : 1; // 位置正确为2，位置错误为1
            matches[i]!.pinyin.initial = (j === i) ? 2 : 1;
            matches[i]!.pinyin.final = (j === i) ? 2 : 1;
            matches[i]!.pinyin.tone = (j === i) ? 2 : 1;
            matchedAnswer[j]!.char = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.initial = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.final = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.tone = (j === i) ? 2 : 1;
            return 1;
        }
        return 0;
    };

    // 先逐字对比
    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (charCmp(i, j)) {
                break;
            }
        }
    }

    // 2.再对比拼音
    // 2.1 对比完整拼音(声母+韵母+声调)
    const pinyinCmp = (i: number, j: number) => {
        if (matches[i]!.char
            || matches[i]!.pinyin.initial
            || matches[i]!.pinyin.final
            || matches[i]!.pinyin.tone
            || matchedAnswer[j]!.char
            || matchedAnswer[j]!.pinyin.initial
            || matchedAnswer[j]!.pinyin.final
            || matchedAnswer[j]!.pinyin.tone) {
            return 0;
        }
        const full = guess[i]!.pinyin.initial + guess[i]!.pinyin.final + guess[i]!.pinyin.tone;
        const answerFull = answer[j]!.pinyin.initial + answer[j]!.pinyin.final + answer[j]!.pinyin.tone;
        if (full === answerFull) {
            matches[i]!.pinyin.initial = (j === i) ? 2 : 1;
            matches[i]!.pinyin.final = (j === i) ? 2 : 1;
            matches[i]!.pinyin.tone = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.initial = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.final = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.tone = (j === i) ? 2 : 1;
            return 1;
        }
        return 0;
    };

    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (pinyinCmp(i, j)) {
                break;
            }
        }
    }

    // 2.2 对比声母+韵母
    const pinyin2Cmp = (i: number, j: number) => {
        if (matches[i]!.char
            || matches[i]!.pinyin.initial
            || matches[i]!.pinyin.final
            || matchedAnswer[j]!.char
            || matchedAnswer[j]!.pinyin.initial
            || matchedAnswer[j]!.pinyin.final) {
            return 0;
        }
        const full = guess[i]!.pinyin.initial + guess[i]!.pinyin.final;
        const answerFull = answer[j]!.pinyin.initial + answer[j]!.pinyin.final;
        if (full === answerFull) {
            matches[i]!.pinyin.initial = (j === i) ? 2 : 1;
            matches[i]!.pinyin.final = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.initial = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.final = (j === i) ? 2 : 1;
            return 1;
        }
        return 0;
    };

    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (pinyin2Cmp(i, j)) {
                break;
            }
        }
    }

    // 2.3 对比声母
    const pinyinInitialCmp = (i: number, j: number) => {
        if (matches[i]!.char
            || matches[i]!.pinyin.initial
            || matchedAnswer[j]!.char
            || matchedAnswer[j]!.pinyin.initial) {
            return 0;
        }
        if (guess[i]!.pinyin.initial === answer[j]!.pinyin.initial) {
            matches[i]!.pinyin.initial = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.initial = (j === i) ? 2 : 1;
            return 1;
        }
        return 0;
    };

    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (pinyinInitialCmp(i, j)) {
                break;
            }
        }
    }

    // 2.4 对比韵母
    const pinyinFinalCmp = (i: number, j: number) => {
        if (matches[i]!.char
            || matches[i]!.pinyin.final
            || matchedAnswer[j]!.char
            || matchedAnswer[j]!.pinyin.final) {
            return 0;
        }
        if (guess[i]!.pinyin.final === answer[j]!.pinyin.final) {
            matches[i]!.pinyin.final = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.final = (j === i) ? 2 : 1;
            return 1;
        }
        return 0;
    };

    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (pinyinFinalCmp(i, j)) {
                break;
            }
        }
    }

    // 2.5 对比声调
    const pinyinToneCmp = (i: number, j: number) => {
        if (matches[i]!.char
            || matches[i]!.pinyin.tone
            || matchedAnswer[j]!.char
            || matchedAnswer[j]!.pinyin.tone) {
            return 0;
        }
        if (guess[i]!.pinyin.tone === answer[j]!.pinyin.tone) {
            matches[i]!.pinyin.tone = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.tone = (j === i) ? 2 : 1;
            return 1;
        }
        return 0;
    };
    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (pinyinToneCmp(i, j)) {
                break;
            }
        }
    }

    return matches;
};

interface GuessWithData {
    chars: string[];
    pinyins: PinyinParts[];
    matches: CharMatch[];
}

const guessesWithPinyin = computed<GuessWithData[]>(() => {
    return guesses.value.map(guess => {
        const parsed = parseIdiom(guess);
        const matches = compareIdioms(parsed, answerParsed);
        return {
            chars: parsed.map(p => p.char),
            pinyins: parsed.map(p => p.pinyin),
            matches
        };
    });
});

const getCharStatus = (char: string, index: number): 'correct' | 'present' | 'absent' => {
    if (answerParsed[index]?.char === char) return 'correct';
    if (answerParsed.some(a => a.char === char)) return 'present';
    return 'absent';
};

const handleSubmit = () => {
    if (currentInput.value.length !== 4) {
        alert('请输入四字成语');
        return;
    }

    guesses.value.push(currentInput.value);

    if (currentInput.value === answer) {
        gameWon.value = true;
    }

    currentInput.value = '';
};

const restart = () => {
    guesses.value = [];
    currentInput.value = '';
    gameWon.value = false;
};
</script>

<template>
    <div class="game">
        <h1>猜成语</h1>

        <div class="guesses">
            <div v-for="(guess, guessIndex) in guessesWithPinyin" :key="guessIndex" class="guess-row">
                <CharBox v-for="(char, charIndex) in guess.chars" :key="charIndex" :char="char"
                    :pinyin="guess.pinyins[charIndex]" :match="guess.matches[charIndex]" />
            </div>
        </div>

        <div v-if="gameWon" class="message">
            🎉 恭喜你猜对了！
            <button @click="restart">再玩一次</button>
        </div>

        <div v-if="!gameWon" class="input-area">
            <input v-model="currentInput" maxlength="4" placeholder="输入四字成语" @keyup.enter="handleSubmit" />
            <button @click="handleSubmit">确定</button>
        </div>
    </div>
</template>

<style scoped>
.game {
    max-width: 500px;
    margin: 50px auto;
    padding: 20px;
    text-align: center;
}

h1 {
    color: #333;
    margin-bottom: 30px;
}

.guesses {
    margin-bottom: 30px;
}

.guess-row {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 10px;
}

.input-area {
    display: flex;
    justify-content: center;
    gap: 10px;
}

input {
    width: 200px;
    padding: 10px;
    font-size: 16px;
    border: 2px solid #ddd;
    border-radius: 4px;
}

button {
    padding: 10px 20px;
    font-size: 16px;
    background: #00bcd4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background: #0097a7;
}

.message {
    margin: 20px 0;
    font-size: 20px;
    color: #4caf50;
    font-weight: bold;
}
</style>
