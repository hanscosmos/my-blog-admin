import { defineStore } from 'pinia'

interface ArticleEditorContext {
  id: string
  title: string
  content: string
}

/**
 * 当前编辑器（发布/编辑文章页）里的文章上下文
 * 供 AI 助手读取正文——因为正文来自前端文本框，可能尚未保存到数据库
 */
export const useArticleEditorStore = defineStore('articleEditor', () => {
  const id = ref('')
  const title = ref('')
  const content = ref('')

  function setContext(ctx: Partial<ArticleEditorContext>) {
    if (ctx.id !== undefined) id.value = ctx.id
    if (ctx.title !== undefined) title.value = ctx.title
    if (ctx.content !== undefined) content.value = ctx.content
  }

  function reset() {
    id.value = ''
    title.value = ''
    content.value = ''
  }

  return { id, title, content, setContext, reset }
})
