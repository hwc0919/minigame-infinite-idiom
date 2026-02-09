<script setup lang="ts">
import { ref } from 'vue';
import { pinyin } from 'pinyin-pro';

const answer = '一马当先'; // 答案成语
const answerChars = answer.split('');
const guesses = ref<string[]>([]);
const currentInput = ref('');
const gameWon = ref(false);

const getPinyin = (char: string): string => {
    return pinyin(char, { toneType: 'symbol' });
};

const getCharStatus = (char: string, index: number, guess: string) => {
    if (answerChars[index] === char) return 'correct';
    if (answerChars.includes(char)) return 'present';
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
            <div v-for="(guess, guessIndex) in guesses" :key="guessIndex" class="guess-row">
                <div v-for="(char, charIndex) in guess.split('')" :key="charIndex" class="char-box"
                    :class="getCharStatus(char, charIndex, guess)">
                    <div class="pinyin">{{ getPinyin(char) }}</div>
                    <div class="char">{{ char }}</div>
                </div>
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

.char-box {
    width: 80px;
    height: 90px;
    border: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    background: #e0e0e0;
    color: #000;
}

.char-box.correct {
    background: #00bcd4;
    color: white;
}

.char-box.present {
    color: #ff9800;
}

.char-box.absent {
    background: #e0e0e0;
}

.pinyin {
    font-size: 12px;
    margin-bottom: 5px;
}

.char {
    font-size: 28px;
    font-weight: normal;
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
