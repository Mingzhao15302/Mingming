import { useEffect, useRef } from 'react';
import Modal from '../common/Modal';

interface PlayerModalProps {
  open: boolean;
  onClose: () => void;
  src?: string;
}

export default function PlayerModal({ open, onClose, src }: PlayerModalProps) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!open) {
      ref.current?.pause();
    }
  }, [open]);

  return (
    <Modal open={open} title="视频预览" onClose={onClose}>
      <video ref={ref} src={src} controls className="w-full rounded-2xl" preload="metadata" />
    </Modal>
  );
}
