<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import CharBox from './components/CharBox.vue';
import CongratsModal from './components/CongratsModal.vue';
import CreateQuizModal from './components/CreateQuizModal.vue';
import HintPanel from './components/HintPanel.vue';
import ProgressNav from './components/ProgressNav.vue';
import RulesModal from './components/RulesModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import ShareModal from './components/ShareModal.vue';
import DonateModal from './components/DonateModal.vue';
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

import alipayQRBase64 from './assets/images/alipay_qr.txt?raw';
import wechatQRBase64 from './assets/images/wechat_qr.txt?raw';
const alipayQR = `data:image/png;base64,${alipayQRBase64}`;
const wechatQR = `data:image/png;base64,${wechatQRBase64}`;

const customMode = useCustomMode();

const answer = ref('');
const guesses = ref<string[]>([]);
const currentInput = ref('');
const gameWon = ref(false);
const gameFailed = ref(false);
const guessedList = ref<string[]>([]);
const successList = ref<string[]>([]);
const guessedHistory = ref<Record<string, IdiomHistory>>({});
const elapsedTimeStr = ref('');
const elapsedTime = ref(0);
const startTime = ref(0);
const showCongrats = ref(false);
const showCreateQuiz = ref(false);
const showRules = ref(false);
const showSettings = ref(false);
const showShare = ref(false);
const showHint = ref(false);

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
    successList.value = [];
    guessedHistory.value = {};
    localStorage.setItem('guessedIdioms', '[]');
    localStorage.setItem('successIdioms', '[]');
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
    window.history.replaceState({}, '', window.location.pathname);
    showCongrats.value = false;
    startNewIdiom();
};

const generateQuizId = async (encryptedList: string[]): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(encryptedList.join(','));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => {
        const hex = b.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('').slice(0, 16);
};

const initGame = async () => {
    guessedList.value = JSON.parse(localStorage.getItem('guessedIdioms') || '[]');
    const savedSuccessList = localStorage.getItem('successIdioms');
    if (savedSuccessList === null) {
        successList.value = [...guessedList.value];
        localStorage.setItem('successIdioms', JSON.stringify(successList.value));
    } else {
        successList.value = JSON.parse(savedSuccessList);
    }
    guessedHistory.value = JSON.parse(localStorage.getItem('guessedHistory') || '{}');

    // Check for URL hash
    const hash = window.location.hash.slice(1);
    const hashParams = new URLSearchParams(hash);

    // Check for URL hash (custom mode or shared idiom)
    const customIdioms = hashParams.get('idioms');
    const sharedIdiom = hashParams.get('idiom');

    if (customIdioms || sharedIdiom) {
        try {
            let idiomsList: string[];
            let encrypted: string[];
            const isShared = !!sharedIdiom;

            if (isShared) {
                // Single shared idiom
                const decrypted = decryptIdiom(sharedIdiom!);
                if (!idioms.includes(decrypted)) {
                    throw new Error('Invalid idiom');
                }
                idiomsList = [decrypted];
                encrypted = [sharedIdiom!];
            } else {
                // Multiple idioms mode
                encrypted = JSON.parse(decodeURIComponent(customIdioms!));
                idiomsList = encrypted.map(decryptIdiom);
            }

            // Generate quizId for both modes
            const quizId = await generateQuizId(encrypted);

            await customMode.init(idiomsList, quizId, isShared);
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
            // Invalid link, continue with normal flow
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
                const history = guessedHistory.value[answer.value];
                if (history) {
                    elapsedTime.value = history.usedTime;
                    const minutes = Math.floor(history.usedTime / 60);
                    const seconds = history.usedTime % 60;
                    elapsedTimeStr.value = minutes > 0 ? `${minutes}分${seconds}秒` : `${seconds}秒`;
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

        if (customMode.isActive.value && customMode.isShareMode()) {
            // 分享模式下，同步到 guessedList 和 guessedHistory
            if (!guessedList.value.includes(answer.value)) {
                guessedList.value.push(answer.value);
                if (guessedList.value.length > 1000) {
                    guessedList.value.shift();
                }
                localStorage.setItem('guessedIdioms', JSON.stringify(guessedList.value));
            }
            if (!successList.value.includes(answer.value)) {
                successList.value.push(answer.value);
                if (successList.value.length > 1000) {
                    successList.value.shift();
                }
                localStorage.setItem('successIdioms', JSON.stringify(successList.value));
            }
            saveToHistory(true);
            customMode.updateCurrentResult(guesses.value, true, seconds);
        } else if (customMode.isActive.value) {
            customMode.updateCurrentResult(guesses.value, true, seconds);
        } else {
            if (!guessedList.value.includes(answer.value)) {
                guessedList.value.push(answer.value);
                if (guessedList.value.length > 1000) {
                    guessedList.value.shift();
                }
                localStorage.setItem('guessedIdioms', JSON.stringify(guessedList.value));
            }
            if (!successList.value.includes(answer.value)) {
                successList.value.push(answer.value);
                if (successList.value.length > 1000) {
                    successList.value.shift();
                }
                localStorage.setItem('successIdioms', JSON.stringify(successList.value));
            }
            saveToHistory(true);
        }
    } else if (guesses.value.length >= MAX_ATTEMPTS) {
        gameFailed.value = true;
        const seconds = Math.floor((Date.now() - startTime.value) / 1000);

        if (customMode.isActive.value && customMode.isShareMode()) {
            // 分享模式下，同步到 guessedList 和 guessedHistory
            if (!guessedList.value.includes(answer.value)) {
                guessedList.value.push(answer.value);
                if (guessedList.value.length > 1000) {
                    guessedList.value.shift();
                }
                localStorage.setItem('guessedIdioms', JSON.stringify(guessedList.value));
            }
            saveToHistory(false);
            customMode.updateCurrentResult(guesses.value, false, seconds);
        } else if (customMode.isActive.value) {
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
    showShare.value = false;
};

const openShare = () => {
    showShare.value = true;
};

const closeShare = () => {
    showShare.value = false;
};

const openCreateQuiz = () => {
    showCreateQuiz.value = true;
};

const closeCreateQuiz = () => {
    showCreateQuiz.value = false;
};

const openRules = () => {
    showRules.value = true;
};

const closeRules = () => {
    showRules.value = false;
};

const openSettings = () => {
    showSettings.value = true;
};

const closeSettings = () => {
    showSettings.value = false;
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

// 桌面宠物
const showPetDialog = ref(false);
const showDonateQR = ref(false);
const petHidden = ref(false);

const closePetDialog = () => showPetDialog.value = false;
const openDonate = () => showDonateQR.value = true;
const closeDonate = () => showDonateQR.value = false;
const hidePet = () => {
    petHidden.value = true;
    closePetDialog();
};
const handlePetClick = () => {
    if (petHidden.value) {
        petHidden.value = false;
    } else {
        showPetDialog.value = true;
    }
};

</script>

<template>
    <div class="game">
        <div class="header">
            <div class="header-buttons">
                <button @click="openRules" class="share-btn" title="游戏规则">ℹ️</button>
                <button @click="openSettings" class="share-btn" title="设置">⚙️</button>
            </div>
            <h1>猜成语</h1>
            <div class="header-buttons">
                <button @click="openCreateQuiz" class="share-btn" title="手动出题">✏️</button>
                <button @click="openShare" class="share-btn" title="分享">🔗</button>
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
        <RulesModal :show="showRules" @close="closeRules" />
        <SettingsModal :show="showSettings" @close="closeSettings" />
        <ShareModal :show="showShare" @close="closeShare" @copyLink="shareWebpage" @shareQuestion="shareCurrent" />

        <CongratsModal :show="showCongrats" :isCustomMode="customMode.isActive.value"
            :results="customMode.results.value" :totalAttempts="totalStats.totalAttempts"
            :totalTime="totalStats.totalTime" @close="showCongrats = false" @exit="exitCustomMode" @reset="resetAll" />

        <div v-if="gameFailed" class="message failed">
            😔 很遗憾，没有猜对！
            <div v-if="!customMode.isActive.value || customMode.viewIndex.value === customMode.currentIndex.value"
                class="action-buttons">
                <button @click="isAllCompleted ? showCompletionDialog() : startNewIdiom()">{{ isAllCompleted ? '完成' :
                    '下一题' }}</button>
                <button v-if="!customMode.isActive.value" @click="shareCurrent" class="share-question-btn"
                    title="分享当前题目">📤 分享题目</button>
            </div>
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
            <a href="#" @click.prevent="showHint = !showHint" class="hint-link">{{ showHint ? '隐藏提示' : '显示提示' }}</a>
        </div>

        <HintPanel v-if="showHint && !gameWon && !gameFailed" :guesses="guessesWithPinyin" />

        <div class="pet" :class="{ 'pet-hidden': petHidden }" @click="handlePetClick" v-show="guessedList.length >= 3">
            🐱</div>

        <div v-if="showPetDialog" class="modal-overlay" @click="closePetDialog">
            <div class="pet-dialog" @click.stop>
                <h3>🐱 喵~</h3>
                <p>加油哦！你已经成功答对 {{ successList.length }} 题啦！</p>
                <div class="action-buttons">
                    <button @click="openDonate">🎁 打赏作者</button>
                    <button @click="hidePet" class="hide-pet-btn hide-pet-btn-mobile">隐藏</button>
                </div>
            </div>
        </div>

        <DonateModal :show="showDonateQR" :alipayQR="alipayQR" :wechatQR="wechatQR" @close="closeDonate" />
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
    justify-content: space-between;
    margin-bottom: 10px;
}

h1 {
    color: #333;
    margin: 0;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
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

.input-row input {
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

.hint-link {
    color: #00bcd4;
    text-decoration: none;
    font-size: 14px;
    margin-top: 8px;
    display: inline-block;
}

.hint-link:hover {
    text-decoration: underline;
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

.pet-dialog {
    background: white;
    padding: 30px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    text-align: center;
    max-width: 300px;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.pet-dialog h3 {
    margin: 0 0 15px 0;
    font-size: 24px;
}

.pet-dialog p {
    margin: 0 0 20px 0;
    color: #666;
}

.pet {
    user-select: none;
    position: fixed;
    bottom: 20px;
    right: 20px;
    font-size: 48px;
    cursor: pointer;
    z-index: 9999;
    transition: transform 0.2s, right 0.3s;
}

.pet:hover {
    transform: scale(1.2);
}

.hide-pet-btn {
    background: #9e9e9e;
}

.hide-pet-btn:hover {
    background: #757575;
}

.hide-pet-btn-mobile {
    display: none;
}

@media (max-width: 480px) {
    .action-buttons {
        flex-direction: column;
    }

    .hide-pet-btn-mobile {
        display: inline-block;
    }

    .pet.pet-hidden {
        right: -40px;
    }
}
</style>
