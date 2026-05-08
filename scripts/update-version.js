#!/usr/bin/env node
// 自动更新版本号脚本
const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '..', 'client', 'src', 'config', 'version.js');

function getCurrentVersion() {
    const content = fs.readFileSync(versionFile, 'utf8');
    const match = content.match(/VERSION = ['"]([^'"]+)['"]/);
    return match ? match[1] : 'v1.0.00';
}

function incrementVersion(version) {
    // 解析版本号 v1.0.05 -> [1, 0, 05]
    const parts = version.replace('v', '').split('.');
    const major = parseInt(parts[0]);
    const minor = parseInt(parts[1]);
    const patch = parseInt(parts[2]) + 1;

    return `v${major}.${minor}.${String(patch).padStart(2, '0')}`;
}

function getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function updateVersionFile(newVersion, timestamp) {
    const content = `// 版本配置 - 每次发布时自动更新
// 格式: v主版本.次版本.修订号
export const VERSION = '${newVersion}';
export const BUILD_TIMESTAMP = '${timestamp}';
`;
    fs.writeFileSync(versionFile, content, 'utf8');
    console.log(`✅ 版本更新: ${newVersion} (${timestamp})`);
}

async function main() {
    const currentVersion = getCurrentVersion();
    const newVersion = incrementVersion(currentVersion);
    const timestamp = getTimestamp();

    updateVersionFile(newVersion, timestamp);

    // Git add the changed file
    const { execSync } = require('child_process');
    try {
        execSync('git add client/src/config/version.js', { cwd: path.join(__dirname, '..') });
        console.log('✅ 已添加 version.js 到 Git');
    } catch (e) {
        console.log('⚠️ 无法添加到 Git:', e.message);
    }
}

main();
