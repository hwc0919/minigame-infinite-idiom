<script setup lang="ts">
import type { QuizResult } from '../composables/useCustomMode';

interface Props {
    results: QuizResult[];
    currentIndex: number;
    viewIndex: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    jumpTo: [index: number];
}>();

const getStatusIcon = (result: QuizResult, index: number) => {
    if (index === props.currentIndex && !result.completed) return '▶️';
    if (!result.completed) return '⭕';
    return result.won ? '✅' : '❌';
};

const canJumpTo = (result: QuizResult, index: number) => {
    // 当前题目总是可以点击
    if (index === props.currentIndex) return true;
    // 已完成的题目可以点击
    if (result.completed) return true;
    // 有进度的题目可以点击
    if (result.guesses.length > 0) return true;
    // 其他情况不可点击
    return false;
};
const getStatusClass = (result: QuizResult, index: number) => {
    if (index === props.currentIndex && !result.completed) return 'current';
    if (!result.completed) return 'pending';
    return result.won ? 'success' : 'failed';
};
</script>

<template>
    <div class="progress-nav">
        <div class="progress-title">题目进度</div>
        <div class="progress-items">
            <button
                v-for="(result, index) in results"
                :key="index"
                :class="['progress-item', getStatusClass(result, index)]"
                @click="emit('jumpTo', index)"
                :disabled="!canJumpTo(result, index)"
            >
                <span class="item-icon">{{ getStatusIcon(result, index) }}</span>
                <span class="item-number">{{ index + 1 }}</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.progress-nav {
    background: #f5f5f5;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
}

.progress-title {
    font-size: 14px;
    color: #666;
    margin-bottom: 10px;
    font-weight: bold;
}

.progress-items {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.progress-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border: 2px solid #ddd;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
}

.progress-item:hover:not(:disabled) {
    border-color: #00bcd4;
    transform: translateY(-2px);
}

.progress-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.progress-item.current {
    border-color: #00bcd4;
    background: #e0f7fa;
    font-weight: bold;
}

.progress-item.success {
    border-color: #4caf50;
}

.progress-item.failed {
    border-color: #f44336;
}

.item-icon {
    font-size: 16px;
}

.item-number {
    color: #333;
}
</style>
