const easProfile = process.env.EAS_BUILD_PROFILE;
const useMockApi = process.env.EXPO_PUBLIC_USE_MOCK_API;

console.log(`[verify-build] Checking build environment...`);
console.log(`[verify-build] EAS_BUILD_PROFILE: ${easProfile}`);
console.log(`[verify-build] EXPO_PUBLIC_USE_MOCK_API: ${useMockApi}`);

if (easProfile === 'production') {
  if (useMockApi !== 'false' && useMockApi !== undefined) {
    console.error('❌ ERROR: EXPO_PUBLIC_USE_MOCK_API must be set to "false" or unset in production profile!');
    process.exit(1);
  }
}
process.exit(0);
