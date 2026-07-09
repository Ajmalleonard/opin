"use client";

import { marked } from "marked";
import React, { useMemo } from "react";
import { useMDXComponents } from "../../mdx-components";

function renderToken(token: any, index: number, components: any): React.ReactNode {
  switch (token.type) {
    case "space":
      return null;
    case "hr": {
      const Hr = components.hr || "hr";
      return <Hr key={index} />;
    }
    case "heading": {
      const Tag = `h${token.depth}` as keyof React.JSX.IntrinsicElements;
      const HeadingComponent = components[Tag] || Tag;
      return (
        <HeadingComponent key={index}>
          {token.tokens
            ? token.tokens.map((t: any, i: number) => renderToken(t, i, components))
            : token.text}
        </HeadingComponent>
      );
    }
    case "code": {
      const Pre = components.pre || "pre";
      const Code = components.code || "code";
      return (
        <Pre key={index}>
          <Code className={`language-${token.lang || ""}`}>{token.text}</Code>
        </Pre>
      );
    }
    case "table": {
      const Table = components.table || "table";
      const Thead = components.thead || "thead";
      const Tbody = components.tbody || "tbody";
      const Tr = components.tr || "tr";
      const Th = components.th || "th";
      const Td = components.td || "td";

      return (
        <Table key={index}>
          <Thead>
            <Tr>
              {token.header.map((cell: any, i: number) => (
                <Th key={i} align={token.align[i] || undefined}>
                  {cell.tokens
                    ? cell.tokens.map((t: any, idx: number) => renderToken(t, idx, components))
                    : cell.text}
                </Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {token.rows.map((row: any, rIdx: number) => (
              <Tr key={rIdx}>
                {row.map((cell: any, cIdx: number) => (
                  <Td key={cIdx} align={token.align[cIdx] || undefined}>
                    {cell.tokens
                      ? cell.tokens.map((t: any, idx: number) => renderToken(t, idx, components))
                      : cell.text}
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      );
    }
    case "blockquote": {
      const Blockquote = components.blockquote || "blockquote";
      return (
        <Blockquote key={index}>
          {token.tokens
            ? token.tokens.map((t: any, i: number) => renderToken(t, i, components))
            : token.text}
        </Blockquote>
      );
    }
    case "list": {
      const Tag = token.ordered ? "ol" : "ul";
      const ListComponent = components[Tag] || Tag;
      return (
        <ListComponent key={index}>
          {token.items.map((item: any, i: number) => {
            const Li = components.li || "li";
            return (
              <Li key={i}>
                {item.tokens
                  ? item.tokens.map((t: any, idx: number) => renderToken(t, idx, components))
                  : item.text}
              </Li>
            );
          })}
        </ListComponent>
      );
    }
    case "paragraph": {
      const P = components.p || "p";
      return (
        <P key={index}>
          {token.tokens
            ? token.tokens.map((t: any, i: number) => renderToken(t, i, components))
            : token.text}
        </P>
      );
    }
    case "text": {
      if (token.tokens) {
        return (
          <React.Fragment key={index}>
            {token.tokens.map((t: any, i: number) => renderToken(t, i, components))}
          </React.Fragment>
        );
      }
      return token.text;
    }
    case "html": {
      return <span key={index} dangerouslySetInnerHTML={{ __html: token.text }} />;
    }
    case "escape":
      return token.text;
    case "strong": {
      const Strong = components.strong || "strong";
      return (
        <Strong key={index}>
          {token.tokens
            ? token.tokens.map((t: any, i: number) => renderToken(t, i, components))
            : token.text}
        </Strong>
      );
    }
    case "em": {
      const Em = components.em || "em";
      return (
        <Em key={index}>
          {token.tokens
            ? token.tokens.map((t: any, i: number) => renderToken(t, i, components))
            : token.text}
        </Em>
      );
    }
    case "codespan": {
      const Code = components.code || "code";
      return <Code key={index}>{token.text}</Code>;
    }
    case "br":
      return <br key={index} />;
    case "del": {
      const Del = components.del || "del";
      return (
        <Del key={index}>
          {token.tokens
            ? token.tokens.map((t: any, i: number) => renderToken(t, i, components))
            : token.text}
        </Del>
      );
    }
    case "link": {
      const A = components.a || "a";
      return (
        <A
          key={index}
          href={token.href}
          title={token.title || undefined}
          target="_blank"
          rel="noreferrer noopener"
        >
          {token.tokens
            ? token.tokens.map((t: any, i: number) => renderToken(t, i, components))
            : token.text}
        </A>
      );
    }
    case "image": {
      const Img = components.img || "img";
      return <Img key={index} src={token.href} alt={token.text} title={token.title || undefined} />;
    }
    default:
      return token.text || null;
  }
}

export function Markdown({ content, className }: { content: string; className?: string }) {
  const components = useMDXComponents();

  const renderedElements = useMemo(() => {
    const tokens = marked.lexer(content || "");
    return tokens.map((token, index) => renderToken(token, index, components));
  }, [content, components]);

  return (
    <div className={className ? `control-markdown ${className}` : "control-markdown"}>
      {renderedElements}
    </div>
  );
}
