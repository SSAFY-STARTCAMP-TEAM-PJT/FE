<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { sendChatMessage } from '@/services/chat'

let messageSequence = 0

function createMessage(role, content) {
  messageSequence += 1

  return {
    id: `${Date.now()}-${messageSequence}`,
    role,
    content,
  }
}

const isOpen = ref(false)
const input = ref('')
const isSending = ref(false)
const errorMessage = ref('')
const lastFailedMessage = ref('')

const inputElement = ref(null)
const messageListElement = ref(null)

const messages = ref([
  createMessage('assistant', '안녕하세요. 여행지, 지역 정보, 게시글에 대해 질문해주세요.'),
])

async function scrollToBottom() {
  await nextTick()

  const element = messageListElement.value

  if (!element) {
    return
  }

  element.scrollTo({
    top: element.scrollHeight,
    behavior: 'smooth',
  })
}

async function openChat() {
  isOpen.value = true

  await nextTick()
  inputElement.value?.focus()
  await scrollToBottom()
}

function closeChat() {
  isOpen.value = false
}

async function requestAssistantMessage(message) {
  isSending.value = true
  errorMessage.value = ''

  try {
    const result = await sendChatMessage(message)

    messages.value.push(createMessage('assistant', result.reply))

    lastFailedMessage.value = ''
  } catch (error) {
    errorMessage.value = error.message ?? '메시지를 전송하지 못했습니다.'

    lastFailedMessage.value = message
  } finally {
    isSending.value = false
    await scrollToBottom()
  }
}

async function handleSend() {
  const message = input.value.trim()

  if (!message || isSending.value) {
    return
  }

  input.value = ''

  messages.value.push(createMessage('user', message))

  await scrollToBottom()
  await requestAssistantMessage(message)
}

async function retryLastMessage() {
  if (!lastFailedMessage.value || isSending.value) {
    return
  }

  await requestAssistantMessage(lastFailedMessage.value)
}

function handleEscape(event) {
  if (event.key === 'Escape' && isOpen.value) {
    closeChat()
  }
}

function updateBodyScroll(open) {
  const isMobile = window.matchMedia('(max-width: 767px)').matches

  document.body.classList.toggle('no-scroll', open && isMobile)
}

watch(isOpen, updateBodyScroll)

onMounted(() => {
  window.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleEscape)
  document.body.classList.remove('no-scroll')
})
</script>

<template>
  <Teleport to="body">
    <Transition name="backdrop-fade">
      <button
        v-if="isOpen"
        type="button"
        class="chat-backdrop"
        aria-label="챗봇 닫기"
        @click="closeChat"
      ></button>
    </Transition>

    <Transition name="chat-panel">
      <section
        v-if="isOpen"
        class="chat-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-title"
      >
        <header class="chat-header">
          <div>
            <h2 id="chat-title" class="chat-title">LocalHub AI</h2>
            <p class="chat-description">지역 여행 정보를 물어보세요.</p>
          </div>

          <button type="button" class="chat-close-button" aria-label="챗봇 닫기" @click="closeChat">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div ref="messageListElement" class="chat-messages" aria-live="polite">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message-row"
            :class="`message-row--${message.role}`"
          >
            <div class="message-bubble">
              {{ message.content }}
            </div>
          </div>

          <div v-if="isSending" class="message-row message-row--assistant">
            <div class="message-bubble typing-indicator" aria-label="답변을 생성하는 중입니다.">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>

        <div v-if="errorMessage" class="chat-error" role="alert">
          <span>{{ errorMessage }}</span>

          <button type="button" :disabled="isSending" @click="retryLastMessage">재시도</button>
        </div>

        <form class="chat-form" @submit.prevent="handleSend">
          <label for="chat-input" class="sr-only"> 챗봇 메시지 </label>

          <textarea
            id="chat-input"
            ref="inputElement"
            v-model="input"
            rows="1"
            class="chat-input"
            placeholder="여행지 정보를 질문해보세요."
            :disabled="isSending"
            @keydown.enter.exact.prevent="handleSend"
          ></textarea>

          <button
            type="submit"
            class="chat-send-button"
            :disabled="!input.trim() || isSending"
            aria-label="메시지 보내기"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m4 4 16 8-16 8 3-8-3-8Z" />
              <path d="M7 12h13" />
            </svg>
          </button>
        </form>
      </section>
    </Transition>

    <Transition name="chat-button">
      <button
        v-if="!isOpen"
        type="button"
        class="chat-floating-button"
        aria-label="LocalHub AI 챗봇 열기"
        @click="openChat"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v8Z" />
          <path d="M8 10h.01M12 10h.01M16 10h.01" />
        </svg>
      </button>
    </Transition>
  </Teleport>
</template>

<style scoped>
.chat-floating-button {
  position: fixed;
  right: var(--spacing-6);
  bottom: var(--spacing-6);
  z-index: var(--z-index-modal);
  display: grid;
  width: 58px;
  height: 58px;
  border: 0;
  border-radius: var(--radius-full);
  background-color: var(--color-primary);
  box-shadow: var(--shadow-lg);
  color: var(--color-text-inverse);
  cursor: pointer;
  place-items: center;
}

.chat-floating-button:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-2px);
}

.chat-floating-button:active {
  background-color: var(--color-primary-active);
  transform: translateY(0);
}

.chat-floating-button svg {
  width: 27px;
  height: 27px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.chat-window {
  position: fixed;
  right: var(--spacing-6);
  bottom: 94px;
  z-index: var(--z-index-modal);
  display: flex;
  width: min(390px, calc(100vw - 32px));
  height: min(600px, calc(100dvh - 120px));
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-lg);
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  padding: var(--spacing-4) var(--spacing-5);
  border-bottom: 1px solid var(--color-border-light);
}

.chat-title {
  margin: 0;
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.chat-description {
  margin: var(--spacing-1) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.chat-close-button {
  display: grid;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-secondary);
  cursor: pointer;
  place-items: center;
}

.chat-close-button:hover {
  background-color: var(--color-surface-muted);
  color: var(--color-text-primary);
}

.chat-close-button svg {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-width: 2;
}

.chat-messages {
  display: flex;
  flex: 1;
  padding: var(--spacing-4);
  overflow-y: auto;
  background-color: var(--color-background);
  flex-direction: column;
  gap: var(--spacing-3);
}

.message-row {
  display: flex;
}

.message-row--assistant {
  justify-content: flex-start;
}

.message-row--user {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 82%;
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font-size: var(--font-size-sm);
  line-height: 1.55;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.message-row--assistant .message-bubble {
  border: 1px solid var(--color-border-light);
  border-bottom-left-radius: var(--radius-sm);
  background-color: var(--color-surface);
}

.message-row--user .message-bubble {
  border-bottom-right-radius: var(--radius-sm);
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
}

.typing-indicator {
  display: flex;
  align-items: center;
  min-height: 42px;
  gap: 5px;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background-color: var(--color-text-muted);
  animation: typing-bounce 1.2s infinite ease-in-out;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 150ms;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 300ms;
}

.chat-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-2) var(--spacing-4);
  border-top: 1px solid rgb(220 90 90 / 16%);
  background-color: rgb(220 90 90 / 7%);
  color: var(--color-error);
  font-size: var(--font-size-xs);
  gap: var(--spacing-3);
}

.chat-error button {
  flex: 0 0 auto;
  padding: var(--spacing-1) var(--spacing-2);
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-weight: var(--font-weight-semibold);
  text-decoration: underline;
}

.chat-form {
  display: flex;
  align-items: flex-end;
  padding: var(--spacing-3);
  border-top: 1px solid var(--color-border-light);
  background-color: var(--color-surface);
  gap: var(--spacing-2);
}

.chat-input {
  min-height: 44px;
  max-height: 120px;
  padding: 11px var(--spacing-3);
  resize: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font: inherit;
  font-size: var(--font-size-sm);
  line-height: 1.45;
}

.chat-input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgb(47 125 91 / 12%);
}

.chat-send-button {
  display: grid;
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: var(--radius-md);
  background-color: var(--color-primary);
  color: var(--color-text-inverse);
  cursor: pointer;
  place-items: center;
}

.chat-send-button:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.chat-send-button svg {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.chat-backdrop {
  display: none;
}

.chat-panel-enter-active,
.chat-panel-leave-active,
.chat-button-enter-active,
.chat-button-leave-active,
.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition:
    opacity var(--transition-normal),
    transform var(--transition-normal);
}

.chat-panel-enter-from,
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.chat-button-enter-from,
.chat-button-leave-to {
  opacity: 0;
  transform: scale(0.85);
}

.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}

@keyframes typing-bounce {
  0%,
  60%,
  100% {
    transform: translateY(0);
  }

  30% {
    transform: translateY(-4px);
  }
}

@media (max-width: 767px) {
  .chat-backdrop {
    position: fixed;
    z-index: var(--z-index-overlay);
    display: block;
    padding: 0;
    border: 0;
    background-color: var(--color-overlay);
    cursor: default;
    inset: 0;
  }

  .chat-window {
    right: 0;
    bottom: 0;
    width: 100%;
    height: min(76dvh, 680px);
    border-right: 0;
    border-bottom: 0;
    border-left: 0;
    border-radius: var(--radius-xl) var(--radius-xl) 0 0;
  }

  .chat-floating-button {
    right: var(--spacing-4);
    bottom: var(--spacing-4);
    width: 54px;
    height: 54px;
  }

  .chat-header {
    min-height: 64px;
    padding: var(--spacing-3) var(--spacing-4);
  }

  .chat-messages {
    padding: var(--spacing-3);
  }

  .message-bubble {
    max-width: 88%;
  }

  .chat-panel-enter-from,
  .chat-panel-leave-to {
    opacity: 0;
    transform: translateY(100%);
  }
}
</style>
