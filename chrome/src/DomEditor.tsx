import { atom, useAtom, type PrimitiveAtom } from "jotai";
import { focusAtom } from "jotai-optics";
import { splitAtom } from "jotai/utils";
import { html, type DefaultTreeAdapterMap } from "parse5";
import * as parse5 from "parse5";
import { useCallback, useMemo } from "react";
import { castAtomWithValue } from "./utils";
import { Engine } from "@igrep/toy-browser-on-browser-engine/src/to-chrome-facade";

export function DomEditor({
  domString,
  engine,
}: {
  domString: string;
  engine: Engine;
}) {
  const htmlAtom = useMemo(() => atom(domString), [domString]);
  const domAtom = useMemo(
    () =>
      atom(
        (get) => parse5.parse(get(htmlAtom)),
        (_get, set, action: DefaultTreeAdapterMap["document"]) => {
          const newHtml = parse5.serialize(action);
          set(htmlAtom, newHtml);
          engine.domUpdate(newHtml);
        },
      ),
    [htmlAtom, engine],
  );

  const nodesAtom = useMemo(
    () => focusAtom(domAtom, (o) => o.prop("childNodes")),
    [domAtom],
  );
  const [root] = useAtom(domAtom);
  return <ChildNodesEditor nodesAtom={nodesAtom} parentNode={root} />;
}

function ChildNodesEditor({
  nodesAtom,
  parentNode,
}: {
  nodesAtom: PrimitiveAtom<DefaultTreeAdapterMap["document"]["childNodes"]>;
  parentNode: DefaultTreeAdapterMap["parentNode"];
}) {
  const [nodes] = useAtom(nodesAtom);
  const nodesAtomsAtom = useMemo(() => splitAtom(nodesAtom), [nodesAtom]);
  const [nodesAtoms, dispatch] = useAtom(nodesAtomsAtom);
  const lastNode = nodes.at(-1);
  return (
    <>
      {nodesAtoms.map((nodeAtom) => (
        <NodeEditor
          nodeAtom={nodeAtom}
          insertBefore={(newNode, referenceNodeAtom) => {
            dispatch({
              type: "insert",
              value: newNode,
              before: referenceNodeAtom,
            });
          }}
          remove={() => dispatch({ type: "remove", atom: nodeAtom })}
          parentNode={parentNode}
        />
      ))}
      <InsertButton
        insert={(newNode) => {
          dispatch({ type: "insert", value: newNode });
        }}
        parentNode={parentNode}
        siblingIsText={lastNode != null && lastNode.nodeName === "#text"}
      />
    </>
  );
}

function NodeEditor({
  nodeAtom,
  insertBefore,
  remove,
  parentNode,
}: {
  nodeAtom: PrimitiveAtom<DefaultTreeAdapterMap["childNode"]>;
  insertBefore: InsertBefore;
  remove: Remove;
  parentNode: DefaultTreeAdapterMap["parentNode"];
}) {
  const [node] = useAtom(nodeAtom);
  switch (node.nodeName) {
    case "#documentType":
      return (
        <DocumentTypeNode
          node={node as DefaultTreeAdapterMap["documentType"]}
        />
      );
    case "#comment":
      return (
        <CommentNode node={node as DefaultTreeAdapterMap["commentNode"]} />
      );
    case "#text":
      return (
        <TextNodeEditor
          nodeAtom={castAtomWithValue(
            nodeAtom,
            node as DefaultTreeAdapterMap["textNode"],
          )}
          insertBefore={insertBefore}
          remove={remove}
          parentNode={parentNode}
        />
      );
    case "template":
      console.error("Template nodes are not supported!");
      return <></>;
    default:
      return (
        <ElementNodeEditor
          nodeAtom={castAtomWithValue(
            nodeAtom,
            node as DefaultTreeAdapterMap["element"],
          )}
          insertBefore={insertBefore}
          remove={remove}
          parentNode={parentNode}
        />
      );
  }
}

function DocumentTypeNode({
  node,
}: {
  node: DefaultTreeAdapterMap["documentType"];
}) {
  // I don't care other properties of DOCTYPE nodes!
  return <div>{`<!DOCTYPE ${node.name}>`}</div>;
}

function CommentNode({ node }: { node: DefaultTreeAdapterMap["commentNode"] }) {
  return <div>{`<!-- ${node.data} -->`}</div>;
}

function TextNodeEditor({
  nodeAtom,
  remove,
  insertBefore,
  parentNode,
}: {
  nodeAtom: PrimitiveAtom<DefaultTreeAdapterMap["textNode"]>;
  insertBefore: InsertBefore;
  remove: Remove;
  parentNode: DefaultTreeAdapterMap["parentNode"];
}) {
  const [node, setNode] = useAtom(nodeAtom);
  return (
    <div>
      <InsertButton
        insert={useCallback(
          (newNode) => {
            insertBefore(
              newNode,
              nodeAtom as PrimitiveAtom<DefaultTreeAdapterMap["childNode"]>,
            );
          },
          [nodeAtom, insertBefore],
        )}
        parentNode={parentNode}
        siblingIsText={true}
      />
      <br />
      <button onClick={remove}>X</button>
      <input
        value={node.value}
        onChange={(e) => setNode({ ...node, value: e.target.value })}
      />
    </div>
  );
}

function ElementNodeEditor({
  nodeAtom,
  insertBefore,
  remove,
  parentNode,
}: {
  nodeAtom: PrimitiveAtom<DefaultTreeAdapterMap["element"]>;
  insertBefore: InsertBefore;
  remove: Remove;
  parentNode: DefaultTreeAdapterMap["parentNode"];
}) {
  const [node] = useAtom(nodeAtom);
  const nodesAtom = useMemo(
    () => focusAtom(nodeAtom, (o) => o.prop("childNodes")),
    [nodeAtom],
  );
  return (
    <div>
      <InsertButton
        insert={useCallback(
          (newNode) => {
            insertBefore(
              newNode,
              nodeAtom as PrimitiveAtom<DefaultTreeAdapterMap["childNode"]>,
            );
          },
          [nodeAtom, insertBefore],
        )}
        parentNode={parentNode}
        siblingIsText={false}
      />
      <br />
      <details open style={{ padding: "1em" }}>
        <summary>
          <button onClick={remove}>X</button>
          {`<${node.tagName}`}
          {/* Sorry attributes are not supported! */ ">"}
        </summary>
        <ChildNodesEditor nodesAtom={nodesAtom} parentNode={parentNode} />
      </details>
    </div>
  );
}

function InsertButton({
  insert,
  parentNode,
  siblingIsText,
}: {
  insert: (newNode: DefaultTreeAdapterMap["childNode"]) => void;
  parentNode: DefaultTreeAdapterMap["parentNode"];
  siblingIsText: boolean;
}) {
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      switch (e.target.value) {
        case "default":
          // do nothing
          break;
        case "#text":
          insert({ nodeName: "#text", value: "REPLACE ME", parentNode });
          break;
        case "element": {
          const defaultTagName = "div";
          const nodeName =
            prompt("Enter tag name:", defaultTagName) ?? defaultTagName;
          insert({
            nodeName,
            tagName: nodeName,
            attrs: [],
            childNodes: [],
            parentNode,
            // I know, this is incorrect. But it's too much work to support this correctly.
            namespaceURI: html.NS.HTML,
          });
          break;
        }
        default:
          throw new Error(`Unknown value: ${e.target.value}`);
      }
      e.target.value = "default";
    },
    [insert, parentNode],
  );
  return (
    <select onChange={onChange}>
      <option value="default">+</option>
      <option value="element">Element</option>
      <option
        value="#text"
        disabled={siblingIsText}
        title={
          siblingIsText ? "You can't insert text before/after a text node." : ""
        }
      >
        Text
      </option>
    </select>
  );
}

type InsertBefore = (
  newNode: DefaultTreeAdapterMap["childNode"],
  referenceNodeAtom: PrimitiveAtom<DefaultTreeAdapterMap["childNode"]>,
) => void;
type Remove = () => void;
