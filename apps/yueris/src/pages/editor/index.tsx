import { useEffect, useMemo, useRef, useState } from 'react';
import { App, Button, ConfigProvider, Divider, Input, Layout, Select, Space, theme, Typography } from 'antd';
import 'antd/dist/reset.css';

type NodeText = { id: string; type: 'text'; props: { text: string; color: string; fontSize: number; align: 'left'|'center'|'right' } };
type NodeButton = { id: string; type: 'button'; props: { text: string; theme: 'default'|'primary'|'danger' } };
type NodeBox = { id: string; type: 'box'; props: { padding: number; background: string } };
type NodeAny = NodeText | NodeButton | NodeBox;
type Schema = { version: number; nodes: NodeAny[] };

const defaultSchema: Schema = {
  version: 1,
  nodes: [
    { id: 'title1', type: 'text', props: { text: '欢迎使用 Yueris', color: '#1f2328', fontSize: 24, align: 'center' } },
    { id: 'btn1', type: 'button', props: { text: '开始构建', theme: 'primary' } }
  ]
};

function useSchema(initial: Schema) {
  const [schema, setSchema] = useState<Schema>(() => structuredClone(initial));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const updateNode = (id: string, updater: (n: NodeAny) => void) => {
    setSchema(prev => {
      const next = structuredClone(prev);
      const target = next.nodes.find(n => n.id === id);
      if (target) updater(target);
      return next;
    });
  };
  const addNode = (node: NodeAny) => setSchema(prev => ({ ...prev, nodes: [...prev.nodes, node] }));
  const reset = () => { setSchema(structuredClone(initial)); setSelectedId(null); };
  return { schema, setSchema, selectedId, setSelectedId, updateNode, addNode, reset };
}

function EditorApp() {
  const { schema, selectedId, setSelectedId, updateNode, addNode, reset } = useSchema(defaultSchema);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Post schema to preview
  const postSchema = (s: Schema) => iframeRef.current?.contentWindow?.postMessage({ type: 'schema', payload: s }, '*');
  useEffect(() => { postSchema(schema); }, [schema]);

  // Receive selection & drop from preview
  useEffect(() => {
    const onMsg = (event: MessageEvent) => {
      const { type, payload } = (event.data || {}) as any;
      if (type === 'select') setSelectedId(payload?.id ?? null);
      if (type === 'drop') {
        const n = createNode(payload?.component?.type || 'text');
        addNode(n);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const selected = useMemo(() => schema.nodes.find(n => n.id === selectedId) || null, [schema, selectedId]);

  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <App>
        <Layout style={{ height: '100vh' }}>
          <Layout.Header style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', background: '#fff' }}>
            <Typography.Title level={4} style={{ margin: 0 }}>Yueris 月璃</Typography.Title>
            <Space style={{ marginLeft: 'auto' }}>
              <Button onClick={() => downloadSchema(schema)}>导出 Schema</Button>
              <Button onClick={reset}>重置</Button>
            </Space>
          </Layout.Header>
          <Layout>
            <Layout.Sider width={260} style={{ background: '#fff', borderRight: '1px solid #eee' }}>
              <ComponentList />
            </Layout.Sider>
            <Layout.Content style={{ background: '#f6f7f9' }}>
              <div style={{ height: '100%', display: 'grid', padding: 16 }}>
                <iframe
                  ref={iframeRef}
                  title="preview"
                  src={`${process.site.CANVAS}/preview.html`}
                  onLoad={() => iframeRef.current?.contentWindow?.postMessage({ type: 'schema', payload: schema }, '*')}
                  style={{ width: '100%', height: '100%', border: 0, borderRadius: 8, background: '#fff', boxShadow: '0 6px 24px rgba(0,0,0,0.06)' }}
                />
              </div>
            </Layout.Content>
            <Layout.Sider width={320} style={{ background: '#fff', borderLeft: '1px solid #eee' }}>
              <PropertyPanel node={selected} onChange={(id, key, v) => updateNode(id, (n) => { (n as any).props[key] = v; })} />
            </Layout.Sider>
          </Layout>
        </Layout>
      </App>
    </ConfigProvider>
  );
}

function ComponentList() {
  const items = [
    { type: 'text', label: '文本' },
    { type: 'button', label: '按钮' },
    { type: 'box', label: '容器' }
  ];
  return (
    <div style={{ padding: 12 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>组件库</Typography.Text>
      <Divider style={{ margin: '8px 0 12px' }} />
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {items.map(item => (
          <div
            key={item.type}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('application/x-yueris-component', JSON.stringify({ type: item.type }))}
            style={{ padding: 10, borderRadius: 8, border: '1px dashed #d0d7de', background: '#fff', cursor: 'grab' }}
          >
            {item.label}
          </div>
        ))}
      </Space>
    </div>
  );
}

function PropertyPanel({ node, onChange }: { node: NodeAny | null; onChange: (id: string, key: string, v: any) => void }) {
  if (!node) return <div style={{ padding: 12 }}><Typography.Text type="secondary">未选择组件</Typography.Text></div>;
  return (
    <div style={{ padding: 12 }}>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>属性</Typography.Text>
      <Divider style={{ margin: '8px 0 12px' }} />
      {node.type === 'text' && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <LabeledInput label="文本" value={node.props.text} onChange={(v) => onChange(node.id, 'text', v)} />
          <LabeledInput label="颜色" value={node.props.color} onChange={(v) => onChange(node.id, 'color', v)} />
          <LabeledInput label="字号" value={String(node.props.fontSize)} onChange={(v) => onChange(node.id, 'fontSize', Number(v))} />
          <LabeledSelect label="对齐" value={node.props.align} options={[{value:'left',label:'left'},{value:'center',label:'center'},{value:'right',label:'right'}]} onChange={(v) => onChange(node.id, 'align', v as any)} />
        </Space>
      )}
      {node.type === 'button' && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <LabeledInput label="文本" value={node.props.text} onChange={(v) => onChange(node.id, 'text', v)} />
          <LabeledSelect label="主题" value={node.props.theme} options={[{value:'default',label:'default'},{value:'primary',label:'primary'},{value:'danger',label:'danger'}]} onChange={(v) => onChange(node.id, 'theme', v as any)} />
        </Space>
      )}
    </div>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', alignItems: 'center', gap: 8 }}>
      <Typography.Text>{label}</Typography.Text>
      <Input value={value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} />
    </div>
  );
}

function LabeledSelect({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr', alignItems: 'center', gap: 8 }}>
      <Typography.Text>{label}</Typography.Text>
      <Select value={value} options={options} onChange={onChange} />
    </div>
  );
}

function createNode(type: string): NodeAny {
  const id = `${type}_${Math.random().toString(36).slice(2,8)}`;
  if (type === 'text') return { id, type: 'text', props: { text: '新文本', color: '#24292f', fontSize: 16, align: 'left' } };
  if (type === 'button') return { id, type: 'button', props: { text: '按钮', theme: 'default' } } as NodeButton;
  if (type === 'box') return { id, type: 'box', props: { padding: 12, background: '#fff' } } as NodeBox;
  return { id, type: 'text', props: { text: '未知组件', color: '#999', fontSize: 14, align: 'left' } } as NodeText;
}

function downloadSchema(schema: Schema) {
  const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'schema.json'; a.click(); URL.revokeObjectURL(url);
}

export { EditorApp }


