/**
 * Converts flat employee list → hierarchical tree + filter options
 */
export function buildTree(employees) {
  const nodeMap = new Map();
  const childrenMap = new Map();

  // Build lookup maps
  employees.forEach(emp => {
    nodeMap.set(emp.id, { ...emp, children: [] });
    if (!childrenMap.has(emp.id)) {
      childrenMap.set(emp.id, []);
    }
  });

  const roots = [];
  const orphans = [];

  employees.forEach(emp => {
    const node = nodeMap.get(emp.id);
    if (!emp.managerId || emp.managerId === '' || emp.managerId === '—' || emp.managerId === '-') {
      roots.push(node);
    } else if (nodeMap.has(emp.managerId)) {
      nodeMap.get(emp.managerId).children.push(node);
    } else {
      // Orphan: invalid manager reference
      orphans.push(node);
    }
  });

  // Attach orphans to root if there's a single root, otherwise create virtual root
  if (orphans.length > 0) {
    if (roots.length === 1) {
      roots[0].children.push(...orphans);
    } else {
      roots.push(...orphans);
    }
  }

  // Collect unique filter values
  const departments = new Set();
  const titles = new Set();
  const locations = new Set();
  const clients = new Set();

  employees.forEach(emp => {
    if (emp.department) departments.add(emp.department);
    if (emp.title) titles.add(emp.title);
    if (emp.location) locations.add(emp.location);
    if (emp.client && emp.client !== '—' && emp.client !== '-') clients.add(emp.client);
  });

  return {
    tree: roots.length === 1 ? roots[0] : { id: 'root', name: 'Organization', title: 'Root', department: '', managerId: '', location: '', client: '', employmentType: '', children: roots },
    employees,
    filters: {
      departments: [...departments].sort(),
      titles: [...titles].sort(),
      locations: [...locations].sort(),
      clients: [...clients].sort(),
    },
  };
}
