<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import CharBox from './components/CharBox.vue';
import CreateQuizModal from './components/CreateQuizModal.vue';
import ProgressNav from './components/ProgressNav.vue';
import { idioms } from './assets/idioms';
import {
    type GameState,
    type IdiomHistory,
    type GuessWithData,
    type CharMatch,
    encryptIdiom,
    decryptIdiom,
    parseIdiom,
    emptyMatch,
    compareIdioms
} from './idiom';
import { useCustomMode } from './composables/useCustomMode';

const customMode = useCustomMode();

const answer = ref('');
const guesses = ref<string[]>([]);
const currentInput = ref('');
const gameWon = ref(false);
const gameFailed = ref(false);
const guessedList = ref<string[]>([]);
const guessedHistory = ref<Record<string, IdiomHistory>>({});
const elapsedTimeStr = ref('');
const elapsedTime = ref(0);
const startTime = ref(0);
const showCongrats = ref(false);
const showCreateQuiz = ref(false);

const MAX_ATTEMPTS = 10;

const saveGameState = () => {
    const state: GameState = {
        currentIdiom: encryptIdiom(answer.value),
        startTime: startTime.value,
        guesses: guesses.value
    };
    localStorage.setItem('gameState', JSON.stringify(state));
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
    if (customMode.isActive.value) {
        // 如果在查看其他题目，先返回当前题目
        if (customMode.viewIndex.value !== customMode.currentIndex.value) {
            customMode.jumpToIdiom(customMode.currentIndex.value);
            const result = customMode.results.value[customMode.currentIndex.value];
            answer.value = customMode.currentIdiom.value!;
            guesses.value = result?.guesses || [];
            gameWon.value = result?.won || false;
            gameFailed.value = (result?.completed && !result.won) || false;
            elapsedTime.value = result?.time || 0;
            if (result?.time) {
                const minutes = Math.floor(result.time / 60);
                const seconds = result.time % 60;
                elapsedTimeStr.value = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
            } else {
                elapsedTimeStr.value = '';
            }
            currentInput.value = '';
            startTime.value = 0;
            return;
        }

        if (!customMode.nextIdiom()) {
            showCongrats.value = true;
            return;
        }
        answer.value = customMode.currentIdiom.value!;
    } else {
        const newIdiom = getRandomIdiom();
        if (newIdiom === null) {
            showCongrats.value = true;
            return;
        }
        answer.value = newIdiom;
    }

    startTime.value = 0;
    guesses.value = [];
    currentInput.value = '';
    gameWon.value = false;
    gameFailed.value = false;
    elapsedTimeStr.value = '';
    elapsedTime.value = 0;

    if (!customMode.isActive.value) {
        saveGameState();
    }
};

const saveToHistory = (won: boolean) => {
    const endTime = Date.now();
    const elapsed = startTime.value > 0 ? Math.floor((endTime - startTime.value) / 1000) : 0;
    guessedHistory.value[answer.value] = {
        usedTime: elapsed,
        guesses: [...guesses.value],
        won
    };
    localStorage.setItem('guessedHistory', JSON.stringify(guessedHistory.value));
};

const resetAll = () => {
    if (customMode.isActive.value) {
        customMode.exit();
    }
    guessedList.value = [];
    guessedHistory.value = {};
    localStorage.setItem('guessedIdioms', '[]');
    localStorage.setItem('guessedHistory', '{}');
    showCongrats.value = false;
    startNewIdiom();
};

const handleJumpTo = (index: number) => {
    // 跳转前先保存当前题目进度（不改变完成状态）
    if (customMode.isActive.value && customMode.viewIndex.value === customMode.currentIndex.value && guesses.value.length > 0 && !gameWon.value && !gameFailed.value) {
        customMode.saveCurrentProgress(guesses.value);
    }

    customMode.jumpToIdiom(index);
    const result = customMode.results.value[index];
    answer.value = customMode.currentIdiom.value!;
    guesses.value = result?.guesses || [];

    // 正确判断游戏状态
    if (result?.completed) {
        gameWon.value = result.won;
        gameFailed.value = !result.won;
    } else {
        gameWon.value = false;
        gameFailed.value = false;
    }

    elapsedTime.value = result?.time || 0;
    if (result?.time) {
        const minutes = Math.floor(result.time / 60);
        const seconds = result.time % 60;
        elapsedTimeStr.value = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
    } else {
        elapsedTimeStr.value = '';
    }
    currentInput.value = '';
    startTime.value = 0;
};

const exitCustomMode = () => {
    customMode.exit();
    showCongrats.value = false;
    startNewIdiom();
};

const initGame = async () => {
    guessedList.value = JSON.parse(localStorage.getItem('guessedIdioms') || '[]');
    guessedHistory.value = JSON.parse(localStorage.getItem('guessedHistory') || '{}');

    // Check for URL hash
    const hash = window.location.hash.slice(1);
    const hashParams = new URLSearchParams(hash);

    // Check for custom mode (multiple idioms)
    const customIdioms = hashParams.get('idioms');
    if (customIdioms) {
        try {
            const encrypted = JSON.parse(decodeURIComponent(customIdioms));
            const idiomsList = encrypted.map(decryptIdiom);
            const encoder = new TextEncoder();
            const data = encoder.encode(encrypted.join(','));
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const quizId = hashArray.map(b => {
                const hex = b.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('').slice(0, 16);

            await customMode.init(idiomsList, quizId);
            const currentResult = customMode.results.value[customMode.currentIndex.value];
            answer.value = customMode.currentIdiom.value!;
            guesses.value = currentResult?.guesses || [];
            gameWon.value = currentResult?.won || false;
            gameFailed.value = (currentResult?.completed && !currentResult.won) || false;
            elapsedTime.value = currentResult?.time || 0;
            if (currentResult?.time) {
                const minutes = Math.floor(currentResult.time / 60);
                const seconds = currentResult.time % 60;
                elapsedTimeStr.value = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
            }
            currentInput.value = '';
            startTime.value = 0;
            return;
        } catch {
            // Invalid custom mode link
        }
    }

    // Check for shared single idiom
    const sharedIdiom = hashParams.get('idiom');

    if (sharedIdiom) {
        try {
            const decrypted = decryptIdiom(sharedIdiom);
            if (idioms.includes(decrypted)) {
                answer.value = decrypted;

                // Check if this idiom exists in history
                const history = guessedHistory.value[decrypted];
                if (history) {
                    // Load from history
                    guesses.value = [...history.guesses];
                    startTime.value = 0;
                    gameWon.value = history.won;
                    gameFailed.value = !history.won;
                    elapsedTime.value = history.usedTime;
                    const minutes = Math.floor(history.usedTime / 60);
                    const seconds = history.usedTime % 60;
                    elapsedTimeStr.value = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
                } else {
                    // New game
                    startTime.value = 0;
                    guesses.value = [];
                    gameWon.value = false;
                    gameFailed.value = false;
                    elapsedTimeStr.value = '';
                    elapsedTime.value = 0;
                }

                currentInput.value = '';
                saveGameState();
                // Clear hash
                window.history.replaceState({}, '', window.location.pathname);
                return;
            }
        } catch {
            // Invalid shared link, continue with normal flow
        }
    }

    const savedState = localStorage.getItem('gameState');

    if (savedState) {
        try {
            const state: GameState = JSON.parse(savedState);
            answer.value = decryptIdiom(state.currentIdiom);
            startTime.value = state.startTime;
            guesses.value = state.guesses;

            const isGameWon = guesses.value.length > 0 && guesses.value[guesses.value.length - 1] === answer.value;
            const isGameFailed = guesses.value.length >= MAX_ATTEMPTS && !isGameWon;

            console.log('Restored game state:', {
                currentIdiom: state.currentIdiom,
                startTime: new Date(startTime.value).toLocaleString(),
                guesses: guesses.value,
                isGameWon
            });

            if (!isGameWon && !isGameFailed && !idioms.includes(answer.value)) {
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

            if (isGameFailed) {
                gameFailed.value = true;
            }
        } catch {
            startNewIdiom();
        }
    } else {
        startNewIdiom();
    }
};

onMounted(async () => {
    await initGame();
});

const answerParsed = computed(() => parseIdiom(answer.value));

const guessesWithPinyin = computed<GuessWithData[]>(() => {
    return guesses.value.map((guess: string) => {
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

    // 如果在查看其他题目，不允许提交
    if (customMode.isActive.value && customMode.viewIndex.value !== customMode.currentIndex.value) {
        alert('请先返回当前题目再提交答案');
        return;
    }

    if (guesses.value.length === 0) {
        startTime.value = Date.now();
    }

    guesses.value.push(currentInput.value);

    // 自定义模式下每次提交都保存进度（不改变完成状态）
    if (customMode.isActive.value) {
        customMode.saveCurrentProgress(guesses.value);
    } else {
        saveGameState();
    }

    if (currentInput.value === answer.value) {
        gameWon.value = true;
        const endTime = Date.now();
        const seconds = Math.floor((endTime - startTime.value) / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        elapsedTime.value = seconds;
        elapsedTimeStr.value = minutes > 0 ? `${minutes}分${remainingSeconds}秒` : `${remainingSeconds}秒`;

        if (customMode.isActive.value) {
            customMode.updateCurrentResult(guesses.value, true, seconds);
        } else {
            if (!guessedList.value.includes(answer.value)) {
                guessedList.value.push(answer.value);
                if (guessedList.value.length > 1000) {
                    guessedList.value.shift();
                }
                localStorage.setItem('guessedIdioms', JSON.stringify(guessedList.value));
            }
            saveToHistory(true);
        }
    } else if (guesses.value.length >= MAX_ATTEMPTS) {
        gameFailed.value = true;
        const seconds = Math.floor((Date.now() - startTime.value) / 1000);

        if (customMode.isActive.value) {
            customMode.updateCurrentResult(guesses.value, false, seconds);
        } else {
            if (!guessedList.value.includes(answer.value)) {
                guessedList.value.push(answer.value);
                if (guessedList.value.length > 1000) {
                    guessedList.value.shift();
                }
                localStorage.setItem('guessedIdioms', JSON.stringify(guessedList.value));
            }
            saveToHistory(false);
        }
    }

    currentInput.value = '';
};

const shareCurrent = async () => {
    const encrypted = encryptIdiom(answer.value);
    const url = `${window.location.origin}${window.location.pathname}#idiom=${encrypted}&key_id=1`;
    await navigator.clipboard.writeText(url);
    alert('题目链接已复制到剪贴板！');
};

const shareWebpage = async () => {
    const url = `${window.location.origin}${window.location.pathname}`;
    await navigator.clipboard.writeText(url);
    alert('网页链接已复制到剪贴板！');
};

const openCreateQuiz = () => {
    showCreateQuiz.value = true;
};

const closeCreateQuiz = () => {
    showCreateQuiz.value = false;
};

const isAllCompleted = computed(() => {
    if (!customMode.isActive.value) return false;
    return customMode.results.value.every(r => r.completed);
});

const totalStats = computed(() => {
    if (!customMode.isActive.value) return { totalAttempts: 0, totalTime: 0 };
    const totalAttempts = customMode.results.value.reduce((sum, r) => sum + r.guesses.length, 0);
    const totalTime = customMode.results.value.reduce((sum, r) => sum + r.time, 0);
    return { totalAttempts, totalTime };
});

const showCompletionDialog = () => {
    showCongrats.value = true;
};

</script>

<template>
    <div class="game">
        <div class="header">
            <h1>猜成语</h1>
            <div class="header-buttons">
                <button @click="openCreateQuiz" class="share-btn" title="手动出题">✏️</button>
                <button @click="shareWebpage" class="share-btn" title="分享网页">🔗</button>
            </div>
        </div>
        <div v-if="customMode.isActive.value" class="custom-mode-header">
            <div class="progress">{{ customMode.progress.value }}</div>
            <button @click="exitCustomMode" class="exit-btn">退出自定义模式</button>
        </div>
        <div v-else-if="guessedList.length > 0" class="progress">（你已完成 {{ guessedList.length }} 题）</div>

        <ProgressNav v-if="customMode.isActive.value" :results="customMode.results.value"
            :currentIndex="customMode.currentIndex.value" :viewIndex="customMode.viewIndex.value"
            @jumpTo="handleJumpTo" />

        <div class="guesses">
            <div v-for="(guess, guessIndex) in guessesWithPinyin" :key="guessIndex" class="guess-row">
                <CharBox v-for="(char, charIndex) in guess.chars" :key="charIndex" :char="char"
                    :pinyin="guess.pinyins[charIndex]!" :match="guess.matches[charIndex] || emptyMatch()" />
            </div>
            <div v-if="!gameWon && !gameFailed" class="guess-row">
                <CharBox v-for="i in 4" :key="i" :char="currentInput[i - 1] || ''"
                    :pinyin="currentInput[i - 1] ? parseIdiom(currentInput[i - 1]!)[0]!.pinyin : { initial: '', final: '', tone: '' }"
                    :match="{ char: 0, pinyin: { initial: 0, final: 0, tone: 0 } }" />
            </div>
        </div>

        <CreateQuizModal :show="showCreateQuiz" :encryptFn="encryptIdiom" @close="closeCreateQuiz" />

        <div v-if="showCongrats" class="congrats-modal">
            <div class="congrats-content">
                <div class="congrats-icon">🎉</div>
                <h2 v-if="customMode.isActive.value">恭喜完成所有自定义题目！</h2>
                <h2 v-else>恭喜你完成了所有挑战！</h2>

                <div v-if="customMode.isActive.value" class="results-summary">
                    <div v-for="(result, index) in customMode.results.value" :key="index" class="result-item">
                        <div class="result-header">
                            <span class="result-number">第{{ index + 1 }}题</span>
                            <span class="result-idiom">{{ result.idiom }}</span>
                            <span :class="['result-status', result.won ? 'success' : 'failed']">
                                {{ result.won ? '✅' : '❌' }}
                            </span>
                        </div>
                        <div class="result-details">
                            <span>尝试次数：{{ result.guesses.length }}</span>
                            <span>用时：{{ Math.floor(result.time / 60) > 0 ? `${Math.floor(result.time /
                                60)}分${result.time % 60}秒` : `${result.time}秒` }}</span>
                        </div>
                    </div>
                    <div class="total-stats">
                        <div>总尝试次数：{{ totalStats.totalAttempts }}</div>
                        <div>总用时：{{ Math.floor(totalStats.totalTime / 60) > 0 ? `${Math.floor(totalStats.totalTime /
                            60)}分${totalStats.totalTime % 60}秒` : `${totalStats.totalTime}秒` }}</div>
                    </div>
                </div>

                <p v-if="customMode.isActive.value">是否退出自定义模式？</p>
                <p v-else>是否重新开始？</p>
                <div class="congrats-buttons">
                    <button v-if="customMode.isActive.value" @click="exitCustomMode">退出</button>
                    <button v-else @click="resetAll">重新开始</button>
                    <button v-if="customMode.isActive.value" @click="showCongrats = false"
                        class="cancel-btn">取消</button>
                </div>
            </div>
        </div>

        <div v-if="gameFailed" class="message failed">
            😔 很遗憾，没有猜对！
            <button v-if="!customMode.isActive.value || customMode.viewIndex.value === customMode.currentIndex.value"
                @click="isAllCompleted ? showCompletionDialog() : startNewIdiom()">{{ isAllCompleted ? '完成' : '下一题'
                }}</button>
        </div>

        <div v-if="gameWon" class="message">
            🎉 恭喜你猜对了！
            <div>用时：{{ elapsedTimeStr }}<span v-if="elapsedTime === 0">(你一定开挂了!)</span></div>
            <div v-if="!customMode.isActive.value || customMode.viewIndex.value === customMode.currentIndex.value"
                class="action-buttons">
                <button @click="isAllCompleted ? showCompletionDialog() : startNewIdiom()">{{ isAllCompleted ? '完成' :
                    '下一题' }}</button>
                <button v-if="!customMode.isActive.value" @click="shareCurrent" class="share-question-btn"
                    title="分享当前题目">📤 分享题目</button>
            </div>
        </div>

        <div v-if="!gameWon && !gameFailed" class="input-area">
            <div class="input-row">
                <input v-model="currentInput" maxlength="4" placeholder="输入四字成语" @keyup.enter="handleSubmit" />
                <button @click="handleSubmit">确定</button>
            </div>
            <div class="attempts-left">剩余尝试次数：{{ MAX_ATTEMPTS - guesses.length }}</div>
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

.header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 10px;
    position: relative;
}

h1 {
    color: #333;
    margin: 0;
}

.header-buttons {
    display: flex;
    gap: 8px;
}

.share-btn {
    background: transparent;
    border: 1px solid #ddd;
    font-size: 18px;
    padding: 6px 10px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
}

.share-btn:hover {
    background: #f5f5f5;
    border-color: #00bcd4;
}

.action-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 15px;
}

.share-question-btn {
    background: #ff9800;
    font-size: 14px;
}

.share-question-btn:hover {
    background: #f57c00;
}

.custom-mode-header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 15px;
}

.exit-btn {
    background: #f44336;
    font-size: 14px;
    padding: 6px 12px;
}

.exit-btn:hover {
    background: #d32f2f;
}

.progress {
    font-size: 16px;
    color: #666;
    margin-bottom: 20px;
}

.attempts-left {
    font-size: 14px;
    color: #ff9800;
    font-weight: bold;
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
    flex-direction: column;
    align-items: center;
    gap: 10px;
}

.input-row {
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

.message.failed {
    color: #f44336;
}

@media (max-width: 480px) {
    .action-buttons {
        flex-direction: column;
    }
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
    max-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
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

.cancel-btn {
    background: #9e9e9e;
}

.cancel-btn:hover {
    background: #757575;
}

.results-summary {
    margin: 20px 0;
    text-align: left;
}

.result-item {
    background: #f5f5f5;
    padding: 12px;
    margin-bottom: 10px;
    border-radius: 8px;
}

.result-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.result-number {
    font-weight: bold;
    color: #666;
}

.result-idiom {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    flex: 1;
}

.result-status {
    font-size: 20px;
}

.result-status.success {
    color: #4caf50;
}

.result-status.failed {
    color: #f44336;
}

.result-details {
    display: flex;
    gap: 15px;
    font-size: 14px;
    color: #666;
}

.total-stats {
    margin-top: 15px;
    padding: 15px;
    background: #e3f2fd;
    border-radius: 8px;
    font-weight: bold;
    color: #1976d2;
    display: flex;
    justify-content: space-around;
    font-size: 16px;
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
