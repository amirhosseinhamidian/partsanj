import { cn } from '@/lib/utils/cn';
import type { ReactNode } from 'react';

export type TiptapDocument = {
  type: string;
  content?: unknown[];
};

type TiptapNodeRecord = Record<string, unknown>;

function isRecord(value: unknown): value is TiptapNodeRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function getSafeHref(value: unknown): string | null {
  const href = readString(value)?.trim();

  if (!href) {
    return null;
  }

  if (href.startsWith('/') || href.startsWith('#')) {
    return href;
  }

  try {
    const url = new URL(href);

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

function getSafeImageSrc(value: unknown): string | null {
  const src = readString(value)?.trim();

  if (!src) {
    return null;
  }

  if (src.startsWith('/')) {
    return src;
  }

  try {
    const url = new URL(src);

    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function getNodeAttrs(node: TiptapNodeRecord) {
  return isRecord(node.attrs) ? node.attrs : {};
}

function applyMarks(value: ReactNode, marks: unknown, nodeKey: string): ReactNode {
  if (!Array.isArray(marks)) {
    return value;
  }

  return marks.reduce<ReactNode>((current, mark, index) => {
    if (!isRecord(mark)) {
      return current;
    }

    const markType = readString(mark.type);
    const attrs = getNodeAttrs(mark);
    const key = `${nodeKey}-mark-${index}`;

    switch (markType) {
      case 'bold':
        return <strong key={key}>{current}</strong>;

      case 'italic':
        return <em key={key}>{current}</em>;

      case 'strike':
        return <s key={key}>{current}</s>;

      case 'code':
        return (
          <code key={key} className='rounded bg-surface-muted px-1.5 py-0.5 text-[0.9em]'>
            {current}
          </code>
        );

      case 'link': {
        const href = getSafeHref(attrs.href);

        if (!href) {
          return current;
        }

        const target = attrs.target === '_blank' ? '_blank' : undefined;

        return (
          <a key={key} href={href} target={target} rel={target ? 'noopener noreferrer' : undefined}>
            {current}
          </a>
        );
      }

      default:
        return current;
    }
  }, value);
}

function renderChildren(node: TiptapNodeRecord, parentKey: string) {
  if (!Array.isArray(node.content)) {
    return null;
  }

  return node.content.map((child, index) => renderNode(child, `${parentKey}-${index}`));
}

function renderNode(node: unknown, nodeKey: string): ReactNode {
  if (!isRecord(node)) {
    return null;
  }

  const nodeType = readString(node.type);
  const children = renderChildren(node, nodeKey);

  switch (nodeType) {
    case 'doc':
      return <>{children}</>;

    case 'text': {
      const text = readString(node.text) ?? '';

      return applyMarks(text, node.marks, nodeKey);
    }

    case 'paragraph':
      return <p key={nodeKey}>{children}</p>;

    case 'heading': {
      const attrs = getNodeAttrs(node);
      const level = Number(attrs.level);

      if (level === 1) {
        return <h1 key={nodeKey}>{children}</h1>;
      }

      if (level === 2) {
        return <h2 key={nodeKey}>{children}</h2>;
      }

      if (level === 3) {
        return <h3 key={nodeKey}>{children}</h3>;
      }

      if (level === 4) {
        return <h4 key={nodeKey}>{children}</h4>;
      }

      return <h5 key={nodeKey}>{children}</h5>;
    }

    case 'bulletList':
      return <ul key={nodeKey}>{children}</ul>;

    case 'orderedList':
      return <ol key={nodeKey}>{children}</ol>;

    case 'listItem':
      return <li key={nodeKey}>{children}</li>;

    case 'blockquote':
      return <blockquote key={nodeKey}>{children}</blockquote>;

    case 'codeBlock':
      return (
        <pre key={nodeKey}>
          <code>{children}</code>
        </pre>
      );

    case 'horizontalRule':
      return <hr key={nodeKey} />;

    case 'hardBreak':
      return <br key={nodeKey} />;

    case 'image': {
      const attrs = getNodeAttrs(node);
      const src = getSafeImageSrc(attrs.src);

      if (!src) {
        return null;
      }

      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={nodeKey}
          src={src}
          alt={readString(attrs.alt) ?? ''}
          loading='lazy'
          decoding='async'
          className='my-7 h-auto w-full rounded-card border border-border object-cover'
        />
      );
    }

    default:
      return <>{children}</>;
  }
}

type TiptapDocumentProps = {
  document: TiptapDocument;
  className?: string;
  dir?: 'rtl' | 'ltr' | 'auto';
};

export function TiptapDocument({ document, className, dir = 'rtl' }: TiptapDocumentProps) {
  return (
    <div
      dir={dir}
      className={cn(
        'text-base leading-9 text-foreground',
        '[&_p]:my-5',
        '[&_h1]:mt-10 [&_h1]:mb-5 [&_h1]:text-3xl [&_h1]:font-extrabold',
        '[&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-extrabold',
        '[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-bold',
        '[&_h4]:mt-7 [&_h4]:mb-3 [&_h4]:text-lg [&_h4]:font-bold',
        '[&_ul]:my-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pe-6',
        '[&_ol]:my-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pe-6',
        '[&_blockquote]:my-7 [&_blockquote]:border-s-4 [&_blockquote]:border-brand [&_blockquote]:ps-5 [&_blockquote]:text-foreground-secondary',
        '[&_a]:font-semibold [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-4',
        '[&_pre]:my-7 [&_pre]:overflow-x-auto [&_pre]:rounded-card [&_pre]:bg-surface-muted [&_pre]:p-4',
        '[&_hr]:my-8 [&_hr]:border-border',
        className,
      )}
    >
      {renderNode(document, 'root')}
    </div>
  );
}
