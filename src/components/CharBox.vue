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

// 韵母到声调位置的映射表（基于拼音标调规则：a > o > e > i/u）
// 返回 [字符索引, 是否为i/j]
const tonePositions: Record<string, [number, boolean]> = {
    'a': [0, false], 'ai': [0, false], 'ao': [0, false], 'an': [0, false], 'ang': [0, false],
    'o': [0, false], 'ou': [0, false], 'ong': [0, false],
    'e': [0, false], 'ei': [0, false], 'en': [0, false], 'eng': [0, false], 'er': [0, false],
    'i': [0, true], 'ia': [1, false], 'iao': [1, false], 'ie': [1, false], 'iu': [1, false], 'in': [0, true], 'ing': [0, true], 'ian': [1, false], 'iang': [1, false], 'iong': [1, false],
    'u': [0, false], 'ua': [1, false], 'uo': [1, false], 'uai': [1, false], 'ui': [1, true], 'uan': [1, false], 'un': [0, false], 'uang': [1, false], 'ueng': [1, false],
    'v': [0, false], 'ü': [0, false], 've': [1, false], 'üe': [1, false], 'van': [1, false], 'üan': [1, false], 'vn': [0, false], 'ün': [0, false]
};

const toneDisplay = ref<'symbol' | 'number'>('symbol');

const getToneSvg = (tone: string) => {
    const svgs: Record<string, string> = {
        '1': `<svg width="10" height="5" viewBox="0 0 10 5"><line x1="1.5" y1="2.5" x2="6.5" y2="2.5" stroke="currentColor" stroke-width="1" stroke-linecap="round"/></svg>`,
        '2': `<svg width="10" height="5" viewBox="0 0 10 5"><line x1="2" y1="4" x2="6" y2="1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`,
        '3': `<svg width="10" height="5" viewBox="0 0 10 5"><polyline points="1,1.5 4,3.5 7,1.5" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        '4': `<svg width="10" height="5" viewBox="0 0 10 5"><line x1="2" y1="1" x2="6" y2="4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>`
    };
    return svgs[tone] || '';
};

const getTonePosition = (final: string): [number, boolean] => {
    return tonePositions[final] ?? [0, false];
};

const getToneLeftPosition = (final: string): string => {
    const [pos] = getTonePosition(final);
    // 使用 ch 单位（字符宽度）更精确
    return pos + 'ch';
};

const getFinalDisplay = (final: string, hasTone: boolean): string => {
    if (!hasTone || toneDisplay.value === 'number') {
        return final;
    }
    const [pos, isI] = getTonePosition(final);
    if (!isI) {
        return final;
    }
    // 将 i 替换为无点的 ı (U+0131)
    return final.replace(/i/g, 'ı');
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
            <span class="final-wrapper" :class="{ 'tone-number-mode': toneDisplay === 'number' }">
                <span class="final" :class="{ correct: match.pinyin.final === 2, present: match.pinyin.final === 1 }">
                    {{ getFinalDisplay(pinyin.final, !!pinyin.tone && toneDisplay === 'symbol') }}
                </span>
                <span class="tone" :class="{
                    correct: match.pinyin.tone === 2,
                    present: match.pinyin.tone === 1,
                    'tone-symbol': toneDisplay === 'symbol',
                    'tone-number': toneDisplay === 'number'
                }" :style="toneDisplay === 'symbol' ? { left: getToneLeftPosition(pinyin.final) } : {}">
                    <span v-if="toneDisplay === 'number'">{{ pinyin.tone }}</span>
                    <span v-else v-html="getToneSvg(pinyin.tone)"></span>
                </span>
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
    color: #ff6a00;
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
    color: #ff6a00;
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
    display: flex;
    align-items: flex-start;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.final-wrapper {
    position: relative;
    display: inline-block;
}

.final-wrapper.tone-number-mode {
    display: inline;
}

.pinyin .tone.tone-symbol {
    position: absolute;
    top: -10px;
    left: 0;
    width: 10px;
    height: 5px;
}

.pinyin .tone.tone-number {
    margin-left: 2px;
}

.char {
    font-size: 28px;
    font-weight: normal;
}
</style>
