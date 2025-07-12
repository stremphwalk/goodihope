// Test file to verify tab functionality in PMH and Impressions widgets

function testTabFunctionality() {
  console.log('Testing tab functionality...');
  
  // Test case 1: Basic tab functionality
  const testInput1 = `Diabetes mellitus type 2
- Well controlled on metformin
- Last HbA1c 7.2%

Hypertension
- Well controlled
- On lisinopril 10mg daily`;

  const expectedOutput1 = `1. Diabetes mellitus type 2
     - Well controlled on metformin
     - Last HbA1c 7.2%

2. Hypertension
     - Well controlled
     - On lisinopril 10mg daily`;

  // Test case 2: Mixed content with numbered and unnumbered lines
  const testInput2 = `1. Diabetes mellitus type 2
- Well controlled on metformin
- Last HbA1c 7.2%

Hypertension
- Well controlled`;

  const expectedOutput2 = `1. Diabetes mellitus type 2
     - Well controlled on metformin
     - Last HbA1c 7.2%

2. Hypertension
     - Well controlled`;

  // Test case 3: Lines starting with whitespace (should not be numbered)
  const testInput3 = `Diabetes mellitus type 2
     - Well controlled on metformin
     - Last HbA1c 7.2%

Hypertension
     - Well controlled`;

  const expectedOutput3 = `1. Diabetes mellitus type 2
     - Well controlled on metformin
     - Last HbA1c 7.2%

2. Hypertension
     - Well controlled`;

  function formatText(text) {
    if (!text) return '';
    
    const lines = text.split('\n');
    const formatted = [];
    let conditionCount = 0;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith('#')) {
        conditionCount++;
        const condition = line.replace('#', '').trim();
        formatted.push(`${conditionCount}. ${condition}`);
      } else if (line.startsWith('-')) {
        // Sub-point - preserve as indented with dash
        const detail = line.replace('-', '').trim();
        formatted.push(`     - ${detail}`);
      } else if (line.startsWith('--')) {
        // Sub-sub-detail (deeper indentation)
        const subDetail = line.replace('--', '').trim();
        formatted.push(`       - ${subDetail}`);
      } else {
        // Handle numbered lines and auto-numbering
        if (/^\d+\./.test(line)) {
          // Line already has a number, preserve it and track count
          const match = line.match(/^(\d+)\./);
          if (match) {
            const num = parseInt(match[1]);
            if (num > conditionCount) {
              conditionCount = num;
            }
          }
          formatted.push(line);
        } else if (line.match(/^\s+/)) {
          // Line starts with whitespace, preserve as-is (likely a sub-point or indented content)
          formatted.push(line);
        } else {
          // Auto-format as numbered condition
          conditionCount++;
          formatted.push(`${conditionCount}. ${line}`);
        }
      }
    }

    return formatted.join('\n');
  }

  // Run tests
  console.log('Test 1:');
  const result1 = formatText(testInput1);
  console.log('Input:', testInput1);
  console.log('Output:', result1);
  console.log('Expected:', expectedOutput1);
  console.log('Pass:', result1 === expectedOutput1);
  console.log('');

  console.log('Test 2:');
  const result2 = formatText(testInput2);
  console.log('Input:', testInput2);
  console.log('Output:', result2);
  console.log('Expected:', expectedOutput2);
  console.log('Pass:', result2 === expectedOutput2);
  console.log('');

  console.log('Test 3:');
  const result3 = formatText(testInput3);
  console.log('Input:', testInput3);
  console.log('Output:', result3);
  console.log('Expected:', expectedOutput3);
  console.log('Pass:', result3 === expectedOutput3);
  console.log('');

  console.log('All tests completed!');
}

// Run the test
testTabFunctionality(); 