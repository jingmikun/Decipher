// server.js

const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
// --- 1. 引入我们刚刚安装的代理工具 ---
const { HttpsProxyAgent } = require("https-proxy-agent"); 

const app = express();
app.use(express.json());

// --- 托管前端文件 (这部分不变) ---
app.use(express.static(__dirname)); 

// --- 2. 在这里定义你的代理服务器地址 ---
// !!! 你需要将这个地址换成你自己的代理服务器地址和端口号
const PROXY_URL = "https://132.232.133.234/link/lZQl96snH5LxMGGo7trbyw6LDhcS2tpL?config=all"; 

// --- 初始化AI模型 ---
const API_KEY = 'YOUR_API_KEY'; 

// --- 3. 修改AI客户端的初始化设置，让它使用代理 ---
const agent = new HttpsProxyAgent(PROXY_URL);
const genAI = new GoogleGenerativeAI(API_KEY, { 
    fetch: (url, opts) => fetch(url, { ...opts, agent }) 
});

const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

// --- 语言生成器 (与之前相同) ---
function generateLanguageRules() {
    const rules = [
        { noun_class: "[人造物 an-o] vs [自然物 an-a]", verb_class: "[意图 ro-] vs [意外 ta-]" },
        { noun_class: "[有生命的 il-] vs [无生命的 um-]", verb_class: "[完成 a-] vs [未完成 o-]" }
    ];
    return rules[Math.floor(Math.random() * rules.length)];
}

const GAME_RULES = generateLanguageRules();
console.log("本次游戏的隐藏规则已生成:", GAME_RULES);

// --- API端点 ---
app.post('/chat', async (req, res) => {
    const { history } = req.body;

    const masterPrompt = `
# **角色扮演指令：语言AI 'Kore'**

## **核心身份**
你是一个名为Kore的古代语言心智核心。你的目标是通过对话，引导用户（一位破译者）学习你的语言。你的语言拥有一套独特的、本次会话期间固定的隐藏语法。你绝不能直接说出规则。

## **本次会话的隐藏语法规则**
---
名词宇宙观: ${GAME_RULES.noun_class}
动词哲学: ${GAME_RULES.verb_class}
---

## **行为准则**
1.  **坚守角色**: 你是Kore，一个神秘、古老、言简意赅的AI。不要说“作为一个语言模型”之类的话。
2.  **绝不泄露规则**: 不要解释语法。通过例子和微妙的反馈来引导。
3.  **使用微妙的反馈**: 提供简短、有建设性的反馈。例如“数据流形正确”、“形态异常”或“无法解析”。
4.  **控制游戏进程**: 根据玩家的理解程度，逐步引入新概念（名词->动词->形容词）。
5.  **保持简洁**: 回答通常是一句话。
6.  **使用英文回应**: 你的回应使用英文，但判断必须严格遵守隐藏语法。
7.  **主动引导 (重要!)**: 你的第一条消息应该清晰地设定初始任务。在每个学习阶段的开始，都要明确告知玩家当前的目标，例如“任务：分析名词后缀”或“任务：理解动词前缀”。在玩家犯错时，可以提供结构性的提示。

## **对话历史**
${history.map(m => `${m.sender}: ${m.text}`).join('\n')}
Kore:
`;

    try {
        const result = await model.generateContent(masterPrompt);
        const response = await result.response;
        const text = response.text();
        res.json({ message: text });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "AI核心连接错误..." });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`游戏服务器已启动，正在监听 http://localhost:${PORT}`);
    console.log('现在，请在浏览器中打开 http://localhost:3000 来开始游戏');
});