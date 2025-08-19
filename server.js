// server.js

// 引入所需模块
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

// 初始化Express应用
const app = express();
app.use(express.json()); // 解析JSON请求体
app.use(express.static(__dirname)); // 托管前端静态文件 (如 index.html)

// --- 配置与AI初始化 ---

// 1. 从环境变量中安全地读取API密钥
const API_KEY = process.env.GOOGLE_AI_API_KEY;

// 如果在服务器环境中找不到API密钥，打印错误并退出，防止应用崩溃
if (!API_KEY) {
    console.error("错误：找不到 GOOGLE_AI_API_KEY 环境变量。请确保您已在部署平台（如Render）上正确设置了它。");
    process.exit(1); // 退出程序
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

// --- 语言规则生成器 ---
// 在服务器启动时为本次会话生成一套独一无二的规则
function generateLanguageRules() {
    const rules = [
        { noun_class: "[人造物 an-o] vs [自然物 an-a]", verb_class: "[意图 ro-] vs [意外 ta-]" },
        { noun_class: "[有生命的 il-] vs [无生命的 um-]", verb_class: "[完成 a-] vs [未完成 o-]" },
        { noun_class: "[坚硬的 -ik] vs [流动的 -ul]", verb_class: "[创造 e-] vs [毁灭 o-]" }
    ];
    return rules[Math.floor(Math.random() * rules.length)];
}

const GAME_RULES = generateLanguageRules();
console.log("游戏会话已启动，本次隐藏规则已生成:", GAME_RULES);

// --- API 路由 ---

// 处理来自前端的聊天请求
app.post('/chat', async (req, res) => {
    const { history } = req.body;

    // 这是我们给AI设定的“角色”和“规则”
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
        console.error("调用Google AI时出错:", error);
        res.status(500).json({ message: "AI核心连接错误..." });
    }
});

// 处理根路径请求，发送前端页面
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 启动服务器 ---

// 2. 使用服务器分配的端口，如果未分配（例如在本地开发时），则使用3000
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`服务器已启动，正在监听端口 ${PORT}`);
});