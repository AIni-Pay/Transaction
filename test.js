import { TokenInstructionParser } from './src/utils/TokenInstructionParser.js';

// Simple test to verify the parser works
const parser = new TokenInstructionParser();

console.log('Testing TokenInstructionParser...\n');

// Test 1: Basic send instruction
const test1 = parser.parseInstruction("Envía 5 TIA a celestia1qnk2n4nlkpw9xfqntladh74w6ujtulwnmxnh3k");
console.log('Test 1 - Basic send:', JSON.stringify(test1, null, 2));

// Test 2: Missing information
const test2 = parser.parseInstruction("Manda tokens a celestia1qnk2n4nlkpw9xfqntladh74w6ujtulwnmxnh3k");
console.log('\nTest 2 - Missing amount:', JSON.stringify(test2, null, 2));

// Test 3: Non-send intent
const test3 = parser.parseInstruction("¿Qué es Celestia?");
console.log('\nTest 3 - Question:', JSON.stringify(test3, null, 2));

// Test 4: Address validation
const validAddress = parser.validateBech32Address("celestia1qnk2n4nlkpw9xfqntladh74w6ujtulwnmxnh3k");
const invalidAddress = parser.validateBech32Address("invalid123");
console.log('\nAddress validation:');
console.log('Valid address:', validAddress);
console.log('Invalid address:', invalidAddress);

console.log('\n✅ Parser tests completed!');