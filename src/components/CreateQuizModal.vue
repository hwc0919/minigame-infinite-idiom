<script setup lang="ts">
import { ref } from 'vue';

interface Props {
    show: boolean;
    encryptFn: (text: string) => string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
    close: [];
}>();

const customIdioms = ref<string[]>(['']);

const addIdiomInput = () => {
    const chineseRegex = /^[\u4e00-\u9fa5]{4}$/;
    const lastIdiom = customIdioms.value[customIdioms.value.length - 1];
    
    if (!lastIdiom || !chineseRegex.test(lastIdiom)) {
        alert('请先输入完整的四字成语');
        return;
    }
    
    if (customIdioms.value.length < 5) {
        customIdioms.value.push('');
    }
};

const removeIdiomInput = (index: number) => {
    customIdioms.value.splice(index, 1);
    if (customIdioms.value.length === 0) {
        customIdioms.value = [''];
    }
};

const generateQuizLink = async () => {
    const chineseRegex = /^[\u4e00-\u9fa5]{4}$/;
    const validIdioms = customIdioms.value.filter(idiom => idiom && chineseRegex.test(idiom));

    if (validIdioms.length !== customIdioms.value.length) {
        alert('所有输入框必须是四字成语');
        return;
    }

    if (validIdioms.length === 0) {
        alert('请至少输入一个四字成语');
        return;
    }

    const encrypted = validIdioms.map(idiom => props.encryptFn(idiom));
    const url = `${window.location.origin}${window.location.pathname}#idioms=${encodeURIComponent(JSON.stringify(encrypted))}`;
    await navigator.clipboard.writeText(url);
    alert('题目链接已复制到剪贴板！');
    customIdioms.value = [''];
    emit('close');
};

const handleClose = () => {
    customIdioms.value = [''];
    emit('close');
};
</script>

<template>
    <div v-if="show" class="modal">
        <div class="modal-content">
            <h2>手动出题</h2>
            <p>输入1-5个四字成语</p>
            <div class="idiom-inputs">
                <div v-for="(idiom, index) in customIdioms" :key="index" class="idiom-input-row">
                    <input v-model="customIdioms[index]" maxlength="4" :placeholder="`成语 ${index + 1}`"
                        class="idiom-input" />
                    <button @click="removeIdiomInput(index)" class="delete-btn">×</button>
                </div>
                <button v-if="customIdioms.length < 5" @click="addIdiomInput" class="add-btn">+</button>
            </div>
            <div class="modal-buttons">
                <button @click="generateQuizLink">生成链接</button>
                <button @click="handleClose" style="background: #999">取消</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal {
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

.modal-content {
    background: white;
    padding: 40px;
    border-radius: 20px;
    text-align: center;
    max-width: 350px;
    animation: scaleIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-content h2 {
    color: #333;
    margin: 0 0 10px;
    font-size: 24px;
}

.modal-content p {
    color: #666;
    margin-bottom: 30px;
    font-size: 18px;
}

.idiom-inputs {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
    align-items: center;
}

.idiom-input-row {
    display: flex;
    gap: 8px;
    width: 100%;
    align-items: center;
}

.idiom-input {
    flex: 1;
    padding: 10px;
    font-size: 16px;
    border: 2px solid #ddd;
    border-radius: 4px;
    text-align: center;
}

.delete-btn {
    width: 30px;
    height: 30px;
    padding: 0;
    font-size: 20px;
    background: #f44336;
    border-radius: 4px;
    flex-shrink: 0;
    border: none;
    color: white;
    cursor: pointer;
}

.delete-btn:hover {
    background: #d32f2f;
}

.add-btn {
    width: 40px;
    height: 40px;
    padding: 0;
    font-size: 20px;
    background: #4caf50;
    border-radius: 4px;
    border: none;
    color: white;
    cursor: pointer;
}

.add-btn:hover {
    background: #45a049;
}

.modal-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
}

.modal-buttons button {
    padding: 10px 20px;
    font-size: 16px;
    background: #00bcd4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.modal-buttons button:hover {
    background: #0097a7;
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
</style>
