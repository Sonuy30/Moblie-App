const fs = require('fs');
const path = require('path');

const razorpayGradlePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-razorpay',
  'android',
  'build.gradle'
);

if (fs.existsSync(razorpayGradlePath)) {
  let content = fs.readFileSync(razorpayGradlePath, 'utf8');
  if (!content.includes("namespace 'com.razorpay.rn'") && !content.includes('namespace "com.razorpay.rn"')) {
    content = content.replace(
      'android {',
      "android {\n    namespace 'com.razorpay.rn'"
    );
    fs.writeFileSync(razorpayGradlePath, content, 'utf8');
    console.log('[fix-razorpay] Added namespace declaration to react-native-razorpay build.gradle for AGP 8 compatibility');
  }
}
