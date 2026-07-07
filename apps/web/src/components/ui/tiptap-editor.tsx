'use client';

import type { Editor, Extensions, JSONContent } from '@tiptap/core';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/react';
import { cn } from '@/lib/utils/cn';
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Undo2,
  Unlink,
} from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';

export type TiptapEditorDocument = Record<string, unknown> & {
  type: string;
  content?: unknown[];
};

export type TiptapEditorToolbarOptions = {
  undoRedo?: boolean;
  headings?: boolean;
  marks?: boolean;
  lists?: boolean;
  blockquote?: boolean;
  links?: boolean;
  clearFormatting?: boolean;
};

type TiptapHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type TiptapEditorProps<TDocument extends TiptapEditorDocument = TiptapEditorDocument> = {
  id?: string;

  label?: ReactNode;
  helperText?: ReactNode;
  error?: string;

  value: TDocument;
  onChange?: (value: TDocument) => void;

  disabled?: boolean;
  dir?: 'rtl' | 'ltr' | 'auto';

  placeholder?: string;
  ariaLabel?: string;

  className?: string;
  contentClassName?: string;
  minHeightClassName?: string;

  toolbar?: false | TiptapEditorToolbarOptions;
  headingLevels?: readonly TiptapHeadingLevel[];

  extensions?: Extensions;

  showCharacterCount?: boolean;
  characterCountLocale?: string;
  characterCountLabel?: string;

  linkPromptLabel?: string;
  invalidLinkMessage?: string;

  onRequestLink?: (currentHref: string) => string | null;

  onFocus?: () => void;
  onBlur?: () => void;

  onEditorReady?: (editor: Editor) => void;
};

const DEFAULT_TOOLBAR_OPTIONS: Required<TiptapEditorToolbarOptions> = {
  undoRedo: true,
  headings: true,
  marks: true,
  lists: true,
  blockquote: true,
  links: true,
  clearFormatting: true,
};

function getSafeLinkHref(value: string): string | null {
  const normalized = value.trim();

  if (!normalized) {
    return '';
  }

  if (normalized.startsWith('/') || normalized.startsWith('#')) {
    return normalized;
  }

  try {
    const url = new URL(normalized);

    if (
      url.protocol === 'http:' ||
      url.protocol === 'https:' ||
      url.protocol === 'mailto:' ||
      url.protocol === 'tel:'
    ) {
      return url.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function serializeContent(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

export function TiptapEditor<TDocument extends TiptapEditorDocument = TiptapEditorDocument>({
  id,
  label,
  helperText,
  error,
  value,
  onChange,
  disabled = false,
  dir = 'rtl',
  placeholder = 'شروع به نوشتن کنید',
  ariaLabel = 'ویرایشگر متن',
  className,
  contentClassName,
  minHeightClassName = 'min-h-[280px]',
  toolbar = {},
  headingLevels = [2, 3],
  extensions = [],
  showCharacterCount = false,
  characterCountLocale = 'fa-IR',
  characterCountLabel = 'کاراکتر',
  linkPromptLabel = 'آدرس لینک را وارد کنید',
  invalidLinkMessage = 'آدرس لینک معتبر نیست',
  onRequestLink,
  onFocus,
  onBlur,
  onEditorReady,
}: TiptapEditorProps<TDocument>) {
  const generatedId = useId();

  const editorId = id ?? `tiptap-editor-${generatedId}`;

  const helperTextId = `${editorId}-helper`;
  const errorId = `${editorId}-error`;
  const labelId = `${editorId}-label`;

  const describedBy = [helperText ? helperTextId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ');

  const [, setToolbarVersion] = useState(0);

  const [linkError, setLinkError] = useState<string | null>(null);

  const onChangeRef = useRef(onChange);
  const onFocusRef = useRef(onFocus);
  const onBlurRef = useRef(onBlur);
  const onEditorReadyRef = useRef(onEditorReady);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onFocusRef.current = onFocus;
  }, [onFocus]);

  useEffect(() => {
    onBlurRef.current = onBlur;
  }, [onBlur]);

  useEffect(() => {
    onEditorReadyRef.current = onEditorReady;
  }, [onEditorReady]);

  const toolbarOptions = useMemo(
    () => ({
      ...DEFAULT_TOOLBAR_OPTIONS,
      ...(toolbar === false ? {} : toolbar),
    }),
    [toolbar],
  );

  const headingLevelsKey = headingLevels.join(',');

  const resolvedHeadingLevels = useMemo(
    () => Array.from(new Set(headingLevels)).sort((first, second) => first - second),
    [headingLevelsKey],
  );

  const resolvedExtensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: resolvedHeadingLevels,
        },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      ...extensions,
    ],
    [extensions, placeholder, resolvedHeadingLevels],
  );

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,

    content: value as JSONContent,
    editable: !disabled,
    extensions: resolvedExtensions,

    editorProps: {
      attributes: {
        id: editorId,
        dir,
        role: 'textbox',
        'aria-label': ariaLabel,
        'aria-multiline': 'true',
      },
    },

    onCreate: ({ editor: createdEditor }) => {
      onEditorReadyRef.current?.(createdEditor);

      setToolbarVersion((current) => current + 1);
    },

    onUpdate: ({ editor: currentEditor }) => {
      setLinkError(null);

      onChangeRef.current?.(currentEditor.getJSON() as TDocument);

      setToolbarVersion((current) => current + 1);
    },

    onSelectionUpdate: () => {
      setToolbarVersion((current) => current + 1);
    },

    onTransaction: () => {
      setToolbarVersion((current) => current + 1);
    },

    onFocus: () => {
      onFocusRef.current?.();
    },

    onBlur: () => {
      onBlurRef.current?.();
    },
  });

  const serializedIncomingValue = useMemo(() => serializeContent(value), [value]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    const serializedEditorValue = serializeContent(editor.getJSON());

    if (serializedEditorValue === serializedIncomingValue) {
      return;
    }

    editor.commands.setContent(value as JSONContent, {
      emitUpdate: false,
    });

    setToolbarVersion((current) => current + 1);
  }, [editor, serializedIncomingValue, value]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    editor.setEditable(!disabled, false);
  }, [disabled, editor]);

  const textLength = editor?.getText().trim().length ?? 0;

  const formattedTextLength = new Intl.NumberFormat(characterCountLocale).format(textLength);

  function handleSetLink() {
    if (!editor || disabled) {
      return;
    }

    const currentHref = (editor.getAttributes('link').href as string | undefined) ?? '';

    const requestedHref = onRequestLink
      ? onRequestLink(currentHref)
      : window.prompt(linkPromptLabel, currentHref);

    if (requestedHref === null) {
      return;
    }

    const href = getSafeLinkHref(requestedHref);

    if (href === null) {
      setLinkError(invalidLinkMessage);
      return;
    }

    setLinkError(null);

    if (!href) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();

      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }

  const showToolbar = toolbar !== false;

  return (
    <div className={cn('space-y-1.5', className)}>
      {label ? (
        <label
          id={labelId}
          htmlFor={editorId}
          className='block text-sm font-semibold text-foreground'
        >
          {label}
        </label>
      ) : null}

      <div
        role='group'
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? 'true' : undefined}
        className={cn(
          'overflow-hidden rounded-card border bg-background transition-colors',
          error
            ? 'border-danger'
            : 'border-border focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15',
          disabled && 'opacity-60',
        )}
      >
        {showToolbar ? (
          <div className='flex flex-wrap items-center gap-1 border-b border-border bg-surface-muted p-2'>
            {toolbarOptions.undoRedo ? (
              <>
                <ToolbarButton
                  label='بازگردانی'
                  disabled={disabled || !editor?.can().undo()}
                  onClick={() => {
                    editor?.chain().focus().undo().run();
                  }}
                >
                  <Undo2 className='size-4' />
                </ToolbarButton>

                <ToolbarButton
                  label='انجام دوباره'
                  disabled={disabled || !editor?.can().redo()}
                  onClick={() => {
                    editor?.chain().focus().redo().run();
                  }}
                >
                  <Redo2 className='size-4' />
                </ToolbarButton>
              </>
            ) : null}

            {toolbarOptions.undoRedo &&
            (toolbarOptions.headings ||
              toolbarOptions.marks ||
              toolbarOptions.lists ||
              toolbarOptions.blockquote ||
              toolbarOptions.links ||
              toolbarOptions.clearFormatting) ? (
              <ToolbarDivider />
            ) : null}

            {toolbarOptions.headings
              ? resolvedHeadingLevels.map((level) => (
                  <ToolbarButton
                    key={level}
                    label={`تیتر سطح ${level}`}
                    pressed={editor?.isActive('heading', {
                      level,
                    })}
                    disabled={disabled}
                    onClick={() => {
                      editor
                        ?.chain()
                        .focus()
                        .toggleHeading({
                          level,
                        })
                        .run();
                    }}
                  >
                    <span className='text-xs font-extrabold'>H{level}</span>
                  </ToolbarButton>
                ))
              : null}

            {toolbarOptions.headings &&
            (toolbarOptions.marks ||
              toolbarOptions.lists ||
              toolbarOptions.blockquote ||
              toolbarOptions.links ||
              toolbarOptions.clearFormatting) ? (
              <ToolbarDivider />
            ) : null}

            {toolbarOptions.marks ? (
              <>
                <ToolbarButton
                  label='بولد'
                  pressed={editor?.isActive('bold')}
                  disabled={disabled}
                  onClick={() => {
                    editor?.chain().focus().toggleBold().run();
                  }}
                >
                  <Bold className='size-4' />
                </ToolbarButton>

                <ToolbarButton
                  label='ایتالیک'
                  pressed={editor?.isActive('italic')}
                  disabled={disabled}
                  onClick={() => {
                    editor?.chain().focus().toggleItalic().run();
                  }}
                >
                  <Italic className='size-4' />
                </ToolbarButton>
              </>
            ) : null}

            {toolbarOptions.clearFormatting ? (
              <ToolbarButton
                label='پاک‌کردن فرمت'
                disabled={disabled}
                onClick={() => {
                  editor?.chain().focus().unsetAllMarks().clearNodes().run();
                }}
              >
                <RemoveFormatting className='size-4' />
              </ToolbarButton>
            ) : null}

            {(toolbarOptions.marks || toolbarOptions.clearFormatting) &&
            (toolbarOptions.lists || toolbarOptions.blockquote || toolbarOptions.links) ? (
              <ToolbarDivider />
            ) : null}

            {toolbarOptions.lists ? (
              <>
                <ToolbarButton
                  label='فهرست نشانه‌ای'
                  pressed={editor?.isActive('bulletList')}
                  disabled={disabled}
                  onClick={() => {
                    editor?.chain().focus().toggleBulletList().run();
                  }}
                >
                  <List className='size-4' />
                </ToolbarButton>

                <ToolbarButton
                  label='فهرست شماره‌دار'
                  pressed={editor?.isActive('orderedList')}
                  disabled={disabled}
                  onClick={() => {
                    editor?.chain().focus().toggleOrderedList().run();
                  }}
                >
                  <ListOrdered className='size-4' />
                </ToolbarButton>
              </>
            ) : null}

            {toolbarOptions.blockquote ? (
              <ToolbarButton
                label='نقل‌قول'
                pressed={editor?.isActive('blockquote')}
                disabled={disabled}
                onClick={() => {
                  editor?.chain().focus().toggleBlockquote().run();
                }}
              >
                <Quote className='size-4' />
              </ToolbarButton>
            ) : null}

            {(toolbarOptions.lists || toolbarOptions.blockquote) && toolbarOptions.links ? (
              <ToolbarDivider />
            ) : null}

            {toolbarOptions.links ? (
              <>
                <ToolbarButton
                  label='افزودن یا ویرایش لینک'
                  pressed={editor?.isActive('link')}
                  disabled={disabled}
                  onClick={handleSetLink}
                >
                  <Link2 className='size-4' />
                </ToolbarButton>

                <ToolbarButton
                  label='حذف لینک'
                  disabled={disabled || !editor?.isActive('link')}
                  onClick={() => {
                    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
                  }}
                >
                  <Unlink className='size-4' />
                </ToolbarButton>
              </>
            ) : null}
          </div>
        ) : null}

        <div className={cn(minHeightClassName, contentClassName)}>
          <EditorContent
            editor={editor}
            className={cn(
              'h-full text-sm leading-8 text-foreground',
              '[&_.ProseMirror]:min-h-full [&_.ProseMirror]:px-4 [&_.ProseMirror]:py-5 [&_.ProseMirror]:outline-none',
              '[&_.ProseMirror_h1]:mt-8 [&_.ProseMirror_h1]:text-2xl [&_.ProseMirror_h1]:font-extrabold',
              '[&_.ProseMirror_h2]:mt-8 [&_.ProseMirror_h2]:text-xl [&_.ProseMirror_h2]:font-extrabold',
              '[&_.ProseMirror_h3]:mt-6 [&_.ProseMirror_h3]:text-lg [&_.ProseMirror_h3]:font-bold',
              '[&_.ProseMirror_h4]:mt-5 [&_.ProseMirror_h4]:text-base [&_.ProseMirror_h4]:font-bold',
              '[&_.ProseMirror_p]:my-3',
              '[&_.ProseMirror_ul]:my-4 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pe-6',
              '[&_.ProseMirror_ol]:my-4 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pe-6',
              '[&_.ProseMirror_blockquote]:my-5 [&_.ProseMirror_blockquote]:border-s-4 [&_.ProseMirror_blockquote]:border-brand [&_.ProseMirror_blockquote]:ps-4 [&_.ProseMirror_blockquote]:text-foreground-secondary',
              '[&_.ProseMirror_a]:text-brand [&_.ProseMirror_a]:underline',
              '[&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-right [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-foreground-muted [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
              disabled && 'cursor-not-allowed [&_.ProseMirror]:cursor-not-allowed',
            )}
          />
        </div>

        {linkError ? (
          <p
            role='alert'
            className='border-t border-danger/20 bg-danger-soft px-4 py-2 text-xs font-semibold text-danger'
          >
            {linkError}
          </p>
        ) : null}

        {showCharacterCount ? (
          <div className='flex items-center justify-end border-t border-border bg-surface px-4 py-2 text-xs text-foreground-muted'>
            <span className='numeric'>
              {formattedTextLength} {characterCountLabel}
            </span>
          </div>
        ) : null}
      </div>

      {helperText ? (
        <p id={helperTextId} className='text-xs leading-5 text-foreground-muted'>
          {helperText}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} role='alert' className='text-xs leading-5 font-semibold text-danger'>
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  label,
  pressed,
  disabled = false,
  children,
  onClick,
}: {
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type='button'
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={onClick}
      className={cn(
        'grid size-8 place-items-center rounded-control transition-colors',
        pressed
          ? 'bg-brand text-brand-foreground'
          : 'text-foreground-secondary hover:bg-background hover:text-foreground',
        disabled &&
          'cursor-not-allowed opacity-40 hover:bg-transparent hover:text-foreground-secondary',
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span aria-hidden='true' className='mx-1 h-5 w-px bg-border' />;
}
