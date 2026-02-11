<script setup lang="ts">
import { ref } from 'vue';

interface Result {
    idiom: string;
    guesses: string[];
    time: number;
    won: boolean;
    completed: boolean;
}

interface Props {
    show: boolean;
    isCustomMode: boolean;
    results?: Result[];
    totalAttempts?: number;
    totalTime?: number;
}

defineProps<Props>();

const emit = defineEmits<{
    close: [];
    exit: [];
    reset: [];
}>();

const hideIdioms = ref(false);

const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}分${seconds % 60}秒` : `${seconds}秒`;
};
</script>

<template>
    <div v-if="show" class="congrats-modal">
        <div class="congrats-content">
            <div class="congrats-icon">🎉</div>
            <h2 v-if="isCustomMode">恭喜完成所有自定义题目！</h2>
            <h2 v-else>恭喜你完成了所有挑战！</h2>

            <div v-if="isCustomMode && results" class="results-summary">
                <button @click="hideIdioms = !hideIdioms" class="toggle-idioms-btn" :class="{ active: hideIdioms }">
                    {{ hideIdioms ? '👁 显示题目' : '🕶 隐藏题目' }}
                </button>
                <div v-for="(result, index) in results" :key="index" class="result-item">
                    <div class="result-header">
                        <span class="result-number">第{{ index + 1 }}题</span>
                        <span class="result-idiom">{{ hideIdioms ? '****' : result.idiom }}</span>
                        <span :class="['result-status', result.won ? 'success' : 'failed']">
                            {{ result.won ? '✅' : '❌' }}
                        </span>
                    </div>
                    <div class="result-details">
                        <span>尝试次数：{{ result.guesses.length }}</span>
                        <span>用时：{{ formatTime(result.time) }}</span>
                    </div>
                </div>
                <div class="total-stats">
                    <div>总尝试次数：{{ totalAttempts }}</div>
                    <div>总用时：{{ formatTime(totalTime!) }}</div>
                </div>
            </div>

            <p v-if="isCustomMode">是否退出自定义模式？</p>
            <p v-else>是否重新开始？</p>
            <div class="congrats-buttons">
                <button v-if="isCustomMode" @click="emit('exit')">退出</button>
                <button v-else @click="emit('reset')">重新开始</button>
                <button v-if="isCustomMode" @click="emit('close')" class="cancel-btn">取消</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
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

.congrats-buttons button {
    padding: 10px 20px;
    font-size: 16px;
    background: #00bcd4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.congrats-buttons button:hover {
    background: #0097a7;
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

.toggle-idioms-btn {
    margin-bottom: 15px;
    padding: 8px 16px;
    font-size: 14px;
    background: transparent;
    color: #666;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.toggle-idioms-btn:hover {
    background: #f5f5f5;
    border-color: #00bcd4;
    color: #00bcd4;
}

.toggle-idioms-btn.active {
    background: #00bcd4;
    color: white;
    border-color: #00bcd4;
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
