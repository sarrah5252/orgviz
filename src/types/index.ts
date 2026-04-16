export interface Employee {
  id: string;
  name: string;
  title: string;
  department: string;
  managerId: string;
  location: string;
  client: string;
  employmentType: string;
  yearsOfExperience?: number;
  secondaryManagerIds?: string[];
}

export interface TreeNode extends Employee {
  children: TreeNode[];
}

export interface FilterState {
  departments: string[];
  directReports: string[];
  locations: string[];
  clients: string[];
  experience: string[];
}

export interface FilterOptions {
  departments: string[];
  directReports: string[];
  locations: string[];
  clients: string[];
  experience: string[];
}

export interface OrgData {
  tree: TreeNode;
  employees: Employee[];
  filters: FilterOptions;
}

export interface SavedChart {
  id: string;
  title: string;
  tree: TreeNode;
  employees: Employee[];
  filters: FilterOptions;
  createdAt: number;
  imageData?: string;
}
