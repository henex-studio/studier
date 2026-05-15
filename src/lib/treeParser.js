export function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  cells.push(current.trim());
  return cells;
}

export function buildPathsFromCsv(csvText) {
  const lines = String(csvText || "").split(/\r?\n/).map((line) => line.trimEnd()).filter(Boolean);
  const paths = [];
  const current = [];

  lines.slice(1).forEach((line) => {
    const cells = parseCsvLine(line).slice(0, 8);
    while (cells.length < 8) cells.push("");

    const levelIndex = cells.findIndex((cell) => cell !== "");
    if (levelIndex === -1) return;

    current[levelIndex] = cells[levelIndex];
    current.length = levelIndex + 1;
    paths.push([...current]);
  });

  return paths;
}

function slugify(text) {
  return String(text).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90);
}

export function buildTree(paths) {
  const roots = [];

  const findOrCreate = (siblings, label, fullPath) => {
    let node = siblings.find((item) => item.label === label);
    if (!node) {
      node = { id: slugify(fullPath.join(" ")), label, path: fullPath.join(" > "), children: [] };
      siblings.push(node);
    }
    return node;
  };

  paths.forEach((path) => {
    let siblings = roots;
    const fullPath = [];
    path.forEach((label) => {
      fullPath.push(label);
      const node = findOrCreate(siblings, label, fullPath);
      siblings = node.children;
    });
  });

  return roots;
}

export function treeFromCsv(csvText) {
  return buildTree(buildPathsFromCsv(csvText));
}
