<script setup lang="ts">
interface Props {
    show: boolean;
}

defineProps<Props>();
const emit = defineEmits<{
    close: [];
    copyLink: [];
    shareQuestion: [];
}>();

const handleCopyLink = () => {
    emit('copyLink');
};

const handleShareQuestion = () => {
    emit('shareQuestion');
};
</script>

<template>
    <div v-if="show" class="modal-overlay" @click="emit('close')">
        <div class="modal-content" @click.stop>
            <h2>分享</h2>
            <div class="share-options">
                <button @click="handleCopyLink" class="share-option">
                    🔗 网站链接
                </button>
                <button @click="handleShareQuestion" class="share-option">
                    📤 当前题目
                </button>
                <a href="https://github.com/hwc0919/minigame-infinite-idiom" target="_blank" class="share-option">
                    ⭐ GitHub 仓库
                </a>
            </div>
            <button @click="emit('close')" class="close-btn">关闭</button>
        </div>
    </div>
</template>

<style scoped>
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

.modal-content {
    background: white;
    padding: 30px;
    border-radius: 12px;
    min-width: 300px;
    max-width: 400px;
}

.modal-content h2 {
    margin: 0 0 20px 0;
    color: #333;
    font-size: 24px;
}

.share-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
}

.share-option {
    padding: 12px 20px;
    font-size: 16px;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    color: #333;
    display: block;
    text-align: center;
}

.share-option:hover {
    background: #e0e0e0;
    border-color: #00bcd4;
}

.close-btn {
    width: 100%;
    padding: 10px;
    background: #9e9e9e;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
}

.close-btn:hover {
    background: #757575;
}
</style>
