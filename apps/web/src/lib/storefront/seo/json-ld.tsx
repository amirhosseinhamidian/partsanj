import 'server-only';

type JsonLdObject = Record<string, unknown>;

type JsonLdProps = {
  data: JsonLdObject | JsonLdObject[];
};

function safeJsonStringify(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type='application/ld+json'
      dangerouslySetInnerHTML={{
        __html: safeJsonStringify(data),
      }}
    />
  );
}
