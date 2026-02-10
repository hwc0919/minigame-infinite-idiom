<script setup lang="ts">
import {
    type PinyinParts,
    type CharMatch,
} from '../idiom'
import { ref, onMounted, onUnmounted } from 'vue';

interface Props {
    char: string;
    pinyin: PinyinParts;
    match: CharMatch;
}

defineProps<Props>();

const toneSymbols: Record<string, string> = {
    '1': '\u02C9',
    '2': '\u02CA',
    '3': '\u02C7',
    '4': '\u02CB',
};

const toneDisplay = ref<'symbol' | 'number'>('symbol');

const getToneDisplay = (tone: string) => {
    if (toneDisplay.value === 'number') {
        return tone;
    }
    return toneSymbols[tone] || '';
};

const handleToneDisplayChange = (event: Event) => {
    const customEvent = event as CustomEvent;
    toneDisplay.value = customEvent.detail;
};

onMounted(() => {
    const settings = localStorage.getItem('settings');
    if (settings) {
        try {
            const parsed = JSON.parse(settings);
            toneDisplay.value = parsed.toneDisplay || 'symbol';
        } catch {
            toneDisplay.value = 'symbol';
        }
    }
    window.addEventListener('toneDisplayChange', handleToneDisplayChange);
});

onUnmounted(() => {
    window.removeEventListener('toneDisplayChange', handleToneDisplayChange);
});
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
            <span class="tone"
                :class="{ correct: match.pinyin.tone === 2, present: match.pinyin.tone === 1, 'tone-symbol': toneDisplay === 'symbol' }">
                {{ getToneDisplay(pinyin.tone) }}
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
    /* font-weight: bold; */
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
    font-size: 16px;
    color: #666;
}

.pinyin .tone {
    margin-left: 2px;
}

.pinyin .tone.tone-symbol {
    transform: scale(1.2, 1);
    display: inline-block;
}

.char {
    font-size: 28px;
    font-weight: normal;
}
</style>
