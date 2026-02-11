import { pinyin } from 'pinyin-pro';

export interface PinyinParts {
    initial: string;
    final: string;
    tone: string;
}

export interface CharWithPinyin {
    char: string;
    pinyin: PinyinParts;
}

export interface PinyinMatch {
    initial: number;
    final: number;
    tone: number;
}

export interface CharMatch {
    char: number;
    pinyin: PinyinMatch;
}

export interface GameState {
    currentIdiom: string;
    startTime: number;
    guesses: string[];
}

export interface IdiomHistory {
    usedTime: number;
    guesses: string[];
    won: boolean;
}

export interface GuessWithData {
    chars: string[];
    pinyins: PinyinParts[];
    matches: CharMatch[];
}

const KEY = 'idiom2026';

export const encryptIdiom = (text: string): string => {
    const combined = '[这样做是不对的]' + text;
    let result = '';
    for (let i = 0; i < combined.length; i++) {
        result += String.fromCharCode(combined.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length));
    }
    return btoa(encodeURIComponent(result));
};

export const decryptIdiom = (encoded: string): string => {
    const decoded = decodeURIComponent(atob(encoded));
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length));
    }
    return result.replace('[这样做是不对的]', '');
};

export const parseIdiom = (idiom: string): CharWithPinyin[] => {
    const chars = idiom.split('');
    const initials = pinyin(idiom, { pattern: 'initial', type: 'array', toneSandhi: false }) as string[];
    const finals = pinyin(idiom, { pattern: 'final', toneType: 'none', type: 'array', toneSandhi: false }) as string[];
    const toneNums = pinyin(idiom, { pattern: 'num', type: 'array', toneSandhi: false }) as (string | undefined)[];

    return chars.map((char, index) => ({
        char,
        pinyin: {
            initial: initials[index] || '',
            final: finals[index] || '',
            tone: toneNums[index] || ''
        }
    }));
};

const deepCopy = function <T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
};

export const emptyMatch = (): CharMatch => {
    return {
        char: 0,
        pinyin: {
            initial: 0,
            final: 0,
            tone: 0
        }
    };
};

export const compareIdioms = (guess0: CharWithPinyin[], answer0: CharWithPinyin[]): CharMatch[] => {
    let guess = deepCopy(guess0);
    let answer = deepCopy(answer0);

    let matches: CharMatch[] = [];
    let matchedAnswer: CharMatch[] = [];
    for (let i = 0; i < guess.length; ++i) {
        matches.push(emptyMatch());
        matchedAnswer.push(emptyMatch());
    }

    const charCmp = (i: number, j: number) => {
        if (matches[i]!.char || matchedAnswer[j]!.char) {
            return 0;
        }
        if (guess[i]!.char === answer[j]!.char) {
            matches[i]!.char = (j === i) ? 2 : 1;
            matches[i]!.pinyin.initial = (j === i) ? 2 : 1;
            matches[i]!.pinyin.final = (j === i) ? 2 : 1;
            matches[i]!.pinyin.tone = (j === i) ? 2 : 1;
            matchedAnswer[j]!.char = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.initial = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.final = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.tone = (j === i) ? 2 : 1;
            return 1;
        }
        return 0;
    };

    for (let i = 0; i < guess.length; i++) {
        charCmp(i, i);
    }
    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (i === j) continue;
            if (charCmp(i, j)) break;
        }
    }

    const pinyinCmp = (i: number, j: number) => {
        if (matches[i]!.char || matches[i]!.pinyin.initial || matches[i]!.pinyin.final || matches[i]!.pinyin.tone
            || matchedAnswer[j]!.char || matchedAnswer[j]!.pinyin.initial || matchedAnswer[j]!.pinyin.final || matchedAnswer[j]!.pinyin.tone) {
            return 0;
        }
        const full = guess[i]!.pinyin.initial + guess[i]!.pinyin.final + guess[i]!.pinyin.tone;
        const answerFull = answer[j]!.pinyin.initial + answer[j]!.pinyin.final + answer[j]!.pinyin.tone;
        if (full === answerFull) {
            matches[i]!.pinyin.initial = (j === i) ? 2 : 1;
            matches[i]!.pinyin.final = (j === i) ? 2 : 1;
            matches[i]!.pinyin.tone = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.initial = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.final = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.tone = (j === i) ? 2 : 1;
            return 1;
        }
        return 0;
    };

    for (let i = 0; i < guess.length; i++) {
        pinyinCmp(i, i);
    }
    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (i === j) continue;
            if (pinyinCmp(i, j)) break;
        }
    }

    const pinyin2Cmp = (i: number, j: number) => {
        if (matches[i]!.char || matches[i]!.pinyin.initial || matches[i]!.pinyin.final
            || matchedAnswer[j]!.char || matchedAnswer[j]!.pinyin.initial || matchedAnswer[j]!.pinyin.final) {
            return 0;
        }
        const full = guess[i]!.pinyin.initial + guess[i]!.pinyin.final;
        const answerFull = answer[j]!.pinyin.initial + answer[j]!.pinyin.final;
        if (full === answerFull) {
            matches[i]!.pinyin.initial = (j === i) ? 2 : 1;
            matches[i]!.pinyin.final = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.initial = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.final = (j === i) ? 2 : 1;
            return 1;
        }
        return 0;
    };

    for (let i = 0; i < guess.length; i++) {
        pinyin2Cmp(i, i);
    }
    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (i === j) continue;
            if (pinyin2Cmp(i, j)) break;
        }
    }

    const pinyinInitialCmp = (i: number, j: number) => {
        if (matches[i]!.char || matches[i]!.pinyin.initial || matchedAnswer[j]!.char || matchedAnswer[j]!.pinyin.initial) {
            return 0;
        }
        if (guess[i]!.pinyin.initial === answer[j]!.pinyin.initial) {
            matches[i]!.pinyin.initial = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.initial = (j === i) ? 2 : 1;
            return 1;
        }
        return 0;
    };

    for (let i = 0; i < guess.length; i++) {
        pinyinInitialCmp(i, i);
    }
    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (i === j) continue;
            if (pinyinInitialCmp(i, j)) break;
        }
    }

    const pinyinFinalCmp = (i: number, j: number) => {
        if (matches[i]!.char || matches[i]!.pinyin.final || matchedAnswer[j]!.char || matchedAnswer[j]!.pinyin.final) {
            return 0;
        }
        if (guess[i]!.pinyin.final === answer[j]!.pinyin.final) {
            matches[i]!.pinyin.final = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.final = (j === i) ? 2 : 1;
            return 1;
        }
        return 0;
    };

    for (let i = 0; i < guess.length; i++) {
        pinyinFinalCmp(i, i);
    }
    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (i === j) continue;
            if (pinyinFinalCmp(i, j)) break;
        }
    }

    const pinyinToneCmp = (i: number, j: number) => {
        if (matches[i]!.char || matches[i]!.pinyin.tone || matchedAnswer[j]!.char || matchedAnswer[j]!.pinyin.tone) {
            return 0;
        }
        if (guess[i]!.pinyin.tone === answer[j]!.pinyin.tone) {
            matches[i]!.pinyin.tone = (j === i) ? 2 : 1;
            matchedAnswer[j]!.pinyin.tone = (j === i) ? 2 : 1;
            return 1;
        }
        return 0;
    };

    for (let i = 0; i < guess.length; i++) {
        pinyinToneCmp(i, i);
    }
    for (let i = 0; i < guess.length; i++) {
        for (let j = 0; j < answer.length; j++) {
            if (i === j) continue;
            if (pinyinToneCmp(i, j)) break;
        }
    }

    return matches;
};
