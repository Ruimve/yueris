import { useEffect, useMemo, useRef, useState } from 'react';

type NodeText = { id: string; type: 'text'; props: { text: string; color: string; fontSize: number; align: 'left'|'center'|'right' } };
type NodeButton = { id: string; type: 'button'; props: { text: string; theme: 'default'|'primary'|'danger' } };
type NodeBox = { id: string; type: 'box'; props: { padding: number; background: string } };
type NodeAny = NodeText | NodeButton | NodeBox;
type Schema = { version: number; nodes: NodeAny[] };

function CanvasApp() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const [schema, setSchema] = useState<Schema>({ version: 1, nodes: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const host = document.createElement('div');
    hostRef.current?.appendChild(host);
    const shadow = host.attachShadow({ mode: 'open' });
    shadowRootRef.current = shadow;
    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      *, *::before, *::after { box-sizing: border-box; }
      .page { min-height: 100vh; background: #fff; padding: 24px; display: grid; gap: 12px; }
      .text { display: block; }
      .text.left { text-align: left; }
      .text.center { text-align: center; }
      .text.right { text-align: right; }
      .button { display: inline-flex; align-items: center; justify-content: center; height: 36px; padding: 0 14px; border-radius: 8px; border: 1px solid #d0d7de; background: #fff; cursor: pointer; color: #1f2328; }
      .button.primary { background: #1677ff; color: #fff; border-color: #1677ff; }
      .button.danger { background: #ff4d4f; color: #fff; border-color: #ff4d4f; }
      .box { padding: 12px; border: 1px dashed #d0d7de; border-radius: 8px; background: var(--box-bg, #fff); }
      .item { outline: 2px solid transparent; border-radius: 6px; padding: 2px; }
      .item.selected { outline: 2px solid #1677ff; }
      .dropzone { min-height: 220px; border: 2px dashed #d0d7de; border-radius: 8px; display: grid; place-items: center; color: #8c959f; }
    `;
    shadow.appendChild(style);
    const page = document.createElement('div');
    page.className = 'page';
    shadow.appendChild(page);

    const dropzone = document.createElement('div');
    dropzone.className = 'dropzone';
    dropzone.textContent = '将左侧组件拖入此处';
    page.appendChild(dropzone);

    const render = () => {
      const nodes = Array.from(page.children).filter(c => c !== dropzone);
      nodes.forEach(n => page.removeChild(n));
      for (const node of schema.nodes) {
        const el = renderNode(node);
        el.classList.add('item');
        if (node.id === selectedId) el.classList.add('selected');
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedId(node.id);
          window.parent.postMessage({ type: 'select', payload: { id: node.id } }, '*');
          render();
        });
        page.insertBefore(el, dropzone);
      }
    };

    const onMsg = (event: MessageEvent) => {
      const { type, payload } = (event.data || {}) as any;
      if (type === 'schema') { setSchema(payload); }
    };
    window.addEventListener('message', onMsg);

    // DnD
    dropzone.addEventListener('dragover', e => e.preventDefault());
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      try {
        const data = e.dataTransfer?.getData('application/x-yueris-component');
        const component = data ? JSON.parse(data) : null;
        window.parent.postMessage({ type: 'drop', payload: { component } }, '*');
      } catch {}
    });

    page.addEventListener('click', () => {
      setSelectedId(null);
      window.parent.postMessage({ type: 'select', payload: { id: null } }, '*');
      render();
    });

    const obs = new MutationObserver(render);
    obs.observe(page, { childList: true, subtree: true, attributes: true });

    const stop = () => {
      window.removeEventListener('message', onMsg);
      obs.disconnect();
    };

    return stop;
  }, []);

  // trigger render on schema changes
  useEffect(() => {
    const root = shadowRootRef.current; if (!root) return;
    const page = root.querySelector('.page'); if (!page) return;
    const dropzone = root.querySelector('.dropzone'); if (!dropzone) return;
    const nodes = Array.from(page.children).filter(c => c !== dropzone);
    nodes.forEach(n => page.removeChild(n));
    for (const node of schema.nodes) {
      const el = renderNode(node);
      el.classList.add('item');
      if (node.id === selectedId) el.classList.add('selected');
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedId(node.id);
        window.parent.postMessage({ type: 'select', payload: { id: node.id } }, '*');
      });
      page.insertBefore(el, dropzone);
    }
  }, [schema, selectedId]);

  return <div id="host" ref={hostRef} />;
}

function renderNode(node: NodeAny): HTMLElement {
  if (node.type === 'text') {
    const span = document.createElement('span');
    span.className = `text ${node.props.align ?? 'left'}`;
    span.textContent = node.props.text ?? '';
    span.style.color = node.props.color ?? '#1f2328';
    span.style.fontSize = `${node.props.fontSize ?? 16}px`;
    return span;
  }
  if (node.type === 'button') {
    const btn = document.createElement('button');
    btn.className = `button ${node.props.theme ?? 'default'}`;
    btn.textContent = node.props.text ?? '按钮';
    return btn;
  }
  if (node.type === 'box') {
    const div = document.createElement('div');
    div.className = 'box';
    div.style.setProperty('--box-bg', node.props.background ?? '#fff');
    div.style.padding = `${node.props.padding ?? 12}px`;
    div.textContent = '容器（示例）';
    return div;
  }
  const unk = document.createElement('div');
  unk.textContent = `未知组件: ${node}`;
  return unk;
}

export { CanvasApp }
