import React, { useEffect, useMemo, useState } from "react";

function getNodeLabel(node) {
  return String(node?.label || node?.name || node?.title || node?.text || "Untitled");
}

function getNodeChildren(node) {
  return Array.isArray(node?.children) ? node.children : [];
}

function getPath(parentPath, label) {
  return parentPath ? `${parentPath} > ${label}` : label;
}

function collectExpandablePaths(nodes, parentPath = "") {
  const paths = [];

  (nodes || []).forEach((node) => {
    const label = getNodeLabel(node);
    const path = getPath(parentPath, label);
    const children = getNodeChildren(node);

    if (children.length > 0) {
      paths.push(path);
      paths.push(...collectExpandablePaths(children, path));
    }
  });

  return paths;
}

function shouldCollapseByDefault() {
  if (typeof window === "undefined") return false;

  const pathname = window.location.pathname || "";
  return pathname.startsWith("/test/") || pathname.startsWith("/preview/");
}

export default function TreeView({ tree = [], selectedPath = "", onSelect, defaultExpanded }) {
  const startExpanded = defaultExpanded ?? !shouldCollapseByDefault();

  const initialExpandedPaths = useMemo(() => {
    return startExpanded ? collectExpandablePaths(tree) : [];
  }, [tree, startExpanded]);

  const [expandedPaths, setExpandedPaths] = useState(initialExpandedPaths);

  useEffect(() => {
    setExpandedPaths(initialExpandedPaths);
  }, [initialExpandedPaths]);

  function togglePath(path) {
    setExpandedPaths((current) => {
      if (current.includes(path)) {
        return current.filter((item) => item !== path);
      }

      return [...current, path];
    });
  }

  function handleSelect(path, hasChildren) {
    if (onSelect) onSelect(path);
    if (hasChildren) togglePath(path);
  }

  function renderNodes(nodes, parentPath = "", depth = 0) {
    return (nodes || []).map((node) => {
      const label = getNodeLabel(node);
      const path = getPath(parentPath, label);
      const children = getNodeChildren(node);
      const hasChildren = children.length > 0;
      const isExpanded = expandedPaths.includes(path);
      const isSelected = selectedPath === path;

      return (
        <div className="tree-node" key={path}>
          <button
            className={isSelected ? "tree-button tree-button-selected" : "tree-button"}
            type="button"
            onClick={() => handleSelect(path, hasChildren)}
            aria-expanded={hasChildren ? isExpanded : undefined}
            style={{ marginLeft: depth ? `${depth * 14}px` : 0 }}
          >
            <span className="tree-label-wrap">
              {isSelected ? <span className="tree-icon-selected">✓</span> : <span className="tree-icon-empty" />}
              <span className="tree-label">{label}</span>
            </span>

            {hasChildren ? (
              <span className="tree-toggle">{isExpanded ? "Hide" : "Show"}</span>
            ) : null}
          </button>

          {hasChildren && isExpanded ? (
            <div className="tree-children">
              {renderNodes(children, path, depth + 1)}
            </div>
          ) : null}
        </div>
      );
    });
  }

  if (!tree || tree.length === 0) {
    return <p className="muted-text">No tree available.</p>;
  }

  return <div className="tree-wrap">{renderNodes(tree)}</div>;
}
