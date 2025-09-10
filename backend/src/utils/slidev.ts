import fs from 'fs';
export async function readLayout(filepath: string) {
    const filecontent = await fs.promises.readFile(filepath, 'utf-8');
    const linebuffers = filecontent.split('\n');
    // 假设初始页面的 frontmatter 最多 20 页
    for (let i = 0; i < 20; i ++) {
        const line = linebuffers[i];
        if (line.startsWith('theme')) {
            const theme = line.split(':')[1].trim();
            return theme;
        }
    }

    return 'default';
}