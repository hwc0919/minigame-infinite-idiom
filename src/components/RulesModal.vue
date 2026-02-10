<script setup lang="ts">
import CharBox from './CharBox.vue';
import { emptyMatch } from '../idiom';

defineProps<{
    show: boolean
}>();

const emit = defineEmits<{
    close: []
}>();

const examples = [
    {
        chars: ['恭', '喜', '发', '财'],
        pinyins: [{ initial: 'g', final: 'ong', tone: '1' }, { initial: 'x', final: 'i', tone: '3' }, { initial: 'f', final: 'a', tone: '1' }, { initial: 'c', final: 'ai', tone: '2' }],
        matches: [emptyMatch(), { char: 2, pinyin: { initial: 2, final: 2, tone: 2 } }, emptyMatch(), emptyMatch()],
        hint: '第二个字 喜 为青色，表示其出现在答案中且在正确的位置。'
    },
    {
        chars: ['风', '调', '雨', '顺'],
        pinyins: [{ initial: 'f', final: 'eng', tone: '1' }, { initial: 't', final: 'iao', tone: '2' }, { initial: 'y', final: 'u', tone: '3' }, { initial: 'sh', final: 'un', tone: '4' }],
        matches: [{ char: 1, pinyin: { initial: 0, final: 0, tone: 0 } }, emptyMatch(), emptyMatch(), emptyMatch()],
        hint: '第一个字 风 为橙色，表示其出现在答案中，但并不是第一个字。'
    },
    {
        chars: ['龙', '飞', '凤', '舞'],
        pinyins: [{ initial: 'l', final: 'ong', tone: '2' }, { initial: 'f', final: 'ei', tone: '1' }, { initial: 'f', final: 'eng', tone: '4' }, { initial: 'w', final: 'u', tone: '3' }],
        matches: [
            { char: 0, pinyin: { initial: 2, final: 2, tone: 0 } },
            { char: 0, pinyin: { initial: 0, final: 1, tone: 0 } },
            emptyMatch(),
            emptyMatch()
        ],
        hint: '每个格子的 汉字、声母、韵母、声调 都会独立进行颜色的指示。例如，第一个 龙 汉字为灰色，而其 声母 与 韵母 均为青色，代表该位置的正确答案为其同音字但非 龙 字本身。同理，第二个字中韵母 ei 为橙色，代表其韵母出现在四个字之中，但非位居第二。以此类推。'
    },
    {
        chars: ['硝', '基', '西', '瓜'],
        pinyins: [{ initial: 'x', final: 'iao', tone: '1' }, { initial: 'j', final: 'i', tone: '1' }, { initial: 'x', final: 'i', tone: '1' }, { initial: 'g', final: 'ua', tone: '1' }],
        matches: [
            { char: 2, pinyin: { initial: 2, final: 2, tone: 2 } },
            { char: 2, pinyin: { initial: 2, final: 2, tone: 2 } },
            { char: 2, pinyin: { initial: 2, final: 2, tone: 2 } },
            { char: 2, pinyin: { initial: 2, final: 2, tone: 2 } }
        ],
        hint: '当四个格子都为青色时，你便赢得了游戏！'
    }
];
</script>

<template>
    <div v-if="show" class="modal-overlay" @click="emit('close')" @wheel.stop @touchmove.stop>
        <div class="modal-content" @click.stop @wheel.stop @touchmove.stop>
            <h2>游戏规则</h2>
            <div class="rules">
                <p>你有十次的机会猜一个 <strong>四字词语</strong></p>
                <p>每次猜测后，汉字与拼音的颜色将会标识其与正确答案的区别。</p>

                <div v-for="(example, index) in examples" :key="index" class="example-section">
                    <div class="example-row">
                        <CharBox v-for="(char, i) in example.chars" :key="i" :char="char" :pinyin="example.pinyins[i]!"
                            :match="example.matches[i]!" />
                    </div>
                    <p class="hint">{{ example.hint }}</p>
                </div>
            </div>
            <button @click="emit('close')" class="close-btn">开始游戏</button>
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
    max-width: 450px;
    width: 90%;
    max-height: 85vh;
    overflow-y: auto;
}

h2 {
    color: #333;
    margin: 0 0 20px 0;
    text-align: center;
    font-size: 20px;
}

.rules {
    text-align: left;
    line-height: 1.6;
    color: #666;
    font-size: 14px;
}

.rules>p {
    margin: 0 0 20px 0;
}

.example-section {
    margin-bottom: 25px;
}

.example-row {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-bottom: 10px;
}

.hint {
    font-size: 13px;
    color: #666;
    margin: 0;
    line-height: 1.5;
}

.close-btn {
    width: 100%;
    margin-top: 20px;
    padding: 12px;
    background: #00bcd4;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
}

.close-btn:hover {
    background: #0097a7;
}
</style>
