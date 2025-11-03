import { FormEvent, useEffect, useMemo, useState } from 'react';
import { VideoItem } from '../app/AppContext';

interface VideoEditModalProps {
  video: VideoItem | null;
  onClose: () => void;
  onSave: (changes: Partial<VideoItem>) => void;
}

const CATEGORY_FIELDS: { key: keyof Partial<VideoItem>; label: string }[] = [
  { key: 'productType', label: '产品类型' },
];

const CATEGORY_OPTIONS: Record<string, string[]> = {
  产品类型: ['灌装机', '自动线', '码垛机'],
};

const MULTI_FIELDS = [
  { key: 'categories', label: '分类标签', options: ['30A', '30B/BG', '自动线', '码垛机', 'IBC'] },
];

export function VideoEditModal({ video, onClose, onSave }: VideoEditModalProps) {
  const [form, setForm] = useState<Partial<VideoItem>>({});

  useEffect(() => {
    if (video) {
      setForm({ ...video });
    }
  }, [video]);

  const multiSelections = useMemo(() => {
    const result: Record<string, string[]> = {};
    MULTI_FIELDS.forEach((field) => {
      const value = form[field.key] as string[] | undefined;
      result[field.key] = Array.isArray(value) ? value : [];
    });
    return result;
  }, [form]);

  if (!video) return null;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSave(form);
  }

  function updateField(key: keyof Partial<VideoItem>, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleMulti(key: keyof Partial<VideoItem>, option: string) {
    setForm((prev) => {
      const next = new Set<string>(Array.isArray(prev[key]) ? (prev[key] as string[]) : []);
      if (next.has(option)) {
        next.delete(option);
      } else {
        next.add(option);
      }
      return { ...prev, [key]: Array.from(next) };
    });
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>编辑分类：{video.title}</h2>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn secondary" type="button" onClick={onClose}>
              取消
            </button>
            <button className="btn" type="submit">
              保存
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {CATEGORY_FIELDS.map((field) => (
              <label key={field.key as string} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600 }}>{field.label}</span>
                <select
                  className="select"
                  value={(form[field.key] as string) ?? ''}
                  onChange={(event) => updateField(field.key, event.target.value)}
                >
                  <option value="">未选择</option>
                  {CATEGORY_OPTIONS[field.label].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          {MULTI_FIELDS.map((field) => (
            <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <span style={{ fontWeight: 600 }}>{field.label}</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                {field.options.map((option) => {
                  const active = multiSelections[field.key as string]?.includes(option);
                  return (
                    <button
                      key={option}
                      className={`btn ${active ? '' : 'secondary'}`}
                      style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                      onClick={() => toggleMulti(field.key, option)}
                      type="button"
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </form>
    </div>
  );
}
