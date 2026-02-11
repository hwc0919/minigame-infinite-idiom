<script setup lang="ts">
interface Props {
    show: boolean;
    alipayQR: string;
    wechatQR: string;
}

defineProps<Props>();
const emit = defineEmits<{
    close: [];
}>();
</script>

<template>
    <div v-if="show" class="modal-overlay" @click="emit('close')">
        <div class="modal-content" @click.stop>
            <h3>🙏 感谢支持</h3>
            <p>如果这个项目对你有帮助，可以请作者喝杯咖啡 ☕</p>
            <div class="qr-container">
                <div class="qr-item">
                    <img :src="alipayQR" alt="支付宝" />
                    <p>支付宝</p>
                </div>
                <div class="qr-item">
                    <img :src="wechatQR" alt="微信" />
                    <p>微信</p>
                </div>
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
    text-align: center;
    max-width: 400px;
}

.modal-content h3 {
    margin: 0 0 15px 0;
    font-size: 24px;
}

.modal-content p {
    margin: 0 0 20px 0;
    color: #666;
}

.qr-container {
    display: flex;
    gap: 20px;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 20px;
}

.qr-item img {
    max-width: 150px;
    height: auto;
}

.qr-item p {
    font-size: 12px;
    color: #999;
    margin-top: 8px;
}

.close-btn {
    width: 100%;
    padding: 10px;
    background: #00bcd4;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
}

.close-btn:hover {
    background: #0097a7;
}
</style>
