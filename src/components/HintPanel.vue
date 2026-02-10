<script setup lang="ts">
import { computed } from 'vue';
import type { GuessWithData } from '../idiom';

interface Props {
    guesses: GuessWithData[];
}

const props = defineProps<Props>();

const INITIALS = ['b', 'c', 'ch', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 'sh', 't', 'w', 'x', 'y', 'z', 'zh'];
const FINALS = ['a', 'ai', 'an', 'ang', 'ao', 'e', 'ei', 'en', 'eng', 'er', 'i', 'ia', 'ian', 'iang', 'iao', 'ie', 'in', 'ing', 'iong', 'iu', 'o', 'ong', 'ou', 'u', 'ua', 'uai', 'uan', 'uang', 'ui', 'un', 'uo', 'ü', 'üe', 'ün'];

const excludedInitials = computed(() => {
    const excluded = new Set<string>();
    props.guesses.forEach(guess => {
        guess.pinyins.forEach((py, idx) => {
            if (guess.matches[idx]?.pinyin.initial === 0 && py.initial) {
                excluded.add(py.initial);
            }
        });
    });
    return excluded;
});

const excludedFinals = computed(() => {
    const excluded = new Set<string>();
    props.guesses.forEach(guess => {
        guess.pinyins.forEach((py, idx) => {
            if (guess.matches[idx]?.pinyin.final === 0 && py.final) {
                excluded.add(py.final);
            }
        });
    });
    return excluded;
});
</script>

<template>
    <div class="hint-panel">
        <div class="hint-section">
            <h3>声母</h3>
            <div class="pinyin-grid">
                <span v-for="initial in INITIALS" :key="initial" 
                    :class="['pinyin-item', { excluded: excludedInitials.has(initial) }]">
                    {{ initial }}
                </span>
            </div>
        </div>
        <div class="hint-section">
            <h3>韵母</h3>
            <div class="pinyin-grid">
                <span v-for="final in FINALS" :key="final" 
                    :class="['pinyin-item', { excluded: excludedFinals.has(final) }]">
                    {{ final }}
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
.hint-panel {
    margin: 20px 0;
    padding: 15px;
    background: #f9f9f9;
    border-radius: 8px;
}

.hint-section {
    margin-bottom: 15px;
}

.hint-section:last-child {
    margin-bottom: 0;
}

h3 {
    font-size: 14px;
    color: #666;
    margin: 0 0 10px 0;
    text-align: center;
}

.pinyin-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
}

.pinyin-item {
    padding: 4px 8px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 13px;
    color: #333;
    min-width: 28px;
    text-align: center;
}

.pinyin-item.excluded {
    background: #e0e0e0;
    color: #999;
    text-decoration: line-through;
}
</style>
