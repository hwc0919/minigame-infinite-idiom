<script setup lang="ts">
interface PinyinParts {
    initial: string;
    final: string;
    tone: string;
}

interface Props {
    char: string;
    pinyin: PinyinParts;
    status: 'correct' | 'present' | 'absent';
}

defineProps<Props>();
</script>

<template>
    <div class="char-box" :class="status">
        <div class="pinyin">
            <span class="initial">{{ pinyin.initial }}</span><span class="final">{{ pinyin.final }}</span><span
                class="tone">{{ pinyin.tone }}</span>
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

.char-box.correct .pinyin,
.char-box.correct .char {
    color: white;
}

.char-box.present .char {
    color: #ff9800;
}

.char-box.absent {
    background: #e0e0e0;
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
