console.log('Node.js version:', process.version);
console.log('Current directory:', process.cwd());
try {
  console.log('Require test:', require.resolve('express'));
} catch (e) {
  console.error('Error requiring express:', e.message);
}
