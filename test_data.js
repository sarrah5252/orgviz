// Investigate: who reports directly to the MD and is in Actuarial?
import fs from 'fs';
import { parseFile } from './api/services/parser.js';
import { buildTree } from './api/services/treeBuilder.js';

const buffer = fs.readFileSync('./SecureLife_Insurance_OrgData.xlsx');
const employees = parseFile(buffer, 'xlsx');
const result = buildTree(employees);

const tree = result.tree;

console.log('=== ROOT (Managing Director) ===');
console.log(`  ${tree.name} | ${tree.title} | Dept: ${tree.department} | ID: ${tree.id}`);

console.log('\n=== LEVEL 1: Direct reports to MD ===');
tree.children.forEach(c => {
  console.log(`  ${c.name} | ${c.title} | Dept: ${c.department} | ID: ${c.id} | Children: ${c.children.length}`);
});

console.log('\n=== LEVEL 2: Under each Level 1 ===');
tree.children.forEach(level1 => {
  if (level1.children.length > 0) {
    console.log(`\n  Under ${level1.name}:`);
    level1.children.forEach(c => {
      const isAct = c.department === 'Actuarial' ? ' *** ACTUARIAL ***' : '';
      console.log(`    ${c.name} | ${c.title} | Dept: ${c.department} | Children: ${c.children.length}${isAct}`);
    });
  }
});

// Find ALL Actuarial people and their position in the tree
console.log('\n=== ALL ACTUARIAL EMPLOYEES + THEIR TREE DEPTH ===');
function findActInTree(node, depth = 0) {
  if (node.department === 'Actuarial') {
    console.log(`  Depth ${depth}: ${node.name} | ${node.title} | Children: ${node.children.length}`);
  }
  node.children.forEach(c => findActInTree(c, depth + 1));
}
findActInTree(tree);

// Find Actuarial people who are direct children of the MD (level 1)
console.log('\n=== ACTUARIAL PEOPLE AT LEVEL 1 (direct reports to MD) ===');
const actLevel1 = tree.children.filter(c => c.department === 'Actuarial');
if (actLevel1.length > 0) {
  actLevel1.forEach(c => console.log(`  ${c.name} | ${c.title} | Team size: ${c.children.length}`));
} else {
  console.log('  NONE found at Level 1!');
  // Check Level 2
  console.log('\n=== ACTUARIAL PEOPLE AT LEVEL 2 ===');
  tree.children.forEach(l1 => {
    l1.children.filter(c => c.department === 'Actuarial').forEach(c => {
      console.log(`  ${c.name} | ${c.title} | Reports to: ${l1.name} | Team size: ${c.children.length}`);
      c.children.forEach(gc => console.log(`    └─ ${gc.name} | ${gc.title} | Team: ${gc.children.length}`));
    });
  });
}
