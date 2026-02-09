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
    initial: boolean;
    final: boolean;
    tone: boolean;
}

interface CharMatch {
    char: boolean;
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

const compareIdioms = (guess: CharWithPinyin[], answer: CharWithPinyin[]): CharMatch[] => {
    return guess.map((guessItem, index) => {
        const answerItem = answer[index];
        if (!answerItem) {
            return {
                char: false,
                pinyin: {
                    initial: false,
                    final: false,
                    tone: false
                }
            };
        }
        return {
            char: guessItem.char === answerItem.char,
            pinyin: {
                initial: guessItem.pinyin.initial === answerItem.pinyin.initial,
                final: guessItem.pinyin.final === answerItem.pinyin.final,
                tone: guessItem.pinyin.tone === answerItem.pinyin.tone
            }
        };
    });
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
