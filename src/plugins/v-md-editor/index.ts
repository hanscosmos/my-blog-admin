import VueMarkdownEditor from '@kangc/v-md-editor';
import VMdPreview from '@kangc/v-md-editor/lib/preview';
import '@kangc/v-md-editor/lib/style/base-editor.css';
import vuepressTheme from '@kangc/v-md-editor/lib/theme/vuepress.js';

import { App } from 'vue';
import Prism from 'prismjs';
import '@kangc/v-md-editor/lib/theme/style/vuepress.css';
import createEmojiPlugin from '@kangc/v-md-editor/lib/plugins/emoji/index';
import '@kangc/v-md-editor/lib/plugins/emoji/emoji.css';
import createTodoListPlugin from '@kangc/v-md-editor/lib/plugins/todo-list/index';
import '@kangc/v-md-editor/lib/plugins/todo-list/todo-list.css';
import createLineNumbertPlugin from '@kangc/v-md-editor/lib/plugins/line-number/index';
import createHighlightLinesPlugin from '@kangc/v-md-editor/lib/plugins/highlight-lines/index';
import createCopyCodePlugin from '@kangc/v-md-editor/lib/plugins/copy-code/index';
import '@kangc/v-md-editor/lib/plugins/copy-code/copy-code.css';

VMdPreview.use(vuepressTheme, { Prism })
  .use(createEmojiPlugin())
  .use(createTodoListPlugin())
  .use(createLineNumbertPlugin())
  .use(createHighlightLinesPlugin())
  .use(createCopyCodePlugin());
VueMarkdownEditor.use(vuepressTheme, { Prism })
  .use(createEmojiPlugin())
  .use(createTodoListPlugin())
  .use(createLineNumbertPlugin())
  .use(createHighlightLinesPlugin())
  .use(createCopyCodePlugin());

export default {
  install(app: App) {
    app.component('v-md-preview', VMdPreview);
    app.component('v-md-editor', VueMarkdownEditor);
  },
};
