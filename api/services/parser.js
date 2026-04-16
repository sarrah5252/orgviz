import XLSX from 'xlsx';

// Map of possible column header variations → normalized field names
const HEADER_MAP = {
  'employee id': 'id',
  'employeeid': 'id',
  'emp id': 'id',
  'id': 'id',
  'name': 'name',
  'employee name': 'name',
  'full name': 'name',
  'job title': 'title',
  'jobtitle': 'title',
  'title': 'title',
  'position': 'title',
  'designation': 'title',
  'department': 'department',
  'dept': 'department',
  'manager id': 'managerId',
  'managerid': 'managerId',
  'manager': 'managerId',
  'reports to': 'managerId',
  'reportsto': 'managerId',
  'supervisor': 'managerId',
  'location': 'location',
  'office': 'location',
  'city': 'location',
  'client': 'client',
  'customer': 'client',
  'employment type': 'employmentType',
  'employmenttype': 'employmentType',
  'emp type': 'employmentType',
  'type': 'employmentType',
  'years of experience': 'yearsOfExperience',
  'yearsofexperience': 'yearsOfExperience',
  'experience': 'yearsOfExperience',
  'years experience': 'yearsOfExperience',
  'yoe': 'yearsOfExperience',
  'years exp': 'yearsOfExperience',
  'exp': 'yearsOfExperience',
  'tenure': 'yearsOfExperience',
  'years': 'yearsOfExperience',
};

function normalizeHeaders(rawHeaders) {
  const mapping = {};
  for (const header of rawHeaders) {
    const key = String(header).toLowerCase().trim().replace(/[_\-]/g, ' ');
    if (HEADER_MAP[key]) {
      mapping[header] = HEADER_MAP[key];
    }
  }
  return mapping;
}

export function parseFile(buffer, ext) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rawData.length) return [];

  const rawHeaders = Object.keys(rawData[0]);
  const headerMapping = normalizeHeaders(rawHeaders);

  // Auto-generate IDs if not present
  let autoId = 1;
  const hasIdField = Object.values(headerMapping).includes('id');

  // Determine if managerId refers to names or IDs
  // Check: does the managerId column contain values that look like names (contain spaces)?
  const managerKey = rawHeaders.find(h => headerMapping[h] === 'managerId');
  const nameKey = rawHeaders.find(h => headerMapping[h] === 'name');

  const employees = rawData.map((row) => {
    const employee = {
      id: '',
      name: '',
      title: '',
      department: '',
      managerId: '',
      secondaryManagerIds: [],
      location: '',
      client: '',
      employmentType: '',
      yearsOfExperience: undefined,
    };

    for (const [rawHeader, normalizedField] of Object.entries(headerMapping)) {
      const value = String(row[rawHeader] || '').trim();
      if (normalizedField === 'yearsOfExperience') {
        const num = parseFloat(value);
        employee.yearsOfExperience = isNaN(num) ? undefined : num;
      } else if (normalizedField === 'managerId') {
        // Split by comma or semicolon for multiple managers
        const parts = value.split(/[,;]+/).map(p => p.trim()).filter(Boolean);
        if (parts.length > 0) {
          employee.managerId = parts[0];
          employee.secondaryManagerIds = parts.slice(1);
        }
      } else {
        employee[normalizedField] = value;
      }
    }

    // Auto-gen ID if missing
    if (!hasIdField || !employee.id) {
      employee.id = String(autoId++);
    }

    // Auto-detect department from title if dept column is missing
    if (!employee.department && employee.title) {
      employee.department = inferDepartment(employee.title);
    }

    return employee;
  });

  // If managerId values are names (not IDs), convert to IDs
  const nameToId = {};
  employees.forEach(e => { nameToId[e.name] = e.id; });

  const managerValuesSample = employees.slice(0, 20).filter(e => e.managerId);
  const managersAreNames = managerValuesSample.some(e => nameToId[e.managerId]);

  if (managersAreNames) {
    employees.forEach(e => {
      // Primary manager
      if (e.managerId && nameToId[e.managerId]) {
        e.managerId = nameToId[e.managerId];
      } else if (e.managerId && !nameToId[e.managerId]) {
        // Could be an external reference or typo - clear it for root-level
        const match = employees.find(emp => emp.name.toLowerCase() === e.managerId.toLowerCase());
        if (match) {
          e.managerId = match.id;
        }
      }

      // Secondary managers
      if (e.secondaryManagerIds && e.secondaryManagerIds.length > 0) {
        e.secondaryManagerIds = e.secondaryManagerIds.map(managerName => {
          if (nameToId[managerName]) return nameToId[managerName];
          const match = employees.find(emp => emp.name.toLowerCase() === managerName.toLowerCase());
          return match ? match.id : managerName; // return resolved id or keep original if unfound
        });
      }
    });
  }

  return employees;
}

function inferDepartment(title) {
  const t = title.toLowerCase();
  if (t.includes('underwriting') || t.includes('underwriter')) return 'Underwriting';
  if (t.includes('claim')) return 'Claims';
  if (t.includes('sales') || t.includes('account') || t.includes('bancassurance') || t.includes('distribution')) return 'Sales & Distribution';
  if (t.includes('actuar')) return 'Actuarial';
  if (t.includes('financ') || t.includes('accounting') || t.includes('accountant') || t.includes('treasury') || t.includes('investment')) return 'Finance & Accounting';
  if (t.includes('software') || t.includes('developer') || t.includes('engineer') || t.includes('qa') || t.includes('data ') || t.includes('bi ') || t.includes('system') || t.includes('network') || t.includes('cyber') || t.includes('it ') || t.includes('information technology')) return 'Information Technology';
  if (t.includes('human resource') || t.includes('recruit') || t.includes('talent') || t.includes('training') || t.includes('l&d') || t.includes('payroll') || t.includes('benefit') || t.includes('compensation')) return 'Human Resources';
  if (t.includes('risk')) return 'Risk Management';
  if (t.includes('reinsurance')) return 'Risk Management';
  if (t.includes('compliance') || t.includes('legal') || t.includes('aml') || t.includes('kyc') || t.includes('counsel')) return 'Compliance & Legal';
  if (t.includes('marketing') || t.includes('brand') || t.includes('digital') || t.includes('seo') || t.includes('social media') || t.includes('content') || t.includes('graphic') || t.includes('communication')) return 'Marketing';
  if (t.includes('customer') || t.includes('call center') || t.includes('csr') || t.includes('cx ')) return 'Customer Service';
  if (t.includes('audit')) return 'Internal Audit';
  if (t.includes('product')) return 'Product Development';
  if (t.includes('administrat') || t.includes('facilit') || t.includes('procurement') || t.includes('office coordinator')) return 'Administration';
  if (t.includes('chief') || t.includes('ceo') || t.includes('coo') || t.includes('cfo') || t.includes('cto') || t.includes('cmo') || t.includes('cro') || t.includes('cco') || t.includes('chro')) return 'Executive';
  if (t.includes('director') || t.includes('vp ') || t.includes('branch manager')) return 'Operations';
  return 'General';
}
