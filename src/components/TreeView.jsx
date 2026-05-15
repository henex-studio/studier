import React, { useState } from "react";
import { CheckCircle2 } from "lucide-react";

function TreeNode({ node, selectedPath, onSelect, level = 0, path = [] }) {
  const [open, setOpen] = useState(level === 0);
  const currentPath = [...path, node.label];
  const pathText = currentPath.join(" > ");
  const selected = selectedPath === pathText;
  const hasChildren = Boolean(node.children?.length);

  return (
    <div className="tree-node">
      <button
        className={selected ? "tree-button tree-button-selected" : "tree-button"}
        style={{ marginLeft: `${Math.min(level * 14, 64)}px`, width: `calc(100% - ${Math.min(level * 14, 64)}px)` }}
        onClick={() => {
          if (hasChildren) setOpen(!open);
          onSelect(pathText);
        }}
      >
        <span className="tree-label-wrap">
          {selected ? <CheckCircle2 className="tree-icon-selected" /> : <span className="tree-icon-empty" />}
          <span className="tree-label">{node.label}</span>
        </span>
        {hasChildren ? <span className="tree-toggle">{open ? "Hide" : "Show"}</span> : null}
      </button>
      {open && hasChildren ? <div className="tree-children">{node.children.map((child) => <TreeNode key={child.path} node={child} selectedPath={selectedPath} onSelect={onSelect} level={level + 1} path={currentPath} />)}</div> : null}
    </div>
  );
}

export default function TreeView({ tree, selectedPath, onSelect }) {
  return <div className="tree-wrap">{(tree || []).map((node) => <TreeNode key={node.path} node={node} selectedPath={selectedPath} onSelect={onSelect} />)}</div>;
}
