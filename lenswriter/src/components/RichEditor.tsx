"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

interface RichEditorProps {
  content: string;
  onUpdate: (html: string) => void;
  placeholder?: string;
}

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (active: boolean) =>
    `px-2 py-1 text-sm rounded transition-colors ${
      active
        ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;

  const sep = "w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1";

  return (
    <div className="flex items-center gap-1 px-6 py-2 border-b border-gray-200 dark:border-gray-800 shrink-0">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btn(editor.isActive("bold"))}
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btn(editor.isActive("italic"))}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btn(editor.isActive("underline"))}
        title="Underline (Ctrl+U)"
      >
        <span className="underline">U</span>
      </button>

      <div className={sep} />

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btn(editor.isActive("heading", { level: 1 }))}
        title="Heading 1"
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btn(editor.isActive("heading", { level: 2 }))}
        title="Heading 2"
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btn(editor.isActive("heading", { level: 3 }))}
        title="Heading 3"
      >
        H3
      </button>

      <div className={sep} />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btn(editor.isActive("bulletList"))}
        title="Bullet List"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><circle cx="2.5" cy="3.5" r="1.5"/><circle cx="2.5" cy="8" r="1.5"/><circle cx="2.5" cy="12.5" r="1.5"/><rect x="6" y="2.5" width="9" height="2" rx="0.5"/><rect x="6" y="7" width="9" height="2" rx="0.5"/><rect x="6" y="11.5" width="9" height="2" rx="0.5"/></svg>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btn(editor.isActive("orderedList"))}
        title="Numbered List"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><text x="0.5" y="5" fontSize="5" fontWeight="bold">1.</text><text x="0.5" y="9.5" fontSize="5" fontWeight="bold">2.</text><text x="0.5" y="14" fontSize="5" fontWeight="bold">3.</text><rect x="6" y="2.5" width="9" height="2" rx="0.5"/><rect x="6" y="7" width="9" height="2" rx="0.5"/><rect x="6" y="11.5" width="9" height="2" rx="0.5"/></svg>
      </button>
    </div>
  );
}

export default function RichEditor({ content, onUpdate, placeholder }: RichEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: placeholder ?? "Start writing...",
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "p-6 text-base leading-relaxed focus:outline-none min-h-full text-gray-800 dark:text-gray-200",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Toolbar editor={editor} />
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
