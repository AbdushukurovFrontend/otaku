import { Fragment, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

function InlineSpoiler({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      role="button"
      tabIndex={0}
      title={open ? undefined : "Spoylerni ko'rish uchun bosing"}
      onClick={(e) => {
        e.stopPropagation();
        setOpen(true);
      }}
      onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
      className={cn('spoiler-inline', open && 'open')}
    >
      <span className="spoiler-text">{children}</span>
    </span>
  );
}

const INLINE = /(\|\|[^|]+\|\||\*\*[^*]+\*\*|\*[^*\s][^*]*\*|https?:\/\/[^\s)]+|#[a-z0-9_]{2,30}|@[a-z0-9_]{3,30})/gi;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  text.split(INLINE).forEach((part, i) => {
    if (!part) return;
    const k = `${keyPrefix}-${i}`;
    if (part.startsWith('||') && part.endsWith('||') && part.length > 4) out.push(<InlineSpoiler key={k}>{part.slice(2, -2)}</InlineSpoiler>);
    else if (part.startsWith('**') && part.endsWith('**')) out.push(<strong key={k} className="font-semibold text-fg">{part.slice(2, -2)}</strong>);
    else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) out.push(<em key={k}>{part.slice(1, -1)}</em>);
    else if (/^https?:\/\//.test(part))
      out.push(
        <a key={k} href={part} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-fg underline decoration-line-strong underline-offset-2 hover:decoration-fg">
          {part.replace(/^https?:\/\//, '')}
        </a>,
      );
    else if (part.startsWith('#') && /^#[a-z0-9_]+$/i.test(part)) out.push(<span key={k} className="font-medium text-fg">{part}</span>);
    else if (part.startsWith('@') && /^@[a-z0-9_]+$/i.test(part))
      out.push(
        <a key={k} href={`#/u/${part.slice(1)}`} onClick={(e) => e.stopPropagation()} className="font-medium text-fg hover:underline">
          {part}
        </a>,
      );
    else out.push(<Fragment key={k}>{part}</Fragment>);
  });
  return out;
}

/** Tiny markdown-lite renderer: **bold**, *italic*, > quote, - lists, 1. lists, ||spoiler||, links, #tags, @mentions. */
export function RichText({ text, className, clamp }: { text: string; className?: string; clamp?: number }) {
  const blocks = text.split(/\n{2,}/).filter((b) => b.trim());
  const clampClass = clamp ? { 2: 'line-clamp-2', 3: 'line-clamp-3', 4: 'line-clamp-4', 5: 'line-clamp-5' }[clamp] : undefined;

  if (clamp) {
    // Collapse line breaks so CSS line-clamp ends with an inline ellipsis, never a lone "..." line.
    const flat = text
      .replace(/^>\s?/gm, '')
      .replace(/^- /gm, '· ')
      .replace(/\s*\n+\s*/g, ' ')
      .trim();
    return <p className={cn(clampClass, className)}>{renderInline(flat, 'c')}</p>;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n');
        if (lines.every((l) => /^-\s/.test(l))) {
          return (
            <ul key={bi} className="space-y-1.5 pl-1">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2.5">
                  <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-fg-3" />
                  <span>{renderInline(l.replace(/^-\s/, ''), `${bi}-${li}`)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (lines.every((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol key={bi} className="space-y-1.5 pl-1">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2.5">
                  <span className="mt-[1px] w-5 shrink-0 text-right text-[13px] font-medium text-fg-3 tabular-nums">
                    {l.match(/^(\d+)\./)?.[1]}.
                  </span>
                  <span>{renderInline(l.replace(/^\d+\.\s/, ''), `${bi}-${li}`)}</span>
                </li>
              ))}
            </ol>
          );
        }
        if (lines.every((l) => /^>\s?/.test(l))) {
          return (
            <blockquote key={bi} className="border-l-2 border-line-strong py-0.5 pl-4 text-fg-2">
              {renderInline(lines.map((l) => l.replace(/^>\s?/, '')).join('\n'), `${bi}`)}
            </blockquote>
          );
        }
        return (
          <p key={bi} className="whitespace-pre-line">
            {renderInline(block, `${bi}`)}
          </p>
        );
      })}
    </div>
  );
}
