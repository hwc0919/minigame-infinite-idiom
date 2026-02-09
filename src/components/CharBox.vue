<script setup lang="ts">
interface PinyinParts {
    initial: string;
    final: string;
    tone: string;
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

interface Props {
    char: string;
    pinyin: PinyinParts;
    match: CharMatch;
}

defineProps<Props>();
</script>

<template>
    <div class="char-box" :class="{ correct: match.char === 2 }">
        <div class="pinyin">
            <span class="initial" :class="{ correct: match.pinyin.initial === 2 }">{{ pinyin.initial }}</span><span
                class="final" :class="{ correct: match.pinyin.final === 2 }">{{ pinyin.final }}</span><span class="tone"
                :class="{ correct: match.pinyin.tone === 2 }">{{ pinyin.tone }}</span>
        </div>
        <div class="char">{{ char }}</div>
    </div>
</template>

<style scoped>
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
}

.char-box.correct .pinyin {
    color: white;
}

.char-box.correct .char {
    color: white;
}

.pinyin .initial.correct,
.pinyin .final.correct,
.pinyin .tone.correct {
    color: #00bcd4;
    font-weight: bold;
}

.char-box.correct .pinyin .initial.correct,
.char-box.correct .pinyin .final.correct,
.char-box.correct .pinyin .tone.correct {
    color: white;
    font-weight: bold;
}

.pinyin {
    font-size: 12px;
    margin-bottom: 5px;
    color: #666;
}

.char {
    font-size: 28px;
    font-weight: normal;
}
</style>
