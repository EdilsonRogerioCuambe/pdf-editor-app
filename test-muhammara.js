const muhammara = require('muhammara');
console.log('Muhammara loaded:', typeof muhammara);
try {
  // Create a minimal PDF to test writer
  const writer = muhammara.createWriter('./test_output.pdf');
  console.log('Writer created successfully');
  writer.end();
  console.log('Writer closed successfully');
} catch (e) {
  console.error('Error with muhammara:', e);
}
