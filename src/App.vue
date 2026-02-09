<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { pinyin } from 'pinyin-pro';
import CharBox from './components/CharBox.vue';
import { idioms } from './assets/idioms';

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

interface GameState {
    currentIdiom: string;
    startTime: number;
    guesses: string[];
}

const answer = ref('');
const guesses = ref<string[]>([]);
const currentInput = ref('');
const gameWon = ref(false);
const guessedList = ref<string[]>([]);
const elapsedTimeStr = ref('');
const elapsedTime = ref(0);
const startTime = ref(0);
const showCongrats = ref(false);

const KEY = 'idiom2026';

const encryptIdiom = (text: string): string => {
    const combined = '[这样做是不对的]' + text;
    let result = '';
    for (let i = 0; i < combined.length; i++) {
        result += String.fromCharCode(combined.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length));
    }
    return btoa(encodeURIComponent(result));
};

const decryptIdiom = (encoded: string): string => {
    const decoded = decodeURIComponent(atob(encoded));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length));
    }
    return result.replace('[这样做是不对的]', '');
};

const saveGameState = () => {
    const state: GameState = {
        currentIdiom: encryptIdiom(answer.value),
        startTime: startTime.value,
        guesses: guesses.value
    };
    sessionStorage.setItem('gameState', JSON.stringify(state));
};

const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
};

const getRandomIdiom = (): string | null => {
    const availableIdioms = idioms.filter(idiom => !guessedList.value.includes(idiom));

    if (availableIdioms.length === 0) {
        return null;
    }

    return availableIdioms[Math.floor(seededRandom(Date.now()) * availableIdioms.length)]!;
};

const startNewIdiom = () => {
    console.log("start new idiom!!!");
    const newIdiom = getRandomIdiom();

    if (newIdiom === null) {
        console.log("no more idiom available!!!");
        showCongrats.value = true;
        return;
    }

    console.log("new idiom:", newIdiom);
    answer.value = newIdiom;
    startTime.value = 0;
    guesses.value = [];
    currentInput.value = '';
    gameWon.value = false;
    elapsedTimeStr.value = '';
    elapsedTime.value = 0;
    saveGameState();
};

const resetAll = () => {
    guessedList.value = [];
    localStorage.setItem('guessedIdioms', '[]');
    showCongrats.value = false;
    startNewIdiom();
};

const initGame = () => {
    guessedList.value = JSON.parse(localStorage.getItem('guessedIdioms') || '[]');
    const savedState = sessionStorage.getItem('gameState');

    if (savedState) {
        try {
            const state: GameState = JSON.parse(savedState);
            answer.value = decryptIdiom(state.currentIdiom);
            startTime.value = state.startTime;
            guesses.value = state.guesses;

            const isGameWon = guesses.value.length > 0 && guesses.value[guesses.value.length - 1] === answer.value;

            console.log('Restored game state:', {
                answer: answer.value,
                startTime: new Date(startTime.value).toLocaleString(),
                guesses: guesses.value,
                isGameWon
            });

            if (!isGameWon && !idioms.includes(answer.value)) {
                console.log("start new!!!");
                startNewIdiom();
                return;
            }

            if (isGameWon) {
                gameWon.value = true;
                if (startTime.value > 0) {
                    const seconds = Math.floor((Date.now() - startTime.value) / 1000);
                    const minutes = Math.floor(seconds / 60);
                    const remainingSeconds = seconds % 60;
                    elapsedTime.value = seconds;
                    elapsedTimeStr.value = minutes > 0 ? `${minutes}分${remainingSeconds}秒` : `${remainingSeconds}秒`;
                }
            }
        } catch {
            startNewIdiom();
        }
    } else {
        startNewIdiom();
    }
};

onMounted(() => {
    initGame();
});

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

const answerParsed = computed(() => parseIdiom(answer.value));

const deepCopy = function <T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
};

const emptyMatch = (): CharMatch => {
    return {
        char: 0,
        pinyin: {
            initial: 0,
            final: 0,
            tone: 0
        }
    };
};

const compareIdioms = (guess0: CharWithPinyin[], answer0: CharWithPinyin[]): CharMatch[] => {
    let guess = deepCopy(guess0);
    let answer = deepCopy(answer0);

    // default value
    let matches: CharMatch[] = [];
    let matchedAnswer: CharMatch[] = [];
    for (let i = 0; i < guess.length; ++i) {
        matches.push(emptyMatch());
        matchedAnswer.push(emptyMatch());
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
    // 先比较相同位置
    for (let i = 0; i < guess.length; i++) {
        charCmp(i, i);
    }
    // 再比较所有位置
    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (i === j) continue; // 跳过相同位置
            if (charCmp(i, j)) break;
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
        pinyinCmp(i, i);
    }
    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (i === j) continue;
            if (pinyinCmp(i, j)) break;
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
        pinyin2Cmp(i, i);
    }
    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (i === j) continue;
            if (pinyin2Cmp(i, j)) break;
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
        pinyinInitialCmp(i, i);
    }
    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (i === j) continue;
            if (pinyinInitialCmp(i, j)) break;
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
        pinyinFinalCmp(i, i);
    }
    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (i === j) continue;
            if (pinyinFinalCmp(i, j)) break;
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
        pinyinToneCmp(i, i);
    }
    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (i === j) continue;
            if (pinyinToneCmp(i, j)) break;
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
        let matches: CharMatch[] = [];
        try {
            matches = compareIdioms(parsed, answerParsed.value);
        }
        catch (err) {
            console.error('Error comparing idioms:', { guess, answer: answer.value, parsed, answerParsed: answerParsed.value, error: err });
        }
        return {
            chars: parsed.map(p => p.char),
            pinyins: parsed.map(p => p.pinyin),
            matches
        };
    });
});

const handleSubmit = () => {
    if (currentInput.value.length !== 4) {
        alert('请输入四字成语');
        return;
    }

    const chineseRegex = /^[\u4e00-\u9fa5]{4}$/;
    if (!chineseRegex.test(currentInput.value)) {
        alert('请输入四个汉字');
        return;
    }

    if (guesses.value.length === 0) {
        startTime.value = Date.now();
    }

    guesses.value.push(currentInput.value);
    saveGameState();

    if (currentInput.value === answer.value) {
        gameWon.value = true;
        const endTime = Date.now();
        const seconds = Math.floor((endTime - startTime.value) / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        elapsedTime.value = seconds;
        elapsedTimeStr.value = minutes > 0 ? `${minutes}分${remainingSeconds}秒` : `${remainingSeconds}秒`;

        if (!guessedList.value.includes(answer.value)) {
            guessedList.value.push(answer.value);
            if (guessedList.value.length > 1000) {
                guessedList.value.shift();
            }
            localStorage.setItem('guessedIdioms', JSON.stringify(guessedList.value));
        }
    }

    currentInput.value = '';
};

</script>

<template>
    <div class="game">
        <h1>猜成语</h1>
        <div v-if="guessedList.length > 0" class="progress">（你已完成 {{ guessedList.length }} 题）</div>

        <div class="guesses">
            <div v-for="(guess, guessIndex) in guessesWithPinyin" :key="guessIndex" class="guess-row">
                <CharBox v-for="(char, charIndex) in guess.chars" :key="charIndex" :char="char"
                    :pinyin="guess.pinyins[charIndex]!" :match="guess.matches[charIndex] || emptyMatch()" />
            </div>
            <div v-if="!gameWon" class="guess-row">
                <CharBox v-for="i in 4" :key="i" :char="currentInput[i - 1] || ''"
                    :pinyin="currentInput[i - 1] ? parseIdiom(currentInput[i - 1]!)[0]!.pinyin : { initial: '', final: '', tone: '' }"
                    :match="{ char: 0, pinyin: { initial: 0, final: 0, tone: 0 } }" />
            </div>
        </div>

        <div v-if="showCongrats" class="congrats-modal">
            <div class="congrats-content">
                <div class="congrats-icon">🎉</div>
                <h2>恭喜你完成了所有挑战！</h2>
                <p>是否重新开始？</p>
                <div class="congrats-buttons">
                    <button @click="resetAll">重新开始</button>
                </div>
            </div>
        </div>

        <div v-if="gameWon" class="message">
            🎉 恭喜你猜对了！
            <div>用时：{{ elapsedTimeStr }}<span v-if="elapsedTime === 0">(你一定开挂了!)</span></div>
            <button @click="startNewIdiom">下一题</button>
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
    margin-bottom: 10px;
}

.progress {
    font-size: 16px;
    color: #666;
    margin-bottom: 20px;
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

.congrats-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-in;
}

.congrats-content {
    background: white;
    padding: 40px;
    border-radius: 20px;
    text-align: center;
    max-width: 400px;
    animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.congrats-icon {
    font-size: 80px;
    animation: bounce 1s infinite;
}

.congrats-content h2 {
    color: #333;
    margin: 20px 0 10px;
    font-size: 24px;
}

.congrats-content p {
    color: #666;
    margin-bottom: 30px;
    font-size: 18px;
}

.congrats-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

@keyframes scaleIn {
    from {
        transform: scale(0.5);
        opacity: 0;
    }

    to {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes bounce {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-20px);
    }
}
</style>
