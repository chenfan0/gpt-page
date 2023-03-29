<template>
  <div class="app" :class="openAiKey === null && 'center'">
    <el-card class="card">
      <div class="get-key" v-if="openAiKey === null">
        <el-input
          class="get-key-input"
          placeholder="请输入你的openai key"
          v-model="inputVal"
        />
        <el-button
          class="get-key-btn"
          type="primary"
          @click="handleGetKeyBtnClick"
        >
          确认
        </el-button>
      </div>
      <div class="dialog" v-else>
        <div class="assistant">
          <img class="assistant-icon" src="./assets/ChatGPT.svg" />
          <h1 class="title">您可以开始输入问题提问了</h1>
        </div>
        <template v-for="item in messageRecord" :key="item.content">
          <div :class="item.role">
            <img
              v-if="item.role === 'assistant'"
              class="assistant-icon"
              src="./assets/ChatGPT.svg"
            />
            <img v-else class="user-icon" src="./assets/user-128.png" alt="" />
            <Markdown
              class="assistant-content"
              v-if="item.role === 'assistant'"
              :source="item.content"
            />
            <div class="user-content" v-else>{{ item.content }}</div>
          </div>
        </template>
      </div>
    </el-card>
    <template v-if="openAiKey !== null">
      <el-input
        v-model="requestContent"
        class="request-input"
        placeholder="请输入问题"
        resize="none"
        @keydown="handleKeyDown"
      />
      <el-button
        size="large"
        class="emit-btn"
        type="primary"
        @click="handleClick"
      >
        提问
      </el-button>
    </template>
  </div>
</template>
<script setup lang="ts">
import axios from "axios";
import Markdown from "vue3-markdown-it";
import storage from "./storage";

type Message = { role: "assistant" | "user" | "system"; content: string };

const OPEN_AI_KEY = "OPEN_AI_KEY";
const RECORD_KEY = 'RECORD_KEY'

const openAiKey = ref<string | null>(storage.get(OPEN_AI_KEY));

const requestContent = ref("");
const inputVal = ref("");
const alreadyObserve = ref(false);

const messageRecord = ref<Message[]>(storage.get(RECORD_KEY, 'sessionStorage') || []);

const observe = () => {
  const dialogEl = document.querySelector(".dialog") as HTMLDivElement;
  if (!dialogEl) return;
  var observer = new MutationObserver(function (mutations) {
    // 只处理子节点添加事件
    mutations.forEach(function (mutation) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // 将div自动滚动到底部
        dialogEl.scrollTop = dialogEl.scrollHeight;
      }
    });
  });

  // 配置 MutationObserver 监听选项
  var config = {
    childList: true,
    subtree: true,
  };

  // 将 observer 与元素连接起来，并开始监视
  observer.observe(dialogEl, config);
};

onUpdated(() => {
  if (alreadyObserve.value) return;
  observe();
});

const handleGetKeyBtnClick = () => {
  if (inputVal.value === "") return;
  openAiKey.value = inputVal.value;
  storage.set(OPEN_AI_KEY, inputVal.value);
};

const handleKeyDown = (e: any) => {
  if (e.keyCode === 13 && requestContent.value !== "") {
    handleClick();
  }
};

const request = (messages: Message[]) =>
  axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages,
    },
    {
      headers: {
        Authorization: `Bearer ${openAiKey.value}`,
        "Content-Type": "application/json",
      },
    }
  );

const resetInput = () => {
  requestContent.value = "";
};

const recordPush = (val: Message) => {
  messageRecord.value.push(val);
};
const userRecordPush = () => {
  const msg: Message = { role: "user", content: requestContent.value };
  recordPush(msg);
};

const handleClick = async () => {
  if (requestContent.value === "") return;
  userRecordPush();

  const loading = ElLoading.service({
    lock: true,
    text: "加载中",
    background: "rgba(0, 0, 0, 0.7)",
  });
  try {
    const { data } = await request(messageRecord.value);
    const ans = data?.choices[0].message as Message;
    recordPush(ans);
  } catch (e: any) {
    ElMessage.error({
      message: e,
      type: "error",
    });
  } finally {
    storage.set(RECORD_KEY, messageRecord.value, 'sessionStorage')
    loading.close();
    resetInput();
  }
};
</script>
<style scoped lang="less">
.center {
  display: flex;
  justify-content: center;
  align-items: center;
}
.app {
  box-sizing: border-box;
  width: 100vw;
  height: 100vh;
  padding: 5% 20%;
  font-size: 16px;
  background: url("./assets/ChatGPT.svg") no-repeat 50% 50%;

  .get-key {
    width: 400px;
    height: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;

    .get-key-input {
      margin-bottom: 15px;
    }

    .get-key-btn {
      width: 60px;
    }
  }

  .card {
    border-radius: 15px;
    background-color: rgba(255, 255, 255, 0.6);
    .dialog {
      max-height: 550px;
      box-sizing: border-box;
      overflow: auto;
      border-radius: 10px;
      &::-webkit-scrollbar {
        display: none;
      }

      .title {
        font-size: 20px;
      }

      .user-icon {
        width: 30px;
        height: 30px;
        margin-right: 10px;
      }

      .assistant-icon {
        width: 30px;
        height: 30px;
        margin: 10px 10px 0 5px;
      }

      .user {
        display: flex;
        padding: 20px 4px;
        border: 1px solid #e4e5e4;
        border-radius: 10px;
        position: relative;
        padding-right: 30px;
        .user-content {
          line-height: 30px;
        }
      }

      .assistant {
        display: flex;
        background-color: #f7f7f8;
        border: 1px solid #e4e5e4;
        border-radius: 10px;
        padding-right: 30px;
      }

      .assistant-content {
        overflow-x: auto;
      }
    }
  }

  .request-input {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 100px;
    width: 768px;
    height: 50px;
  }

  .emit-btn {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: 50px;
  }
}
</style>
