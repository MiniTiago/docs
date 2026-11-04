// API comments contain literal placeholders such as <symbol>. Preserve ordinary
// formatting HTML, but do not let those placeholders become Vue components.
const formatting = new Set('a br b code del details div em i kbd li ol p pre s small span strong sub summary sup table tbody td th thead tr ul'.split(' '));
export function sourceCommentMarkup(md) {
  for (const kind of ['html_inline', 'html_block']) {
    const original = md.renderer.rules[kind];
    md.renderer.rules[kind] = (tokens, index, options, env, renderer) => {
      if (!env.relativePath?.startsWith('api/')) return original(tokens, index, options, env, renderer);
      return tokens[index].content.replace(/<\/?([A-Za-z][\w:-]*)(?:\s[^>]*|\/?)>/g,
        (tag, name) => formatting.has(name.toLowerCase()) ? tag : md.utils.escapeHtml(tag));
    };
  }
}
