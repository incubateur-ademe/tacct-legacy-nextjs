'use client';

import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

// Barre d'outils reprise du legacy page-info :
// font size bold list bullet italic underline strike align color background link image.
const MODULES = {
  toolbar: [
    [{ font: [] }, { size: [] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    [{ color: [] }, { background: [] }],
    ['link', 'image'],
  ],
};

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ReactQuill theme="snow" value={value} onChange={onChange} modules={MODULES} />
  );
}
