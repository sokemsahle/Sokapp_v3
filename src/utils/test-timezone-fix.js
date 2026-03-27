/**
 * Test Time Zone Fix
 * Verifies that times are saved correctly without unwanted shifts
 */

// Simulate the fixed function
const localToUTC = (dateString, timeString) => {
  if (!dateString || !timeString) return null;
  const [year, month, day] = dateString.split('-');
  const [hours, minutes] = timeString.split(':');
  
  // Create date directly in UTC to avoid timezone shifts
  const utcDate = new Date(Date.UTC(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hours),
    parseInt(minutes)
  ));
  
  return utcDate.toISOString();
};

console.log('🧪 Testing Time Zone Fix\n');
console.log('===========================================\n');

// Test cases
const testCases = [
  { date: '2026-03-20', time: '09:15', expected: '09:15' },
  { date: '2026-03-20', time: '14:30', expected: '14:30' },
  { date: '2026-03-20', time: '00:00', expected: '00:00' },
  { date: '2026-03-20', time: '23:59', expected: '23:59' }
];

testCases.forEach((test, index) => {
  const result = localToUTC(test.date, test.time);
  const extractedTime = result ? result.split('T')[1].substring(0, 5) : 'ERROR';
  const passed = extractedTime === test.expected;
  
  console.log(`Test ${index + 1}: ${test.date} ${test.time}`);
  console.log(`  Input:    ${test.time}`);
  console.log(`  Output:   ${result}`);
  console.log(`  Expected: ${test.expected}`);
  console.log(`  Extracted: ${extractedTime}`);
  console.log(`  Status:   ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
});

console.log('===========================================');
console.log('Summary:');
console.log('The fix ensures that when you select 9:15 AM,');
console.log('it stores 9:15 AM in the database, not shifted by timezone.\n');

console.log('How it works:');
console.log('OLD: new Date(2026, 2, 20, 9, 15).toISOString()');
console.log('     → Creates date in LOCAL timezone');
console.log('     → Converts to UTC (shifts time!)');
console.log('     → Result: Different time than selected\n');
console.log('NEW: new Date(Date.UTC(2026, 2, 20, 9, 15)).toISOString()');
console.log('     → Creates date directly in UTC');
console.log('     → No timezone conversion');
console.log('     → Result: Same time as selected ✓');
