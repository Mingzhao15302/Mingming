import React, { useMemo } from 'react';
import { useAppStore } from '../store/useStore';
import type { TextureSlot } from '../three/types';

const slotConfig: Record<
  TextureSlot,
  {
    label: string;
    description: string;
  }
> = {
  albedo: {
    label: '颜色贴图（Albedo）',
    description: '用于呈现火星表面的颜色信息，推荐放置 mars_albedo.jpg。'
  },
  normal: {
    label: '法线贴图（Normal）',
    description: '增强地形起伏的细节效果，可对应 mars_normal.jpg。'
  },
  roughness: {
    label: '粗糙度贴图（Roughness）',
    description: '控制表面高光分布，可对应 mars_roughness.jpg。'
  }
};

export const TexturePanel: React.FC = () => {
  const textures = useAppStore((state) => state.textures);
  const setTexture = useAppStore((state) => state.setTexture);
  const clearTexture = useAppStore((state) => state.clearTexture);
  const queueToast = useAppStore((state) => state.queueToast);

  const inputRefs = useMemo(
    () =>
      ({
        albedo: React.createRef<HTMLInputElement>(),
        normal: React.createRef<HTMLInputElement>(),
        roughness: React.createRef<HTMLInputElement>()
      }) as Record<TextureSlot, React.RefObject<HTMLInputElement>>,
    []
  );

  const handlePick = (slot: TextureSlot) => {
    inputRefs[slot].current?.click();
  };

  const handleFileChange = async (slot: TextureSlot, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      await setTexture(slot, file);
      queueToast(`已加载${slotConfig[slot].label}`, 'success');
    } catch (error) {
      console.error(error);
      queueToast('加载贴图失败，请重试', 'error');
    }
  };

  const handleClear = async (slot: TextureSlot) => {
    try {
      await clearTexture(slot);
      queueToast(`已移除${slotConfig[slot].label}`);
    } catch (error) {
      console.error(error);
      queueToast('移除贴图失败，请重试', 'error');
    }
  };

  return (
    <section className="space-y-4">
      <header>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          火星贴图管理
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          通过下方按钮即可上传/替换贴图文件，实现无代码配置。
        </p>
      </header>
      <div className="space-y-4">
        {(Object.keys(slotConfig) as TextureSlot[]).map((slot) => {
          const texture = textures[slot];
          return (
            <div key={slot} className="rounded border border-slate-700 bg-slate-800/80 p-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">{slotConfig[slot].label}</div>
                  <p className="text-slate-400">{slotConfig[slot].description}</p>
                  {texture ? (
                    <p className="mt-2 text-[11px] text-slate-300">
                      当前文件：{texture.fileName}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] text-slate-500">尚未加载文件</p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    className="rounded bg-sky-500 px-3 py-1 text-white"
                    onClick={() => handlePick(slot)}
                  >
                    {texture ? '替换文件' : '上传文件'}
                  </button>
                  <button
                    className="rounded border border-slate-600 px-3 py-1 text-slate-300 disabled:opacity-40"
                    disabled={!texture}
                    onClick={() => handleClear(slot)}
                  >
                    清除
                  </button>
                </div>
              </div>
              <input
                ref={inputRefs[slot]}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleFileChange(slot, event)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
