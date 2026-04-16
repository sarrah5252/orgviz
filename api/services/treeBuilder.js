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
  const directReports = new Set();
  const locations = new Set();
  const clients = new Set();
  const experiences = new Set();

  function getExperienceRange(y) {
    if (y === undefined || y === null) return null;
    if (y < 2) return '< 2 years';
    if (y < 4) return '2-4 years';
    if (y < 8) return '4-8 years';
    if (y < 16) return '8-16 years';
    return '16+ years';
  }

  employees.forEach(emp => {
    if (emp.department) departments.add(emp.department);
    if (emp.location) locations.add(emp.location);
    if (emp.client && emp.client !== '—' && emp.client !== '-') clients.add(emp.client);
    const expRange = getExperienceRange(emp.yearsOfExperience);
    if (expRange) experiences.add(expRange);
  });

  const primaryRoot = roots.length === 1 ? roots[0] : { id: 'root', name: 'Organization', title: 'Root', department: '', managerId: '', location: '', client: '', employmentType: '', children: roots };
  
  // Collect level-1 names (direct children of the Managing Director)
  if (primaryRoot && primaryRoot.children) {
    primaryRoot.children.forEach(level1 => {
      directReports.add(level1.name);
    });
  }

  return {
    tree: primaryRoot,
    employees,
    filters: {
      departments: [...departments].sort(),
      directReports: [...directReports].sort(),
      locations: [...locations].sort(),
      clients: [...clients].sort(),
      experience: [...experiences],
    },
  };
}
