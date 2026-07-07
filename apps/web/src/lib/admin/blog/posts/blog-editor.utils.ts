import type { BlogEditorDocument } from './admin-blog-post.types';

export function createEmptyBlogEditorDocument(): BlogEditorDocument {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
      },
    ],
  };
}

const meaningfulAtomicNodeTypes = new Set([
  'image',
  'video',
  'audio',
  'youtube',
  'embed',
  'horizontalRule',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function hasMeaningfulBlogEditorContent(value: unknown): boolean {
  function visit(node: unknown): boolean {
    if (!isRecord(node)) {
      return false;
    }

    if (node.type === 'text' && typeof node.text === 'string' && node.text.trim().length > 0) {
      return true;
    }

    if (typeof node.type === 'string' && meaningfulAtomicNodeTypes.has(node.type)) {
      return true;
    }

    if (Array.isArray(node.content)) {
      return node.content.some(visit);
    }

    return false;
  }

  return visit(value);
}
