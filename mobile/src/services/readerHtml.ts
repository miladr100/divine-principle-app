import { BookNode, Paragraph } from '../types/book';
import { ReadingDepth } from '../state/useSettingsStore';
import { nodeEyebrow } from '../data/bookCatalog';
import { visibleSegments } from './editorialText';

export function buildReaderHtml(options: {
  section: BookNode;
  fontSize: number;
  showEditorialColors: boolean;
  readingDepth: ReadingDepth;
  darkMode: boolean;
}) {
  const { section, fontSize, showEditorialColors, readingDepth, darkMode } = options;

  const bg = darkMode ? '#031f2b' : '#fbf7ee';
  const fg = darkMode ? '#eaf8ff' : '#18232a';
  const link = darkMode ? '#00c8ee' : '#007f9a';
  const muted = darkMode ? '#7fa6b5' : '#6f777b';
  const colorMap: Record<string, string> = {
    red: '#ff6b6b',
    blue: '#48b7ff',
    yellow: '#e5c84a',
    white: fg
  };

  const htmlParagraphs = section.paragraphs.map((paragraph) => {
    const segments = visibleSegments(paragraph, readingDepth);
    if (!segments.length) return '';
    const linked = new Set<string>();
    const body = segments.map((segment) => {
      const displayColor = showEditorialColors ? colorMap[segment.editorialColor] : fg;
      let html = footnoteHtml(segment.text, notesByNumber(paragraph));
      for (const ref of paragraph.bibleRefs ?? []) {
        const token = escapeHtml(ref.label);
        if (!token || !html.includes(token)) continue;
        linked.add(ref.id);
        const clickable = `<a href="#" class="bible-ref" data-ref-id="${escapeHtml(ref.id)}" data-label="${escapeHtml(ref.label)}" data-text="${escapeHtml(ref.text)}">${token}</a>`;
        html = replaceTextOutsideTags(html, token, clickable);
      }
      return `<span style="color:${displayColor}">${html}</span>`;
    }).join('');

    const missing = (paragraph.bibleRefs ?? [])
      .filter((ref) => !linked.has(ref.id) && !paragraph.text.includes(ref.label))
      .map((ref) => ` <a href="#" class="bible-ref" data-ref-id="${escapeHtml(ref.id)}" data-label="${escapeHtml(ref.label)}" data-text="${escapeHtml(ref.text)}">${escapeHtml(ref.label)}</a>`)
      .join('');

    const tag = paragraph.role === 'heading' ? 'h2' : 'p';
    return `<${tag} id="${paragraph.id}" data-paragraph-id="${paragraph.id}">${body}${missing}</${tag}>`;
  }).filter(Boolean).join('\n');

  const eyebrow = nodeEyebrow(section);

  return `<!DOCTYPE html>
  <html lang="pt-BR"><head><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    *{box-sizing:border-box} body{margin:0;padding:24px 20px 210px;background:${bg};color:${fg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
    .eyebrow{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#00c8ee;margin-bottom:10px;font-weight:700}
    h1{font-size:${fontSize + 9}px;line-height:1.15;margin:0 0 28px;color:${fg}}
    p{font-size:${fontSize}px;line-height:1.75;margin:0 0 22px;border-radius:8px;padding:4px 0;text-align:justify;text-align-last:start;hyphens:none;-webkit-hyphens:none;word-break:normal;overflow-wrap:normal;transition:background .2s}
    h2{font-size:${fontSize + 3}px;line-height:1.35;font-weight:700;margin:28px 0 12px;text-align:left;color:${fg}}
    p.speaking,h2.speaking{background:rgba(0,200,238,.13)}
    .fn-word{white-space:nowrap}
    a.fn-link{color:inherit;text-decoration:none}
    .fn-hit{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:.18em;text-decoration-color:${link}}
    sup.fn{font-size:.62em;line-height:0;position:relative;top:-.62em;font-weight:650;margin-left:.04em;vertical-align:baseline}
    .bible-ref{color:#00c8ee;text-decoration:underline;font-weight:600}
    mark.find-hit{background:#ffe08a;color:inherit;border-radius:2px}
    mark.find-active{background:#ff9f1a;color:#10212a}
    .hint{color:${muted};font-size:12px;margin-bottom:18px}
    ::selection{background:#ff72b6;color:#10212a}
  </style></head>
  <body>
    <div class="eyebrow">${escapeHtml(eyebrow)}</div>
    <h1>${escapeHtml(section.title)}</h1>
    <div class="hint">Toque em um parágrafo para ouvir a partir dele. Selecione um trecho para estudar.</div>
    ${htmlParagraphs || '<p>Não há texto neste nível de leitura.</p>'}
    <script>
      const send = (payload) => window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      document.querySelectorAll('[data-paragraph-id]').forEach((p) => {
        p.addEventListener('click', (e) => {
          if (e.target.closest && e.target.closest('.fn-link, .bible-ref')) return;
          const selection = window.getSelection();
          if (selection && selection.toString().trim().length > 0) return;
          send({ type:'paragraphTap', paragraphId:p.dataset.paragraphId });
        });
      });
      document.querySelectorAll('.fn-link').forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          send({ type:'footnote', number:a.dataset.fnNumber, text:a.dataset.fnText });
        });
      });
      document.querySelectorAll('.bible-ref').forEach((a) => {
        a.addEventListener('click', (e) => {
          e.preventDefault(); e.stopPropagation();
          send({ type:'bibleRef', refId:a.dataset.refId, label:a.dataset.label, text:a.dataset.text });
        });
      });
      function emitSelection(){
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return;
        const text = sel.toString().trim();
        if (!text) return;
        const range = sel.getRangeAt(0);
        let node = range.commonAncestorContainer;
        if (node.nodeType === 3) node = node.parentElement;
        const p = node.closest ? node.closest('[data-paragraph-id]') : null;
        if (!p) return;
        send({ type:'selection', paragraphId:p.dataset.paragraphId, text, startOffset:range.startOffset, endOffset:range.endOffset });
      }
      document.addEventListener('mouseup', () => setTimeout(emitSelection, 40));
      document.addEventListener('touchend', () => setTimeout(emitSelection, 160));
      let lastScrollY = 0;
      let lastScrollMode = '';
      window.addEventListener('scroll', () => {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        const delta = y - lastScrollY;
        lastScrollY = y;
        if (Math.abs(delta) < 8) return;
        const mode = y < 28 ? 'top' : delta > 0 ? 'down' : 'up';
        if (mode === lastScrollMode) return;
        lastScrollMode = mode;
        send({ type:'scroll', y, direction: mode === 'down' ? 'down' : 'up' });
      }, { passive: true });
      const fold = (value) => value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase();
      const foldedIndex = (text, target) => {
        const chars = Array.from(text);
        let folded = 0;
        let raw = 0;
        for (const ch of chars) {
          if (folded >= target) return raw;
          raw += ch.length;
          folded += fold(ch).length;
        }
        return raw;
      };
      window.__clearFind = () => {
        document.querySelectorAll('mark.find-hit').forEach((mark) => {
          const parent = mark.parentNode;
          if (!parent) return;
          parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
          parent.normalize();
        });
      };
      window.__find = (query, activeIndex) => {
        window.__clearFind();
        const term = fold(String(query || '').trim());
        if (term.length < 2) {
          send({ type:'find', count:0, index:0 });
          return;
        }
        const roots = document.querySelectorAll('[data-paragraph-id], h1');
        const textNodes = [];
        roots.forEach((root) => {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
          let current;
          while ((current = walker.nextNode())) textNodes.push(current);
        });
        let count = 0;
        textNodes.forEach((textNode) => {
          const raw = textNode.nodeValue || '';
          const folded = fold(raw);
          const ranges = [];
          let from = 0;
          while (from <= folded.length) {
            const at = folded.indexOf(term, from);
            if (at < 0) break;
            ranges.push([foldedIndex(raw, at), foldedIndex(raw, at + term.length)]);
            from = at + term.length;
          }
          if (!ranges.length || !textNode.parentNode) return;
          const frag = document.createDocumentFragment();
          let cursor = 0;
          ranges.forEach(([start, end]) => {
            if (start > cursor) frag.appendChild(document.createTextNode(raw.slice(cursor, start)));
            const mark = document.createElement('mark');
            mark.className = 'find-hit';
            mark.dataset.findIndex = String(count);
            mark.textContent = raw.slice(start, end);
            frag.appendChild(mark);
            count += 1;
            cursor = end;
          });
          if (cursor < raw.length) frag.appendChild(document.createTextNode(raw.slice(cursor)));
          textNode.parentNode.replaceChild(frag, textNode);
        });
        const index = count ? Math.min(Math.max(activeIndex, 0), count - 1) : 0;
        const active = document.querySelector('mark.find-hit[data-find-index="' + index + '"]');
        if (active) {
          active.classList.add('find-active');
          active.scrollIntoView({ behavior:'smooth', block:'center' });
        }
        send({ type:'find', count, index });
      };
      let autoScrollFrame = 0;
      let autoScrollPx = 32;
      window.__setAutoScroll = (enabled, px) => {
        autoScrollPx = Number(px) || 32;
        if (!enabled) {
          if (autoScrollFrame) cancelAnimationFrame(autoScrollFrame);
          autoScrollFrame = 0;
          return;
        }
        if (autoScrollFrame) return;
        let last = performance.now();
        let ended = false;
        const tick = (now) => {
          const dt = Math.min(50, now - last);
          last = now;
          const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
          const y = window.scrollY || document.documentElement.scrollTop || 0;
          if (y >= max - 1) {
            autoScrollFrame = 0;
            if (!ended) {
              ended = true;
              send({ type:'autoScrollEnd' });
            }
            return;
          }
          window.scrollTo(0, Math.min(max, y + (autoScrollPx * dt) / 1000));
          autoScrollFrame = requestAnimationFrame(tick);
        };
        autoScrollFrame = requestAnimationFrame(tick);
      };
      document.addEventListener('touchstart', () => {
        if (!autoScrollFrame) return;
        window.__setAutoScroll(false, autoScrollPx);
        send({ type:'autoScrollPaused' });
      }, { passive: true });
      window.__setSpeaking = (paragraphId) => {
        document.querySelectorAll('.speaking').forEach((p) => p.classList.remove('speaking'));
        const el = document.getElementById(paragraphId);
        if (el) { el.classList.add('speaking'); el.scrollIntoView({behavior:'smooth', block:'center'}); }
      };
    </script>
  </body></html>`;
}

function notesByNumber(paragraph: Paragraph) {
  const notes = new Map<number, string>();
  for (const note of paragraph.footnotes ?? []) {
    const current = notes.get(note.number);
    notes.set(note.number, current && current !== note.text ? `${current} ${note.text}` : note.text);
  }
  return notes;
}

function replaceTextOutsideTags(html: string, token: string, replacement: string) {
  return html.split(/(<[^>]*>)/g).map((part) => (part.startsWith('<') ? part : part.split(token).join(replacement))).join('');
}

const SUPERSCRIPTS = '⁰¹²³⁴⁵⁶⁷⁸⁹';

function footnoteHtml(value: string, notes: Map<number, string>) {
  const pattern = /([\p{L}\p{M}'’-]{1,})(["”»')\]]*)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/gu;
  let html = '';
  let last = 0;
  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    html += escapeHtml(value.slice(last, index));
    const digits = [...match[3]].map((glyph) => {
      const digit = SUPERSCRIPTS.indexOf(glyph);
      return digit >= 0 ? String(digit) : glyph;
    }).join('');
    const letters = escapeHtml(match[1]);
    const marks = escapeHtml(match[2] ?? '');
    const note = notes.get(Number(digits));
    html += note
      ? `<a href="#" class="fn-link" data-fn-number="${digits}" data-fn-text="${escapeHtml(note)}"><span class="fn-word"><span class="fn-hit">${letters}</span>${marks}<sup class="fn">${digits}</sup></span></a>`
      : `<span class="fn-word">${letters}${marks}<sup class="fn">${digits}</sup></span>`;
    last = index + match[0].length;
  }
  html += escapeHtml(value.slice(last));
  return html;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c] as string));
}
