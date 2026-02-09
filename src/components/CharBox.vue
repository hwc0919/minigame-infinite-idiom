<script setup lang="ts">
import {
    type PinyinParts,
    type CharMatch,
} from '../idiom'

interface Props {
    char: string;
    pinyin: PinyinParts;
    match: CharMatch;
}

defineProps<Props>();
</script>

<template>
    <div class="char-box" :class="{ correct: match.char === 2, present: match.char === 1 }">
        <div class="pinyin">
            <span class="initial" :class="{ correct: match.pinyin.initial === 2, present: match.pinyin.initial === 1 }">
                {{ pinyin.initial }}
            </span>
            <span class="final" :class="{ correct: match.pinyin.final === 2, present: match.pinyin.final === 1 }">
                {{ pinyin.final }}
            </span>
            <span class="tone" :class="{ correct: match.pinyin.tone === 2, present: match.pinyin.tone === 1 }">
                {{ pinyin.tone }}
            </span>
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

.char-box.present {
    background: #e0e0e0;
}

.char-box.correct .pinyin {
    color: white;
}

.char-box.correct .char {
    color: white;
}

.char-box.present .char {
    color: #ff9800;
}

.pinyin .initial.correct,
.pinyin .final.correct,
.pinyin .tone.correct {
    color: #00bcd4;
    font-weight: bold;
}

.pinyin .initial.present,
.pinyin .final.present,
.pinyin .tone.present {
    color: #ff9800;
    font-weight: bold;
}

.char-box.correct .pinyin .initial.correct,
.char-box.correct .pinyin .final.correct,
.char-box.correct .pinyin .tone.correct {
    color: white;
    font-weight: bold;
}

.char-box.correct .pinyin .initial.present,
.char-box.correct .pinyin .final.present,
.char-box.correct .pinyin .tone.present {
    color: white;
    font-weight: normal;
}

.pinyin {
    font-size: 14px;
    color: #666;
}

.char {
    font-size: 28px;
    font-weight: normal;
}
</style>
