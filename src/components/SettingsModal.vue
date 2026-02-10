<script setup lang="ts">
import { ref, onMounted } from 'vue';

defineProps<{
    show: boolean
}>();

const emit = defineEmits<{
    close: []
}>();

interface Settings {
    toneDisplay: 'symbol' | 'number';
}

const toneDisplay = ref<'symbol' | 'number'>('symbol');

const loadSettings = (): Settings => {
    const saved = localStorage.getItem('settings');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch {
            return { toneDisplay: 'symbol' };
        }
    }
    return { toneDisplay: 'symbol' };
};

const saveSettings = (settings: Settings) => {
    localStorage.setItem('settings', JSON.stringify(settings));
};

onMounted(() => {
    const settings = loadSettings();
    toneDisplay.value = settings.toneDisplay;
});

const handleToneDisplayChange = (value: 'symbol' | 'number') => {
    toneDisplay.value = value;
    const settings: Settings = { toneDisplay: value };
    saveSettings(settings);
    window.dispatchEvent(new CustomEvent('toneDisplayChange', { detail: value }));
};
</script>

<template>
    <div v-if="show" class="modal-overlay" @click="emit('close')">
        <div class="modal-content" @click.stop>
            <button class="close-x" @click="emit('close')">×</button>
            <h2>设置</h2>
            <div class="settings">
                <div class="setting-item">
                    <label>声调显示方式</label>
                    <div class="button-group">
                        <button :class="['option-btn', { active: toneDisplay === 'symbol' }]"
                            @click="handleToneDisplayChange('symbol')">
                            符号声调
                        </button>
                        <button :class="['option-btn', { active: toneDisplay === 'number' }]"
                            @click="handleToneDisplayChange('number')">
                            数字声调
                        </button>
                    </div>
                </div>
            </div>
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
    border-radius: 8px;
    max-width: 400px;
    width: 90%;
    position: relative;
}

.close-x {
    position: absolute;
    top: 15px;
    right: 15px;
    background: transparent;
    border: none;
    font-size: 28px;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}

.close-x:hover {
    color: #666;
}

h2 {
    color: #333;
    margin: 0 0 20px 0;
    text-align: center;
    font-size: 20px;
}

.settings {
    text-align: left;
}

.setting-item {
    margin-bottom: 20px;
}

.setting-item>label {
    display: block;
    font-weight: bold;
    color: #333;
    margin-bottom: 12px;
    font-size: 15px;
}

.button-group {
    display: flex;
    gap: 10px;
}

.option-btn {
    flex: 1;
    padding: 12px;
    background: white;
    color: #666;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.option-btn:hover {
    border-color: #00bcd4;
}

.option-btn.active {
    background: #00bcd4;
    color: white;
    border-color: #00bcd4;
}
</style>
