import { registerDecorator, type ValidationOptions } from 'class-validator';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * ساختار پایه‌ی سند TipTap / ProseMirror:
 * { type: 'doc', content: [] }
 */
export function isBlogEditorDocument(value: unknown): value is JsonRecord {
  return isRecord(value) && value.type === 'doc' && Array.isArray(value.content);
}

export function IsBlogEditorDocument(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBlogEditorDocument',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return isBlogEditorDocument(value);
        },
        defaultMessage() {
          return 'محتوای مقاله باید یک سند معتبر Editor باشد';
        },
      },
    });
  };
}

const meaningfulAtomicNodeTypes = new Set([
  'image',
  'video',
  'audio',
  'youtube',
  'embed',
  'horizontalRule',
  'mention',
  'emoji',
]);

/**
 * Draft می‌تواند خالی باشد، اما Publish به محتوای واقعی نیاز دارد
 */
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
